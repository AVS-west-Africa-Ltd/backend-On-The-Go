require('dotenv').config();

const { Chat, User, Room, RoomMember } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { io } = require('../app');
const multer = require("multer");
const path = require("path");
const AWS = require("aws-sdk");
const multerS3 = require("multer-s3");
const crypto = require('crypto');
const { sendChatNotification } = require('./PushNotificationController');
const nodemailer = require('nodemailer');

// ========================= Email (Gmail) =========================
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASS;

let mailTransporter = null;
if (!EMAIL_USER || !EMAIL_PASSWORD) {
  console.error("Missing EMAIL_USER or EMAIL_PASS in environment variables. Pending-message emails will be skipped.");
} else {
  mailTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD,
    },
  });
}

/**
 * Send an email via Gmail
 * @param {{to:string, subject:string, text?:string, html?:string, attachments?:Array}} emailData
 */
async function sendEmail(emailData) {
  if (!mailTransporter) return { success: false, response: 'email transporter not configured' };

  const { to, subject, text, html, attachments } = emailData;
  if (!to || !subject || (!text && !html)) {
    throw new Error("Missing required fields: to, subject, text or html");
  }
  const mailOptions = {
    from: `"OTG Reminder" <${EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
    attachments,
  };
  const info = await mailTransporter.sendMail(mailOptions);
  return { success: true, response: info.response };
}

async function getUnreadCountForRoom(userId, roomId) {
  // get member row to read last_read_at
  const member = await RoomMember.findOne({ where: { user_id: userId, room_id: roomId } });
  const where = {
    room_id: roomId,
    sender_id: { [Op.ne]: userId }, // only messages from the other person
  };
  if (member?.last_read_at) {
    where.createdAt = { [Op.gt]: member.last_read_at };
  }
  const count = await Chat.count({ where });
  return count;
}
// ========================= Encryption =========================
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
  ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex').slice(0, 32) // Convert hex to buffer and ensure 32 bytes
  : crypto.randomBytes(32); // Generate random 32 bytes if no key provided
const IV_LENGTH = 16;
const ALGORITHM = 'aes-256-cbc';

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

// Plain preview helper (decrypts if needed)
function getPreviewFromMessage(msg) {
  try {
    if (!msg) return '';
    const raw = msg.content || '';
    let plain = raw;
    // If your content is always encrypted, decrypt it:
    try { plain = decrypt(raw); } catch { }
    return String(plain).replace(/\s+/g, ' ').trim().slice(0, 140);
  } catch {
    return '';
  }
}

// ========================= AWS S3 Upload =========================
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

// ========================= 5-min No-Reply Email (1:1 rooms only) =========================
/**
 * Schedules an email to the other user if no reply after 5 minutes.
 */
function schedulePendingReplyEmail({
  messageId,
  roomId,
  senderId,
  createdAt,
  recipientEmail,
  roomName,
  delayMs = 5 * 60 * 1000
}) {
  if (!mailTransporter || !recipientEmail) return;

  setTimeout(async () => {
    try {
      const replied = await Chat.findOne({
        where: {
          room_id: roomId,
          createdAt: { [Op.gt]: createdAt },
          sender_id: { [Op.ne]: senderId },
        },
      });
      if (replied) return;

      // Get sender info
      const sender = await User.findByPk(senderId, {
        attributes: ['firstName', 'lastName', 'username']
      });

      // Get the original message
      const message = await Chat.findByPk(messageId, { attributes: ['id', 'content'] });
      const preview = getPreviewFromMessage(message);

      const senderName =
        (sender.firstName || sender.lastName)
          ? `${sender.firstName || ''} ${sender.lastName || ''}`.trim()
          : sender.username || 'Someone';

      const subject = `You have a pending message from ${senderName}`;
      const html = `
        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.5;">
          <h2 style="margin:0 0 8px;">You have a pending message from ${senderName}</h2>
          ${preview ? `<p style="color:#555;margin:0 0 12px;">${preview}</p>` : ''}
          <p style="margin:0;">Open the conversation in your app to reply.</p>
          <p style="margin-top:16px;font-size:12px;color:#888;">
            This reminder was sent after ${delayMs / 60000} minute(s) of inactivity.
          </p>
        </div>
      `;
      const text = `You have a pending message from ${senderName}:\n${preview || ''}\n\nOpen the conversation in your app to reply.`;

      console.log(`Sending email now to ${recipientEmail} due to no reply.`);

      await sendEmail({
        to: recipientEmail,
        subject,
        html,
        text,
        from: `"OTG" <${EMAIL_USER}>`
      });
    } catch (err) {
      console.error('Pending 1:1 email check failed:', err);
    }
  }, delayMs);
}




// ========================= Controllers =========================

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

      if (io) {
        io.emit(`room_${room_id}`, messageForSocket);
      }

      // Send push notifications to other members
      try {
        const roomMembers = await RoomMember.findAll({
          where: { room_id, user_id: { [Op.ne]: sender_id } },
          include: [{ model: User, attributes: ['id', 'pushToken'] }]
        });

        const recipients = roomMembers
          .filter(member => member.User.pushToken)
          .map(member => member.User.id);

        if (recipients.length > 0) {
          const mediaType = req.file
            ? (req.file.mimetype.split('/')[0] === 'image' ? 'image' : req.file.mimetype.split('/')[1])
            : null;

          await sendChatNotification({
            senderId: sender_id,
            recipientIds: recipients,
            roomId: room_id,
            message: content,
            mediaType,
            customData: { messageId: message.id, isRequest: request }
          });
        }
      } catch (notificationError) {
        console.error('Error sending push notifications:', notificationError);
      }

      // ===== Schedule 30-sec no-reply email (ONLY if exactly 2 members) =====
      try {
        const members = await RoomMember.findAll({ where: { room_id } });
        if (members.length === 2) {
          const other = members.find(m => String(m.user_id) !== String(sender_id));
          if (other) {
            const otherUser = await User.findByPk(other.user_id, { attributes: ['email', 'firstName', 'lastName', 'username'] });
            if (otherUser?.email) {
              console.log(
                `User with email ${otherUser.email} will get an email after 30 seconds of no reply.`
              );
              schedulePendingReplyEmail({
                messageId: message.id,
                roomId: room_id,
                senderId: sender_id,
                createdAt: message.createdAt || new Date(),
                recipientEmail: otherUser.email,
                roomName: room?.name || '',
                delayMs: 5 * 60 * 1000
              });
            }
          }
        }
      } catch (scheduleErr) {
        console.error('Error scheduling pending-reply email:', scheduleErr);
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
        attributes: ['id', 'pushToken']
      }]
    });

    // Filter members who have push tokens
    const recipients = roomMembers
      .filter(member => member.User.pushToken)
      .map(member => member.User.id);

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

// POST /chat/room/:roomId/mark-read
exports.markRoomRead = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { user_id } = req.body;
    if (!roomId || !user_id) {
      return res.status(400).json({ success: false, message: 'roomId and user_id are required' });
    }

    // ensure it’s a 1:1 room (exactly two members)
    const members = await RoomMember.count({ where: { room_id: roomId } });
    if (members !== 2) {
      return res.status(400).json({ success: false, message: 'Unread counts are supported only for direct 1:1 rooms' });
    }

    await RoomMember.update(
      { last_read_at: new Date() },
      { where: { room_id: roomId, user_id } }
    );

    // (optional) also set status=read for all messages from other user up to now
    return res.json({ success: true, message: 'Room marked as read' });
  } catch (e) {
    console.error('markRoomRead error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
};

// GET /chat/user/:userId/unread-counts
exports.getUnreadCounts = async (req, res) => {
  try {
    const { userId } = req.params;

    // get all direct rooms the user is in (2 members)
    const myMemberships = await RoomMember.findAll({ where: { user_id: userId } });
    const roomIds = myMemberships.map(m => m.room_id);

    // sanity filter: only rooms that actually have 2 members
    const directRoomIds = [];
    for (const id of roomIds) {
      const c = await RoomMember.count({ where: { room_id: id } });
      if (c === 2) directRoomIds.push(id);
    }

    const data = {};
    for (const rid of directRoomIds) {
      data[rid] = await getUnreadCountForRoom(userId, rid);
    }

    res.json({ success: true, data });
  } catch (e) {
    console.error('getUnreadCounts error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
};

// Export middleware
exports.uploadMiddleware = upload;
