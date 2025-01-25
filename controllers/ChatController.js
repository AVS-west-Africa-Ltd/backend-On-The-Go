const Chat = require("../models/Chat");
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

    const { room_id, sender_id, content, request = false } = req.body; // Include `request`

    try {
      const isMember = await RoomMember.findOne({
        where: { room_id, user_id: sender_id }
      });

      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: "You are not a member of this room"
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
        request // Add `request` to the created message
      });

      if (io) {
        io.emit(`room_${room_id}`, {
          id: message.id,
          room_id,
          sender_id,
          content: content || '',
          media_url,
          status: 'sent',
          request, // Include `request` in the broadcasted message
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

// Get user's rooms/conversations
exports.getUserConversations = async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({
      success: false,
      message: "User ID is required"
    });
  }

  try {
    const rooms = await Room.findAll({
      include: [
        {
          model: RoomMember,
          as: 'members',
          where: { user_id },
          attributes: ['joined_at'],
          required: true
        },
        {
          model: Chat,
          separate: true, // This will perform a separate query for chats
          limit: 1,
          order: [['timestamp', 'DESC']], // Get the most recent message
          attributes: [
            'id',
            'content',
            'sender_id',
            'media_url',
            'status',
            'timestamp',
            'createdAt'
          ],
          required: false
        }
      ],
      attributes: [
        'id',
        'name',
        'type',
        'image_url',
        'status',
        'total_members',
        'created_by',
        'createdAt',
        'updatedAt'
      ],
      order: [['updatedAt', 'DESC']] // Order rooms by last update
    });

    // Transform the data to a more friendly format
    const formattedRooms = rooms.map(room => {
      const roomData = room.get({ plain: true });
      const latestMessage = roomData.Chats?.[0] || null;

      let latestMessageContent = null;

      // Check if there's a message and if it's an image (based on media_url presence)
      if (latestMessage) {
        if (latestMessage.media_url) {
          latestMessageContent = "Photo"; // If it's an image, return "Photo"
        } else {
          latestMessageContent = latestMessage.content; // Otherwise, return the message content
        }
      }

      return {
        id: roomData.id,
        name: roomData.name,
        type: roomData.type,
        image_url: roomData.image_url,
        status: roomData.status,
        total_members: roomData.total_members,
        created_by: roomData.created_by,
        joined_at: roomData.members[0]?.joined_at,
        latest_message: latestMessage ? {
          id: latestMessage.id,
          content: latestMessageContent, // Use the modified content
          sender_id: latestMessage.sender_id,
          media_url: latestMessage.media_url,
          status: latestMessage.status,
          timestamp: latestMessage.timestamp
        } : null
      };
    });

    res.status(200).json({
      success: true,
      data: {
        rooms: formattedRooms,
        total: formattedRooms.length
      }
    });
  } catch (error) {
    console.error('Error fetching user conversations:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching conversations",
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