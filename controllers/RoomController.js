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
const { sendPushNotification, sendRoomNotification, sendChatNotification } = require('./PushNotificationController');
const { Op } = require('sequelize');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
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
  ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex').slice(0, 32)
  : crypto.randomBytes(32);
const IV_LENGTH = 16;
const ALGORITHM = 'aes-256-cbc';

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
    return "(Decryption failed)";
  }
};

const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

let io;

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
      return res.status(501).json({ message: "Error uploading files", error: err.message });
    }

    const { name, type, description, status, created_by, member_ids, is_private_displayed } = req.body;

    let memberIdsArray = [];
    try {
      memberIdsArray = typeof member_ids === "string" ? JSON.parse(member_ids) : member_ids;
      // Ensure memberIdsArray is an array
      if (!Array.isArray(memberIdsArray)) {
        memberIdsArray = [memberIdsArray];
      }
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
        is_private_displayed: is_private_displayed || true,
        join_requests: [],
        created_date: new Date()
      });

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

      // Notify all members except creator
      if (memberIdsArray.length > 1) {
        try {
          const notificationReceiversIds = memberIdsArray.filter(id => id !== created_by && id);
          
          if (notificationReceiversIds.length > 0) {
            console.log(`[RoomController] Sending room creation notification to ${notificationReceiversIds.length} members`);
            
            const notificationResult = await sendRoomNotification({
              senderId: created_by,
              receiverIds: notificationReceiversIds,
              title: "You've been added to a new room",
              body: `${room.name}`,
              roomId: room.id,
              data: {
                action: 'room_created'
              }
            });
            
            console.log('[RoomController] Room creation notification result:', 
              notificationResult.success ? 
                `Success: ${notificationResult.successCount}/${notificationResult.totalRecipients}` : 
                `Failed: ${notificationResult.error?.message || 'Unknown error'}`
            );
          }
        } catch (notificationError) {
          console.error('[RoomController] Failed to send room creation notifications:', notificationError);
          // Don't fail the room creation if notification fails
        }
      }

      if (io) {
        io.emit('room_created', roomData);
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
          as: "members",
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
      
      if (roomData.Chats && roomData.Chats.length > 0) {
        roomData.last_message = {
          ...roomData.Chats[0],
          content: decrypt(roomData.Chats[0].content)
        };
      } else {
        roomData.last_message = null;
      }
      
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

// Add member to room
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

    // Get admin user for notification sender ID
    const admin_user_id = req.user ? req.user.id : (room.created_by || null);

    await sequelize.transaction(async (t) => {
      await room.increment("total_members", { transaction: t });
      await RoomMember.create({ room_id, user_id }, { transaction: t });

      if (is_invite_acceptance) {
        await InvitationController.removeUserFromInvitation(room_id, user_id);
      }

      const updatedRequests = Array.isArray(room.join_requests)
        ? room.join_requests.filter(id => id !== user_id)
        : [];
      await room.update({ join_requests: updatedRequests }, { transaction: t });
    });

    // Send notification to new member
    try {
      if (user_id) {
        const notificationResult = await sendRoomNotification({
          senderId: admin_user_id,
          receiverIds: [user_id],
          title: "Room Access Granted",
          body: `You've been added to ${room.name}`,
          roomId: room_id,
          data: {
            action: 'added_to_room'
          }
        });
        
        console.log('[RoomController] Add member notification result:', 
          notificationResult.success ? 
            `Success: ${notificationResult.successCount}/${notificationResult.totalRecipients}` : 
            `Failed: ${notificationResult.error?.message || 'Unknown error'}`
        );
      }
    } catch (notificationError) {
      console.error('[RoomController] Failed to send add member notification:', notificationError);
      // Don't fail the add member operation if notification fails
    }

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

// Accept join request
exports.acceptJoinRequest = async (req, res) => {
  const { room_id, user_id } = req.body;

  try {
    const room = await Room.findByPk(room_id);
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    const joinRequests = Array.isArray(room.join_requests)
      ? room.join_requests
      : JSON.parse(room.join_requests || '[]');

    if (!joinRequests.includes(user_id)) {
      return res.status(400).json({ success: false, message: "No join request found for this user" });
    }

    const updatedRequests = joinRequests.filter(id => id !== user_id);
    await room.update({ join_requests: JSON.stringify(updatedRequests) });

    await RoomMember.create({ room_id, user_id });

    // Get admin user for notification sender ID
    const admin_user_id = req.user ? req.user.id : (room.created_by || null);

    // Notify user their request was accepted
    try {
      if (user_id) {
        const notificationResult = await sendRoomNotification({
          senderId: admin_user_id,
          receiverIds: [user_id],
          title: "Join Request Accepted",
          body: `Your request to join ${room.name} has been approved`,
          roomId: room_id,
          data: {
            action: 'join_request_accepted'
          }
        });
        
        console.log('[RoomController] Join request accepted notification result:', 
          notificationResult.success ? 
            `Success: ${notificationResult.successCount}/${notificationResult.totalRecipients}` : 
            `Failed: ${notificationResult.error?.message || 'Unknown error'}`
        );
      }
    } catch (notificationError) {
      console.error('[RoomController] Failed to send join request accepted notification:', notificationError);
      // Don't fail the operation if notification fails
    }

    res.status(200).json({ success: true, message: "User added to room successfully" });
  } catch (error) {
    console.error("Error in acceptJoinRequest:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Request to join room
exports.requestToJoinRoom = async (req, res) => {
  const { room_id, user_id } = req.body;
  console.log('[requestToJoinRoom] Request body:', req.body);

  try {
    const room = await Room.findByPk(room_id);
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    const userIdNum = Number(user_id);
    if (isNaN(userIdNum)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    if (room.status === 'Public') {
      const existingMember = await RoomMember.findOne({ 
        where: { room_id, user_id: userIdNum } 
      });

      if (existingMember) {
        return res.status(400).json({ success: false, message: "User already in room" });
      }

      await RoomMember.create({ room_id, user_id: userIdNum });
      await room.increment("total_members");

      // Public room join notification
      try {
        const notificationResult = await sendRoomNotification({
          senderId: userIdNum,
          receiverIds: [userIdNum],
          title: "Room Joined",
          body: `You've joined ${room.name}!`,
          roomId: room_id,
          data: {
            action: 'room_joined'
          }
        });

        console.log('[RoomController] Public room join notification result:', 
          notificationResult.success ? 
            `Success: ${notificationResult.successCount}/${notificationResult.totalRecipients}` : 
            `Failed: ${notificationResult.error?.message || 'Unknown error'}`
        );
      } catch (notificationError) {
        console.error('[RoomController] Failed to send public room join notification:', notificationError);
      }

      return res.status(200).json({ success: true, message: "User added to public room" });
    }

    console.log('[requestToJoinRoom] Room status:', room.status);
    console.log('[requestToJoinRoom] Room is not public, checking join_requests...');

    let joinRequests = [];
    if (room.join_requests) {
      try {
        if (typeof room.join_requests === 'string') {
          const parsed = JSON.parse(room.join_requests);
          joinRequests = Array.isArray(parsed) ? parsed : [];
        } else if (Array.isArray(room.join_requests)) {
          joinRequests = [...room.join_requests];
        }
      } catch (e) {
        console.error('[requestToJoinRoom] Failed to parse join_requests:', e);
        joinRequests = [];
      }
    }

    const alreadyRequested = joinRequests.some(id => Number(id) === userIdNum);
    console.log('[requestToJoinRoom] Already requested:', alreadyRequested);

    if (!alreadyRequested) {
      joinRequests.push(userIdNum);
      try {
        await room.update({ join_requests: joinRequests });
      } catch (updateError) {
        console.error('[RoomController] Failed to update join_requests:', updateError);
      }
    }

    // Notify room creator instead of admins
    try {
      if (room.created_by) {
        const creator = await User.findByPk(room.created_by, {
          attributes: ['id', 'pushToken']
        });

        if (creator && creator.pushToken) {
          try {
            const notificationResult = await sendRoomNotification({
              senderId: userIdNum,
              receiverIds: [creator.id],
              title: "New Join Request",
              body: `A user wants to join ${room.name}`,
              roomId: room_id,
              data: { 
                action: "join_request", 
                requesterId: String(user_id) 
              }
            });

            console.log('[RoomController] Join request notification result:',
              notificationResult.success ?
                `Success: ${notificationResult.successCount}/${notificationResult.totalRecipients}` :
                `Failed: ${notificationResult.error?.message || 'Unknown error'}`
            );
          } catch (notificationError) {
            console.error('[RoomController] Failed to send join request notification to creator:', notificationError);
          }
        } else {
          console.log('[RoomController] Room creator not found or has no push token.');
        }
      } else {
        console.log('[RoomController] Room has no creator specified.');
      }
    } catch (e) {
      console.error('[RoomController] Error during creator notification:', e);
    }

    res.status(200).json({ success: true, message: "Join request processed" });
  } catch (error) {
    console.error('Error in requestToJoinRoom:', error);
    res.status(500).json({ 
      success: false, 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get join requests
exports.getJoinRequests = async (req, res) => {
  const { roomId } = req.params;

  try {
    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    let joinRequests = [];
    if (room.join_requests) {
      if (typeof room.join_requests === 'string') {
        try {
          joinRequests = JSON.parse(room.join_requests);
        } catch (e) {
          joinRequests = [];
        }
      } else if (Array.isArray(room.join_requests)) {
        joinRequests = room.join_requests;
      }
    }

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

// Remove member from room
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

    // Get admin user for notification sender ID
    const admin_user_id = req.user ? req.user.id : (room.created_by || null);

    // Notify removed user
    try {
      if (user_id) {
        const notificationResult = await sendRoomNotification({
          senderId: admin_user_id,
          receiverIds: [user_id],
          title: "Removed from Room",
          body: `You've been removed from ${room.name}`,
          roomId: room_id,
          data: {
            action: 'removed_from_room'
          }
        });
        
        console.log('[RoomController] Remove member notification result:', 
          notificationResult.success ? 
            `Success: ${notificationResult.successCount}/${notificationResult.totalRecipients}` : 
            `Failed: ${notificationResult.error?.message || 'Unknown error'}`
        );
      }
    } catch (notificationError) {
      console.error('[RoomController] Failed to send remove member notification:', notificationError);
    }

    const updatedRoom = await Room.findByPk(room_id, {
      include: [{
        model: RoomMember,
        as: "members",
        attributes: ["user_id"],
      }],
    });

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

// Get room users
exports.getRoomUsers = async (req, res) => {
  const { roomId } = req.params;

  try {
    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found"
      });
    }

    const roomMembers = await RoomMember.findAll({
      where: { room_id: roomId },
      attributes: ["user_id", "joined_at"]
    });

    const userDetails = await Promise.all(
      roomMembers.map(async (member) => {
        try {
          const user = await userService.getUserById(member.user_id);
          return {
            user_id: member.user_id,
            joined_at: member.joined_at,
            username: user?.username || "Unknown",
            email: user?.email || "Unknown",
            picture: user?.picture || null
          };
        } catch (err) {
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
    console.error("Error getting room users:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get room members
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
      name: `${member.User.firstName} ${member.User.lastName}`.trim() || member.User.username,
      avatar_url: member.User.picture || null,
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

// Delete room
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

    const memberIds = room.members.map(member => member.user_id);
    
    // Get admin user for notification sender ID
    const admin_user_id = req.user ? req.user.id : (room.created_by || null);

    // Notify all members before deletion
    try {
      if (memberIds.length > 0) {
        const notificationResult = await sendRoomNotification({
          senderId: admin_user_id,
          receiverIds: memberIds,
          title: "Room Deleted",
          body: `The room "${room.name}" has been deleted`,
          data: {
            action: 'room_deleted'
          }
        });
        
        console.log('[RoomController] Room deletion notification result:', 
          notificationResult.success ? 
            `Success: ${notificationResult.successCount}/${notificationResult.totalRecipients}` : 
            `Failed: ${notificationResult.error?.message || 'Unknown error'}`
        );
      }
    } catch (notificationError) {
      console.error('[RoomController] Failed to send room deletion notifications:', notificationError);
    }

    await sequelize.transaction(async (t) => {
      await RoomMember.destroy({
        where: { room_id: roomId },
        transaction: t
      });

      await Chat.destroy({
        where: { room_id: roomId },
        transaction: t
      });

      await room.destroy({ transaction: t });

      if (room.image_url) {
        try {
          const key = room.image_url.split('/').pop();
          await s3.deleteObject({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `community/${key}`
          }).promise();
        } catch (error) {
          console.error('Error deleting room image from S3:', error);
        }
      }
    });

    if (io) {
      io.emit('room_deleted', { roomId });
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

// Delete rooms by type
exports.deleteRoomsByType = async (req, res) => {
  const { type } = req.params;
  const { userId } = req.query;

  if (!type || !['group', 'direct'].includes(type)) {
    return res.status(400).json({
      success: false,
      message: "Invalid room type. Must be 'group' or 'direct'"
    });
  }

  try {
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

    const memberNotifications = {};
    rooms.forEach(room => {
      room.members.forEach(member => {
        if (!memberNotifications[member.user_id]) {
          memberNotifications[member.user_id] = [];
        }
        memberNotifications[member.user_id].push(room.id);
      });
    });

    await sequelize.transaction(async (t) => {
      const roomIds = rooms.map(room => room.id);

      await RoomMember.destroy({
        where: { room_id: roomIds },
        transaction: t
      });

      await Chat.destroy({
        where: { room_id: roomIds },
        transaction: t
      });

      await Room.destroy({
        where: { id: roomIds },
        transaction: t
      });

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

    // Notify members of deleted rooms
    await Promise.all(
      Object.entries(memberNotifications).map(async ([userId, roomIds]) => {
        const roomNames = rooms
          .filter(room => roomIds.includes(room.id))
          .map(room => room.name)
          .join(', ');

        await sendRoomNotification({
          senderId: req.user.id, // Assuming req.user contains the deleter
          receiverIds: [userId],
          title: "Rooms Deleted",
          body: `The following rooms have been deleted: ${roomNames}`,
          data: {
            action: 'rooms_deleted',
            roomIds
          }
        });
      })
    );

    if (io) {
      rooms.forEach(room => {
        io.emit('room_deleted', { roomId: room.id });
      });

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