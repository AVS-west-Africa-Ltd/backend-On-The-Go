const Chat = require("../models/Chat");
const User = require("../models/User");
const Room = require("../models/Room");
const RoomMember = require("../models/RoomMember");
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { io } = require('../app');
const multer = require("multer");
const path = require("path");
const AWS = require("aws-sdk");
const multerS3 = require("multer-s3");
const crypto = require('crypto');
const { sendChatNotification } = require('./PushNotificationController');

// Encryption configuration
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
  ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex').slice(0, 32) // Convert hex to buffer and ensure 32 bytes
  : crypto.randomBytes(32); // Generate random 32 bytes if no key provided
const IV_LENGTH = 16;
const ALGORITHM = 'aes-256-cbc';

// Encryption utility functions
const encrypt = (text) => {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
};

const decrypt = (text) => {
  if (!text) return text;
  const [ivHex, encryptedHex] = text.split(':');
  if (!ivHex || !encryptedHex) return text;
  const iv = Buffer.from(ivHex, 'hex');
  const encryptedText = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};
// AWS S3 Configuration
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Multer configuration for file uploads
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, `chat/${Date.now()}-${file.originalname}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Send a message
exports.sendMessage = async (req, res) => {
  const uploadHandler = upload.single("media");

  uploadHandler(req, res, async (err) => {
    if (err) {
      console.error("Error uploading file:", err);
      return res.status(400).json({ success: false, message: "File upload error", error: err.message });
    }

    const { room_id, sender_id, content, request = false } = req.body;

    try {
      // Verify room membership
      const memberInfo = await RoomMember.findOne({ where: { room_id, user_id: sender_id } });
      if (!memberInfo) {
        return res.status(403).json({ success: false, message: "You are not a member of this room" });
      }

      // Check room existence and broadcast permissions
      const room = await Room.findOne({ where: { id: room_id } });
      if (!room) {
        return res.status(404).json({ success: false, message: "Room not found" });
      }

      // Check if broadcast is enabled and if sender is not the room creator
      if (room.broadcast_enabled && String(room.created_by) !== String(sender_id)) {
        return res.status(403).json({ 
          success: false, 
          message: "Only room creator can send messages when broadcast mode is enabled" 
        });
      }

      // Create and encrypt message
      let media_url = req.file ? req.file.location : null;
      const encryptedContent = encrypt(content || "");
      const message = await Chat.create({
        room_id,
        sender_id,
        content: encryptedContent,
        media_url,
        status: "sent",
        request,
      });

      // Prepare message for socket emission
      const messageForSocket = {
        ...message.toJSON(),
        content: decrypt(message.content)
      };

      // Emit to socket if available
      if (io) {
        io.emit(`room_${room_id}`, messageForSocket);
      }

      // Send push notifications to other room members (excluding sender)
      try {
        // Get all room members except sender
        const roomMembers = await RoomMember.findAll({
          where: {
            room_id,
            user_id: { [Op.ne]: sender_id } // Exclude sender
          },
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'pushToken']
          }]
        });

        // Filter members who have push tokens
        const recipients = roomMembers
          .filter(member => member.user.pushToken)
          .map(member => member.user.id);

        if (recipients.length > 0) {
          const mediaType = req.file ?
            req.file.mimetype.split('/')[0] === 'image' ? 'image' :
              req.file.mimetype.split('/')[1] : null;

          await sendChatNotification({
            senderId: sender_id,
            recipientIds: recipients,
            roomId: room_id,
            message: content,
            mediaType,
            customData: {
              messageId: message.id,
              isRequest: request
            }
          });
        }
      } catch (notificationError) {
        console.error('Error sending push notifications:', notificationError);
        // Don't fail the message send operation if notifications fail
      }

      res.status(201).json({
        success: true,
        message: "Message sent successfully",
        data: messageForSocket
      });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
};

// Get messages for a specific room
exports.getRoomMessages = async (req, res) => {
  const { roomId } = req.params;
  const { userId } = req.query;
  const { limit = 50, offset = 0 } = req.query;

  try {
    // Verify room membership
    const isMember = await RoomMember.findOne({
      where: { room_id: roomId, user_id: userId }
    });

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this room"
      });
    }

    // Fetch messages with pagination
    const messages = await Chat.findAndCountAll({
      where: { room_id: roomId },
      order: [["timestamp", "DESC"]],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      include: [{
        model: User,
        as: 'sender',
        attributes: ['id', 'firstName', 'lastName', 'username', 'picture']
      }]
    });

    // Decrypt messages
    const decryptedMessages = messages.rows.map(message => ({
      ...message.toJSON(),
      content: decrypt(message.content)
    }));

    res.status(200).json({
      success: true,
      data: {
        messages: decryptedMessages.reverse(),
        total: messages.count,
        hasMore: messages.count > parseInt(offset, 10) + decryptedMessages.length
      }
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Search messages
exports.searchMessages = async (req, res) => {
  const { room_id, user_id, query, limit = 20 } = req.query;

  try {
    // Verify room membership
    const isMember = await RoomMember.findOne({
      where: { room_id, user_id }
    });

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this room"
      });
    }

    // Fetch all messages first (not optimal for large datasets)
    const messages = await Chat.findAll({
      where: { room_id },
      include: [{
        model: User,
        as: 'sender',
        attributes: ['id', 'firstName', 'lastName', 'username']
      }]
    });

    // Decrypt and filter messages
    const decryptedMessages = messages
      .map(message => ({
        ...message.toJSON(),
        content: decrypt(message.content)
      }))
      .filter(message => message.content.toLowerCase().includes(query.toLowerCase()))
      .slice(0, limit);

    res.status(200).json({
      success: true,
      data: decryptedMessages
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
  const { message_id, user_id, room_id } = req.body;

  try {
    // Find message and verify ownership
    const message = await Chat.findOne({
      where: {
        id: message_id,
        sender_id: user_id,
        room_id
      }
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found or you don't have permission to delete it"
      });
    }

    // Delete message
    await message.destroy();

    // Emit deletion event
    if (io) {
      io.emit(`room_${room_id}_delete`, { message_id });
    }

    res.status(200).json({
      success: true,
      message: "Message deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Edit a message
exports.editMessage = async (req, res) => {
  const { message_id, user_id, room_id, content } = req.body;

  try {
    // Find message and verify ownership
    const message = await Chat.findOne({
      where: {
        id: message_id,
        sender_id: user_id,
        room_id
      }
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found or you don't have permission to edit it"
      });
    }

    // Update and encrypt new content
    const encryptedContent = encrypt(content);
    await message.update({
      content: encryptedContent,
      edited: true
    });

    // Prepare updated message for socket
    const updatedMessage = {
      ...message.toJSON(),
      content: decrypt(message.content)
    };

    // Emit update event
    if (io) {
      io.emit(`room_${room_id}_update`, updatedMessage);
    }

    res.status(200).json({
      success: true,
      message: "Message updated successfully",
      data: updatedMessage
    });
  } catch (error) {
    console.error("Error editing message:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get room members
exports.getRoomMembers = async (req, res) => {
  const { room_id } = req.query;

  if (!room_id) {
    return res.status(400).json({
      success: false,
      message: "room_id is required"
    });
  }

  try {
    const members = await RoomMember.findAll({
      where: { room_id },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'username', 'picture']
      }],
      order: [['joined_at', 'DESC']]
    });

    const formattedMembers = members.map(member => ({
      id: member.user.id,
      name: `${member.user.firstName} ${member.user.lastName}`.trim() || member.user.username,
      avatar_url: member.user.picture || 'default-avatar.png',
      is_admin: member.is_admin,
      joined_at: member.joined_at
    }));

    res.status(200).json({
      success: true,
      data: {
        members: formattedMembers,
        total: formattedMembers.length
      }
    });
  } catch (error) {
    console.error("Error fetching room members:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Toggle broadcast mode
exports.toggleBroadcast = async (req, res) => {
  const { room_id, user_id, broadcast_enabled } = req.body;

  try {
    console.log(`Attempting to toggle broadcast for room ${room_id} by user ${user_id}`);

    if (!room_id || !user_id) {
      console.error('Missing parameters:', { room_id, user_id });
      return res.status(400).json({
        success: false,
        message: "Missing required parameters"
      });
    }

    const room = await Room.findByPk(room_id);
    if (!room) {
      console.error(`Room ${room_id} not found`);
      return res.status(404).json({
        success: false,
        message: "Room not found"
      });
    }

    // Verify user is the room creator
    const isCreator = Number(room.created_by) === Number(user_id);
    console.log(`Admin verification result:`, { isCreator });

    if (!isCreator) {
      console.error(`User ${user_id} is not authorized to toggle broadcast for room ${room_id}`);
      return res.status(403).json({
        success: false,
        message: "Only room creator can toggle broadcast mode"
      });
    }

    await room.update({
      broadcast_enabled,
    });

    // Get all room members except the creator (who is toggling)
    const roomMembers = await RoomMember.findAll({
      where: {
        room_id,
        user_id: { [Op.ne]: user_id } // Exclude the creator
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'pushToken']
      }]
    });

    // Filter members who have push tokens
    const recipients = roomMembers
      .filter(member => member.user.pushToken)
      .map(member => member.user.id);

    // Send push notification if there are recipients
    if (recipients.length > 0) {
      try {
        const creator = await User.findByPk(user_id, {
          attributes: ['username', 'firstName', 'lastName']
        });
        const creatorName = creator.username || `${creator.firstName} ${creator.lastName}`.trim();

        await sendChatNotification({
          senderId: user_id,
          recipientIds: recipients,
          roomId: room_id,
          message: `Broadcast mode has been ${broadcast_enabled ? 'enabled' : 'disabled'} by ${creatorName}`,
          customData: {
            type: 'broadcast_status_change',
            broadcast_enabled,
            changed_by: user_id
          }
        });
      } catch (notificationError) {
        console.error('Error sending broadcast status notifications:', notificationError);
        // Don't fail the operation if notifications fail
      }
    }

    // Emit broadcast status change
    if (io) {
      io.emit(`room_${room_id}_broadcast`, { broadcast_enabled });
      io.emit(`room_${room_id}_updated`, room);
    }

    console.log(`Broadcast mode toggled successfully to ${broadcast_enabled}`);
    res.status(200).json({
      success: true,
      message: `Broadcast mode ${broadcast_enabled ? 'enabled' : 'disabled'}`,
      data: room
    });
  } catch (error) {
    console.error("Error toggling broadcast:", {
      error: error.message,
      stack: error.stack,
      requestBody: req.body
    });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get broadcast status
exports.getBroadcastStatus = async (req, res) => {
  const { room_id } = req.params;

  try {
    const room = await Room.findByPk(room_id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found"
      });
    }

    res.status(200).json({
      success: true,
      broadcast_enabled: room.broadcast_enabled
    });
  } catch (error) {
    console.error("Error fetching broadcast status:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getMessages = async (req, res) => {
  const { room_id, user_id, limit = 50, offset = 0 } = req.query;

  try {
    // Verify room membership
    const isMember = await RoomMember.findOne({
      where: { room_id, user_id }
    });

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this room"
      });
    }

    // Fetch messages with pagination
    const messages = await Chat.findAndCountAll({
      where: { room_id },
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      include: [{
        model: User,
        as: 'sender',
        attributes: ['id', 'firstName', 'lastName', 'username', 'picture']
      }]
    });

    // Decrypt messages
    const decryptedMessages = messages.rows.map(message => ({
      ...message.toJSON(),
      content: decrypt(message.content)
    }));

    res.status(200).json({
      success: true,
      data: {
        messages: decryptedMessages.reverse(),
        total: messages.count,
        hasMore: messages.count > parseInt(offset, 10) + decryptedMessages.length
      }
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Export middleware
exports.uploadMiddleware = upload;