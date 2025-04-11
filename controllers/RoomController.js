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
const { sendPushNotification } = require('./PushNotificationController');


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
        is_admin: user_id === created_by
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
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    const existingMember = await RoomMember.findOne({ where: { room_id, user_id } });
    if (existingMember) {
      return res.status(400).json({ success: false, message: "User already in room" });
    }

    // Add member
    await sequelize.transaction(async (t) => {
      await room.increment("total_members", { transaction: t });
      await RoomMember.create({ room_id, user_id }, { transaction: t });

      if (is_invite_acceptance) {
        await InvitationController.removeUserFromInvitation(room_id, user_id);
      }

      // Remove from join_requests if present
      const updatedRequests = Array.isArray(room.join_requests)
        ? room.join_requests.filter(id => id !== user_id)
        : [];
      await room.update({ join_requests: updatedRequests }, { transaction: t });
    });

    // Notify the new member
    await sendPushNotification({
      title: "Room Access Granted",
      body: `You've been added to ${room.name}`,
      userIds: [user_id],
      data: { type: "room_added", roomId: room_id }
    });

    // Socket updates (existing code)
    const updatedRoom = await Room.findByPk(room_id, { include: [{ model: RoomMember, as: "members" }] });
    if (io) {
      io.emit('room_updated', updatedRoom);
      io.emit(`user_${user_id}_rooms_updated`, { type: 'joined_room', room: updatedRoom });
    }

    res.status(201).json({ success: true, message: "Member added" });
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
  console.log(`[RoomController] Request to join - Room: ${room_id}, User: ${user_id}`);

  try {
    // 1. Fetch the room
    const room = await Room.findByPk(room_id);
    if (!room) {
      console.error(`[RoomController] Room not found: ${room_id}`);
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    console.log(`[RoomController] Room found - Type: ${room.type}, Status: ${room.status}`);

    // 2. Convert user_id to number for consistent comparison
    const userIdNum = Number(user_id);
    if (isNaN(userIdNum)) {
      console.error('[RoomController] Invalid user_id format');
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    // 3. Handle public rooms (auto-join)
    if (room.status === 'Public') {
      console.log('[RoomController] Handling public room join');
      const existingMember = await RoomMember.findOne({ 
        where: { room_id, user_id: userIdNum } 
      });
      
      if (existingMember) {
        console.log('[RoomController] User already in room');
        return res.status(400).json({ 
          success: false, 
          message: "User already in room" 
        });
      }

      // Add user to room
      await RoomMember.create({ room_id, user_id: userIdNum });
      await room.increment("total_members");

      // Send welcome notification to user
      const user = await User.findByPk(userIdNum);
      if (user && user.pushToken) {
        console.log('[RoomController] Sending welcome notification');
        await sendPushNotification({
          title: "Room Joined",
          body: `You've joined ${room.name}!`,
          userIds: [userIdNum],
          data: { type: "room_joined", roomId: room_id }
        });
      }

      return res.status(200).json({ 
        success: true, 
        message: "User added to public room" 
      });
    }

    // 4. Handle private room join requests
    console.log('[RoomController] Handling private room join request');
    
    // Robust join_requests parsing
    let joinRequests = [];
    if (room.join_requests) {
      try {
        // Handle string case
        if (typeof room.join_requests === 'string') {
          const parsed = JSON.parse(room.join_requests);
          joinRequests = Array.isArray(parsed) ? parsed : [];
          console.log('[RoomController] Parsed join_requests from string');
        } 
        // Handle array case
        else if (Array.isArray(room.join_requests)) {
          joinRequests = [...room.join_requests];
          console.log('[RoomController] Copied existing join_requests array');
        }
        // Handle unexpected cases
        else {
          console.warn('[RoomController] Unexpected join_requests format, initializing empty array');
          joinRequests = [];
        }
      } catch (e) {
        console.error('[RoomController] Error parsing join_requests:', e);
        joinRequests = [];
      }
    }

    console.log(`[RoomController] Current join requests (type: ${typeof joinRequests}):`, joinRequests);

    // Additional array validation
    if (!Array.isArray(joinRequests)) {
      console.error('[RoomController] joinRequests is not an array, forcing to array');
      joinRequests = [];
    }

    // Check if user already requested
    const alreadyRequested = joinRequests.some(id => Number(id) === userIdNum);
    console.log(`[RoomController] User already requested: ${alreadyRequested}`);

    if (!alreadyRequested) {
      console.log('[RoomController] Adding new join request');
      joinRequests.push(userIdNum);
      
      try {
        await room.update({ join_requests: joinRequests });
        console.log('[RoomController] Updated room with new join request');

        // Notify admins
        const adminRecords = await RoomMember.findAll({
          where: { 
            room_id, 
            is_admin: true 
          },
          raw: true
        });

        console.log(`[RoomController] Found ${adminRecords.length} admins`);

        if (adminRecords.length > 0) {
          const adminUsers = await User.findAll({
            where: {
              id: adminRecords.map(admin => admin.user_id),
              pushToken: { [Op.ne]: null }
            },
            attributes: ['id', 'pushToken']
          });

          console.log(`[RoomController] ${adminUsers.length} admins with push tokens`);

          if (adminUsers.length > 0) {
            await sendPushNotification({
              title: "New Join Request",
              body: `A user wants to join ${room.name}`,
              userIds: adminUsers.map(user => user.id),
              data: { 
                type: "join_request", 
                roomId: room_id, 
                requesterId: user_id 
              }
            });
            console.log('[RoomController] Sent notifications to admins');
          }
        }
      } catch (updateError) {
        console.error('[RoomController] Error updating join requests:', updateError);
        throw updateError;
      }
    }

    res.status(200).json({ 
      success: true, 
      message: "Join request processed" 
    });
  } catch (error) {
    console.error('[RoomController] Error in requestToJoinRoom:', {
      error: error.message,
      stack: error.stack,
      room_id,
      user_id
    });
    res.status(500).json({ 
      success: false, 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};



exports.getJoinRequests = async (req, res) => {
  const { roomId } = req.params;

  try {
    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    // Handle both string and array formats for join_requests
    let joinRequests = [];
    if (room.join_requests) {
      if (typeof room.join_requests === 'string') {
        try {
          joinRequests = JSON.parse(room.join_requests);
        } catch (e) {
          // If parsing fails, treat as empty array
          joinRequests = [];
        }
      } else if (Array.isArray(room.join_requests)) {
        joinRequests = room.join_requests;
      }
    }

    // Fetch user details for each join request
    const userDetails = await Promise.all(
      joinRequests.map(async (userId) => {
        const user = await User.findByPk(userId, {
          attributes: ['id', 'username', 'email', 'firstName', 'lastName', 'picture']
        });
        return user ? {
          user_id: user.id,
          username: user.username || `${user.firstName} ${user.lastName}`.trim() || user.email,
          email: user.email,
          picture: user.picture
        } : null;
      })
    );

    // Filter out any null values (users not found)
    const filteredRequests = userDetails.filter(request => request !== null);

    res.status(200).json({
      success: true,
      data: filteredRequests
    });
  } catch (error) {
    console.error("Error fetching join requests:", error);
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

exports.deleteRoomsByType = async (req, res) => {
  const { type } = req.params;
  const { userId } = req.query; // Optional: only delete rooms created by a specific user

  if (!type || !['group', 'direct'].includes(type)) {
    return res.status(400).json({
      success: false,
      message: "Invalid room type. Must be 'group' or 'direct'"
    });
  }

  try {
    // Find all rooms of the specified type
    const whereClause = { type };
    if (userId) {
      whereClause.created_by = userId;
    }

    const rooms = await Room.findAll({
      where: whereClause,
      include: [{
        model: RoomMember,
        as: "members",
        attributes: ["user_id"],
      }]
    });

    if (rooms.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No ${type} rooms found` + (userId ? ` for user ${userId}` : '')
      });
    }

    // Collect all member IDs for socket notifications
    const memberNotifications = {};
    rooms.forEach(room => {
      room.members.forEach(member => {
        if (!memberNotifications[member.user_id]) {
          memberNotifications[member.user_id] = [];
        }
        memberNotifications[member.user_id].push(room.id);
      });
    });

    // Start transaction for bulk deletion
    await sequelize.transaction(async (t) => {
      const roomIds = rooms.map(room => room.id);

      // Delete all room members for these rooms
      await RoomMember.destroy({
        where: { room_id: roomIds },
        transaction: t
      });

      // Delete all chats in these rooms
      await Chat.destroy({
        where: { room_id: roomIds },
        transaction: t
      });

      // Delete the rooms themselves
      await Room.destroy({
        where: { id: roomIds },
        transaction: t
      });

      // Delete any S3 images for these rooms
      const deletePromises = rooms
        .filter(room => room.image_url)
        .map(room => {
          const key = room.image_url.split('/').pop();
          return s3.deleteObject({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `community/${key}`
          }).promise().catch(error => {
            console.error(`Error deleting room image for room ${room.id}:`, error);
          });
        });

      await Promise.all(deletePromises);
    });

    // Emit socket events for room deletions
    if (io) {
      // Emit general room deleted events
      rooms.forEach(room => {
        io.emit('room_deleted', { roomId: room.id });
      });

      // Notify each member of their room deletions
      Object.entries(memberNotifications).forEach(([userId, roomIds]) => {
        io.emit(`user_${userId}_rooms_updated`, {
          type: 'rooms_deleted',
          roomIds
        });
      });
    }

    res.status(200).json({
      success: true,
      message: `Deleted ${rooms.length} ${type} rooms` + (userId ? ` created by user ${userId}` : ''),
      data: {
        count: rooms.length,
        roomIds: rooms.map(room => room.id)
      }
    });

  } catch (error) {
    console.error('Error deleting rooms by type:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = exports;
