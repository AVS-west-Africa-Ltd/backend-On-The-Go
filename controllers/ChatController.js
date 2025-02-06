const Chat = require("../models/Chat");
const User = require("../models/User");
const Room = require("../models/Room");
const RoomMember = require("../models/RoomMember");
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { io } = require('../app');
const multer = require("multer");
const path = require("path");

// Multer storage configuration for chat images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/chat/");
  },
  filename: function (req, file, cb) {
    const uniqueName = `chat-${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

exports.getRoomMessages = async (req, res) => {
  const { roomId } = req.params;
  const { userId } = req.query; // For verification purposes

  const { limit = 5 } = req.query; // Default limit to 5

  try {
    // Verify user is a member of the room
    const isMember = await RoomMember.findOne({
      where: {
        room_id: roomId,
        user_id: userId
      }
    });

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this room"
      });
    }

    const messages = await Chat.findAll({
      where: { room_id: roomId },
      order: [["timestamp", "DESC"]],
      limit: parseInt(limit, 10), // Convert limit to integer
      attributes: [
        'id',
        'content',
        'sender_id',
        'media_url',
        'status',
        'timestamp',
        'createdAt',
        'updatedAt'
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        messages: messages.reverse(), // Reverse to get the latest messages first
        total: messages.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  const uploadHandler = upload.single("media");

  uploadHandler(req, res, async (err) => {
    if (err) {
      console.error("Error uploading file:", err);
      return res.status(400).json({
        success: false,
        message: err instanceof multer.MulterError
          ? "File upload error"
          : err.message
      });
    }

    const { room_id, sender_id, content, request = false } = req.body;

    try {
      // First check if user is a member of the room
      const memberInfo = await RoomMember.findOne({
        where: { room_id, user_id: sender_id }
      });

      if (!memberInfo) {
        return res.status(403).json({
          success: false,
          message: "You are not a member of this room"
        });
      }

      // Get room details including broadcast status
      const room = await Room.findOne({
        where: { id: room_id }
      });

      if (!room) {
        return res.status(403).json({
          success: false,
          message: "Room not found"
        });
      }

      // Check broadcast permissions
      if (room.broadcast_enabled && !memberInfo.is_admin) {
        return res.status(403).json({
          success: false,
          message: "Only administrators can send messages when broadcast mode is enabled"
        });
      }

      let media_url = null;
      if (req.file) {
        media_url = `${req.protocol}://${req.get("host")}/uploads/chat/${req.file.filename}`;
      }

      const message = await Chat.create({
        room_id,
        sender_id,
        content: content || '',
        media_url,
        status: 'sent',
        request
      });

      if (io) {
        io.emit(`room_${room_id}`, {
          id: message.id,
          room_id,
          sender_id,
          content: content || '',
          media_url,
          status: 'sent',
          request,
          timestamp: message.createdAt
        });
      }

      res.status(201).json({
        success: true,
        message: "Message sent successfully",
        data: message,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
};

// Get messages in a room
exports.getMessages = async (req, res) => {
  const { room_id, user_id, limit = 5 } = req.query; // Default limit to 10

  try {
    // Verify user is a member of the room
    const isMember = await RoomMember.findOne({
      where: { room_id, user_id }
    });

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this room"
      });
    }

    const messages = await Chat.findAll({
      where: { room_id },
      order: [["timestamp", "DESC"]],
      limit: parseInt(limit, 10), // Convert limit to integer
      include: [{
        model: Room,
        attributes: ['name', 'type']
      }]
    });

    res.status(200).json({
      success: true,
      data: messages.reverse(), // Reverse to get the latest messages first
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


exports.toggleBroadcast = async (req, res) => {
  try {
    const { room_id, user_id, broadcast_enabled } = req.body;

    if (!room_id || !user_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters: room_id or user_id"
      });
    }

    // Find the room
    const room = await Room.findByPk(room_id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found"
      });
    }

    // Check if user is an admin
    const isAdmin = await RoomMember.findOne({
      where: { room_id, user_id, is_admin: true }
    });

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only an admin can toggle the broadcast feature"
      });
    }

    // Update broadcast setting
    room.broadcast_enabled = broadcast_enabled;
    await room.save();

    return res.status(200).json({
      success: true,
      message: `Broadcast feature ${broadcast_enabled ? 'enabled' : 'disabled'}`,
      data: room
    });
  } catch (error) {
    console.error('Error toggling broadcast:', error);
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

exports.getBroadcastStatus = async (req, res) => {
  try {
    const { room_id } = req.params;  // Extract room_id from URL

    if (!room_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameter: room_id"
      });
    }

    // Find the room
    const room = await Room.findByPk(room_id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found"
      });
    }

    // Return the current broadcast state
    return res.status(200).json({
      success: true,
      broadcast_enabled: room.broadcast_enabled
    });
  } catch (error) {
    console.error('Error fetching broadcast status:', error);
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};
exports.getRoomMembers = async (req, res) => {
  const { room_id, limit = 5 } = req.query;

  console.log("Received room_id:", room_id); // Debugging log

  if (!room_id) {
      return res.status(400).json({
          success: false,
          message: "room_id is required"
      });
  }

  try {
      const members = await RoomMember.findAll({
          where: { room_id },
          limit: parseInt(limit, 10),
          include: [{
              model: User,
              as: 'user',
              attributes: ['id', 'firstName', 'lastName', 'username', 'picture'],
          }],
          order: [['joined_at', 'DESC']]
      });

      const formattedMembers = members.map(member => ({
          id: member.user.id,
          name: `${member.user.firstName} ${member.user.lastName}`.trim() || member.user.username,
          avatar_url: member.user.picture || 'https://yourapp.com/default-avatar.png',
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

// Delete a message
exports.deleteMessage = async (req, res) => {
  const { id, sender_id, room_id } = req.body;

  try {
    const message = await Chat.findOne({
      where: {
        id,
        sender_id,
        room_id
      }
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    await message.destroy();
    res.status(200).json({
      success: true,
      message: "Message deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.uploadMiddleware = upload;