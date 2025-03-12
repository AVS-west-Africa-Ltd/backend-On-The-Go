const fs = require("fs");
const Room = require("../models/Room");
const RoomMember = require("../models/RoomMember");
const User = require('../models/User'); 
const path = require("path");
const multer = require("multer");
const InvitationController = require("./InvitationController");
const { sequelize } = require("../models/Room");
const Chat = require('../models/Chat');
const AWS = require("aws-sdk");
const multerS3 = require("multer-s3");
const crypto = require('crypto');


const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    // acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, `community/${Date.now()}-${file.originalname}`);
    },
  })
});

// Encryption configuration
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY 
  ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex').slice(0, 32) // Convert hex to buffer and ensure 32 bytes
  : crypto.randomBytes(32); // Generate random 32 bytes if no key provided
const IV_LENGTH = 16;
const ALGORITHM = 'aes-256-cbc';

// Decryption function directly in RoomController.js
const decrypt = (text) => {
  if (!text) return text;
  const [ivHex, encryptedHex] = text.split(':');
  if (!ivHex || !encryptedHex) return text;
  try {
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error("Decryption error:", error);
    return "(Decryption failed)"; // Fallback message if decryption fails
  }
};

// Ensure the uploads directory exists
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage and configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Upload directory
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

let io;

// Function to set up socket instance
exports.initializeSocket = (socketIO) => {
  io = socketIO;
};

const userService = require("../services/UserService");

// Create a new room
exports.createRoom = async (req, res) => {
  const uploadHandler = upload.single("image_url");

  uploadHandler(req, res, async (err) => {
    if (err) {
      console.error("Error uploading files:", err);
      return res
        .status(501)
        .json({ message: "Error uploading files", error: err.message });
    }

    console.log("Uploaded file:", req.file);

    const { name, type, description, status, created_by, member_ids, is_private_displayed } = req.body;

    let memberIdsArray = [];
    try {
      memberIdsArray = typeof member_ids === "string" ? JSON.parse(member_ids) : member_ids;
    } catch (error) {
      return res.status(400).json({ success: false, message: "Invalid member_ids format" });
    }

    try {
      let media = null;

      if (req.file) {
        media = req.file.location.toString();
      }

      const room = await Room.create({
        name,
        type,
        description,
        image_url: media,
        status,
        created_by,
        total_members: memberIdsArray.length,
        is_private_displayed: is_private_displayed || true, // Default to true if not provided
        join_requests: [], // Initialize join_requests as an empty array
        created_date: new Date() // Explicitly set the creation date
      });

      // Add members to the room
      const roomMembers = memberIdsArray.map((user_id) => ({
        room_id: room.id,
        user_id,
      }));

      await RoomMember.bulkCreate(roomMembers);

      const roomData = {
        ...room.toJSON(),
        members: roomMembers,
      };

      // Emit socket events for room creation
      if (io) {
        // Emit to all clients
        io.emit('room_created', roomData);

        // Emit specific events to room members
        memberIdsArray.forEach(userId => {
          io.emit(`user_${userId}_rooms_updated`, {
            type: 'new_room',
            room: roomData
          });
        });
      }

      res.status(201).json({
        success: true,
        message: "Room created successfully",
        data: roomData,
      });
    } catch (error) {
      console.error("Error creating room:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
};
// Get all rooms
exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.findAll({
      include: [
        {
          model: RoomMember,
          as: "members", // Use 'members' alias from associations.js
          attributes: ["user_id"],
        },
      ],
      attributes: [
        "id",
        "name",
        "type",
        "description",
        "image_url",
        "status",
        "total_members",
        "created_by",
        "is_private_displayed",
        "join_requests",
      ],
    });

    res.status(200).json({
      success: true,
      message: "Rooms retrieved successfully",
      data: rooms,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
// Get rooms for a specific user
exports.getUserRooms = async (req, res) => {
  const { userId } = req.params;

  try {
    const rooms = await Room.findAll({
      include: [
        {
          model: RoomMember,
          as: "members",
          where: { user_id: userId },
          attributes: [],
        },
        {
          model: Chat,
          as: "Chats",
          attributes: ['content', 'timestamp', 'sender_id'],
          order: [['timestamp', 'DESC']],
          limit: 1,
        },
      ],
      attributes: [
        "id",
        "name",
        "type",
        "description",
        "image_url",
        "status",
        "total_members",
        "created_by",
        "is_private_displayed",
        "join_requests",
      ],
    });

    const formattedRooms = rooms.map(room => {
      const roomData = room.toJSON();
      
      // Check if there's a last message and decrypt it
      if (roomData.Chats && roomData.Chats.length > 0) {
        roomData.last_message = {
          ...roomData.Chats[0],
          content: decrypt(roomData.Chats[0].content) // Using local decrypt function
        };
      } else {
        roomData.last_message = null;
      }
      
      // Remove the Chats array to clean up the response
      delete roomData.Chats;
      
      return roomData;
    });

    res.status(200).json({
      success: true,
      message: "User rooms retrieved successfully",
      data: formattedRooms,
    });
  } catch (error) {
    console.error("Error fetching user rooms:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
exports.getRoomById = async (req, res) => {
  const { roomId } = req.params;

  try {
    const room = await Room.findByPk(roomId, {
      attributes: [
        "id",
        "name",
        "total_members",
        "image_url",
        "status",
        "description",
        "created_by",
        "is_private_displayed",
        "join_requests",
      ],
      include: [
        {
          model: RoomMember,
          as: "members",
          attributes: ["user_id"],
        },
      ],
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Room retrieved successfully",
      data: room,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
// Rest of the code remains the same
exports.addMember = async (req, res) => {
  const { room_id, user_id, is_invite_acceptance = false } = req.body;

  try {
    const room = await Room.findByPk(room_id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const existingMember = await RoomMember.findOne({
      where: { room_id, user_id },
    });

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: "User is already a member of the room",
      });
    }

    // Start transaction
    const result = await sequelize.transaction(async (t) => {
      // Add member to room
      await room.increment("total_members", { by: 1 }, { transaction: t });

      const member = await RoomMember.create({
        room_id,
        user_id,
      }, { transaction: t });

      // If this is an invite acceptance, remove user from invitees
      if (is_invite_acceptance) {
        await InvitationController.removeUserFromInvitation(room_id, user_id);
      }

      // Remove user from join_requests if they were in the list
      const joinRequests = Array.isArray(room.join_requests) ? room.join_requests : [];
      const updatedRequests = joinRequests.filter(id => id !== user_id);
      await room.update({ join_requests: updatedRequests }, { transaction: t });

      return member;
    });

    // Get updated room data
    const updatedRoom = await Room.findByPk(room_id, {
      include: [{
        model: RoomMember,
        as: "members",
        attributes: ["user_id"],
      }],
    });

    // Emit socket events for member addition
    if (io) {
      io.emit('room_updated', updatedRoom);
      io.emit(`user_${user_id}_rooms_updated`, {
        type: 'joined_room',
        room: updatedRoom
      });
    }

    res.status(201).json({
      success: true,
      message: "Member added successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.acceptJoinRequest = async (req, res) => {
  const { room_id, user_id } = req.body;

  try {
    const room = await Room.findByPk(room_id);

    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    // Ensure join_requests is an array
    const joinRequests = Array.isArray(room.join_requests)
      ? room.join_requests
      : JSON.parse(room.join_requests || '[]');

    if (!joinRequests.includes(user_id)) {
      return res.status(400).json({ success: false, message: "No join request found for this user" });
    }

    // Remove user from join requests
    const updatedRequests = joinRequests.filter(id => id !== user_id);
    await room.update({ join_requests: JSON.stringify(updatedRequests) });  // Save as JSON string

    // Add user to room members
    await RoomMember.create({ room_id, user_id });

    res.status(200).json({ success: true, message: "User added to room successfully" });
  } catch (error) {
    console.error("Error in acceptJoinRequest:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.requestToJoinRoom = async (req, res) => {
  const { room_id, user_id } = req.body;

  try {
    const room = await Room.findByPk(room_id);

    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    // If the room is public, directly add the user to the room
    if (room.status === 'Public') {
      // Check if the user is already a member
      const existingMember = await RoomMember.findOne({
        where: { room_id, user_id },
      });

      if (existingMember) {
        return res.status(400).json({
          success: false,
          message: "User is already a member of the room",
        });
      }

      // Add the user to the room
      await RoomMember.create({ room_id, user_id });
      await room.increment("total_members", { by: 1 });

      return res.status(200).json({
        success: true,
        message: "User successfully joined the public room",
      });
    }

    // If the room is private, handle join requests
    if (room.status !== 'Private' || !room.is_private_displayed) {
      return res.status(400).json({ success: false, message: "Invalid room type" });
    }

    // Ensure join_requests is always an array
    const joinRequests = Array.isArray(room.join_requests) ? room.join_requests : [];

    // Check if the user has already requested to join
    if (!joinRequests.includes(user_id)) {
      joinRequests.push(user_id);
      await room.update({ join_requests: joinRequests });
    }

    res.status(200).json({ success: true, message: "Join request sent successfully" });
  } catch (error) {
    console.error("Error in requestToJoinRoom:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
exports.getJoinRequests = async (req, res) => {
  const { roomId } = req.params;

  try {
    console.log(`[getJoinRequests] Fetching join requests for roomId: ${roomId}`);

    const room = await Room.findByPk(roomId, {
      attributes: ['id', 'join_requests']
    });

    if (!room) {
      console.warn(`[getJoinRequests] Room not found for roomId: ${roomId}`);
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    // Handle join_requests as a string or an array
    let joinRequests = [];
    if (room.join_requests) {
      if (typeof room.join_requests === 'string') {
        if (room.join_requests.trim() === '[]') {
          joinRequests = [];  // If it's the string "[]", use an empty array
        } else {
          joinRequests = JSON.parse(room.join_requests);  // Parse if it's a JSON string
        }
      } else if (Array.isArray(room.join_requests)) {
        joinRequests = room.join_requests;
      }
    }

    console.log(`[getJoinRequests] Parsed joinRequests:`, joinRequests);

    // If no join requests, return an empty array directly
    if (joinRequests.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // Fetch user details for each join request
    const userRequests = await Promise.all(
      joinRequests.map(async (userId) => {
        const user = await User.findByPk(userId, {
          attributes: ['id', 'username', 'email', 'firstName', 'lastName', 'picture']
        });
        if (user) {
          return {
            user_id: user.id,
            username: user.username || `${user.firstName} ${user.lastName}`.trim() || user.email,
            email: user.email,
            picture: user.picture
          };
        } else {
          console.warn(`[getJoinRequests] User not found for userId: ${userId}`);
          return null;
        }
      })
    );

    // Filter out null values if some users are not found
    const filteredRequests = userRequests.filter((user) => user !== null);

    console.log(`[getJoinRequests] Detailed join requests:`, filteredRequests);

    res.status(200).json({
      success: true,
      data: filteredRequests,
    });
  } catch (error) {
    console.error(`[getJoinRequests] Error fetching join requests for roomId: ${roomId}`, error);
    res.status(500).json({ success: false, error: error.message });
  }
};


// Remove member with socket emission
exports.removeMember = async (req, res) => {
  const { room_id, user_id } = req.body;

  try {
    const member = await RoomMember.findOne({
      where: { room_id, user_id },
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found in room",
      });
    }

    const room = await Room.findByPk(room_id);
    await room.decrement("total_members", { by: 1 });
    await member.destroy();

    // Get updated room data
    const updatedRoom = await Room.findByPk(room_id, {
      include: [{
        model: RoomMember,
        as: "members",
        attributes: ["user_id"],
      }],
    });

    // Emit socket events for member removal
    if (io) {
      io.emit('room_updated', updatedRoom);
      io.emit(`user_${user_id}_rooms_updated`, {
        type: 'left_room',
        room: updatedRoom
      });
    }

    res.status(200).json({
      success: true,
      message: "Member removed successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
// New endpoint to get all users in a room
exports.getRoomUsers = async (req, res) => {
  const { roomId } = req.params;
  console.log(`[INFO] Received request to get users for room ID: ${roomId}`);

  try {
    console.log(`[INFO] Fetching room details for room ID: ${roomId}`);
    const room = await Room.findByPk(roomId);

    if (!room) {
      console.log(`[ERROR] Room with ID ${roomId} not found.`);
      return res.status(404).json({
        success: false,
        message: "Room not found"
      });
    }

    console.log(`[INFO] Room found: ${room.name}, Total Members: ${room.total_members}`);

    console.log(`[INFO] Fetching room members for room ID: ${roomId}`);
    const roomMembers = await RoomMember.findAll({
      where: { room_id: roomId },
      attributes: ["user_id", "joined_at"]
    });

    console.log(`[INFO] Found ${roomMembers.length} members in the room.`);
    console.log(`[INFO] Fetching user details for each member...`);

    const userDetails = await Promise.all(
      roomMembers.map(async (member) => {
        try {
          console.log(`[INFO] Fetching user data for user ID: ${member.user_id}`);
          const user = await userService.getUserById(member.user_id);

          if (!user) {
            console.log(`[WARNING] User with ID ${member.user_id} not found.`);
            return {
              user_id: member.user_id,
              joined_at: member.joined_at,
              username: "Unknown",
              email: "Unknown",
              picture: null
            };
          }

          return {
            user_id: member.user_id,
            joined_at: member.joined_at,
            username: user.username || "Unknown",
            email: user.email || "Unknown",
            picture: user.picture || null
          };
        } catch (err) {
          console.error(`[ERROR] Failed to fetch user ID ${member.user_id}: ${err.message}`);
          return {
            user_id: member.user_id,
            joined_at: member.joined_at,
            username: "Error fetching user",
            email: "Error fetching user",
            picture: null
          };
        }
      })
    );

    console.log(`[SUCCESS] Successfully retrieved users for room ID: ${roomId}`);

    res.status(200).json({
      success: true,
      message: "Room users retrieved successfully",
      data: {
        room_id: roomId,
        room_name: room.name,
        total_members: room.total_members,
        join_requests: room.join_requests,
        users: userDetails
      }
    });
  } catch (error) {
    console.error(`[ERROR] Failed to get room users: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
exports.getRoomMembers = async (req, res) => {
  const { room_id, limit = 5 } = req.query;

  try {
    const members = await RoomMember.findAll({
      where: { room_id },
      limit: parseInt(limit, 10),
      include: [{
        model: User,
        attributes: ['id', 'firstName', 'lastName', 'username', 'picture'],
      }],
      order: [['joined_at', 'DESC']]
    });

    const formattedMembers = members.map(member => ({
      id: member.User.id,
      name: `${member.User.firstName} ${member.User.lastName}`.trim() || member.User.username, // Fallback to username if no name
      avatar_url: member.User.picture || DEFAULT_AVATAR_URL,
      is_admin: member.is_admin
    }));

    res.status(200).json({
      success: true,
      data: {
        members: formattedMembers,
        total: formattedMembers.length
      }
    });
  } catch (error) {
    console.error('Error fetching room members:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching room members",
      error: error.message
    });
  }
};

exports.deleteRoom = async (req, res) => {
  const { roomId } = req.params;

  try {
    const room = await Room.findByPk(roomId, {
      include: [{
        model: RoomMember,
        as: "members",
        attributes: ["user_id"],
      }]
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found"
      });
    }

    // Get list of member IDs before deletion for socket notifications
    const memberIds = room.members.map(member => member.user_id);

    // Start transaction for atomic operations
    await sequelize.transaction(async (t) => {
      // Delete all room members
      await RoomMember.destroy({
        where: { room_id: roomId },
        transaction: t
      });

      // Delete all chats in the room
      await Chat.destroy({
        where: { room_id: roomId },
        transaction: t
      });

      // Delete the room itself
      await room.destroy({ transaction: t });

      // If room has an image in S3, delete it
      if (room.image_url) {
        try {
          const key = room.image_url.split('/').pop();
          await s3.deleteObject({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `community/${key}`
          }).promise();
        } catch (error) {
          console.error('Error deleting room image from S3:', error);
          // Continue with room deletion even if image deletion fails
        }
      }
    });

    // Emit socket events for room deletion
    if (io) {
      // Emit general room deleted event
      io.emit('room_deleted', { roomId });

      // Notify each member of the room deletion
      memberIds.forEach(userId => {
        io.emit(`user_${userId}_rooms_updated`, {
          type: 'room_deleted',
          roomId
        });
      });
    }

    res.status(200).json({
      success: true,
      message: "Room and all associated data deleted successfully"
    });

  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
module.exports = exports;
