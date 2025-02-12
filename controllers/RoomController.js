const Room = require("../models/Room");
const RoomMember = require("../models/RoomMember");
const path = require("path");
const multer = require("multer");
const InvitationController = require("./InvitationController");
const { sequelize } = require("../models/Room");

// Multer storage and configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Upload directory
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

const upload = multer({ storage: storage });
const userService = require("../services/UserService");

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
          where: { user_id: userId }, // Filter rooms where the user is a member
          attributes: [], // We don't need to return member details
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
      ],
    });

    res.status(200).json({
      success: true,
      message: "User rooms retrieved successfully",
      data: rooms,
    });
  } catch (error) {
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

    const { name, type, description, status, created_by, member_ids } = req.body;

    let memberIdsArray = [];
    try {
      memberIdsArray = typeof member_ids === "string" ? JSON.parse(member_ids) : member_ids;
    } catch (error) {
      return res.status(400).json({ success: false, message: "Invalid member_ids format" });
    }

    try {
      let media = null;
      if (req.file) {
        media = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
      }

      const room = await Room.create({
        name,
        type,
        description,
        image_url: media,
        status,
        created_by,
        total_members: memberIdsArray.length,
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

  try {
    // First check if room exists
    const room = await Room.findByPk(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found"
      });
    }

    // Get all room members with their user details
    const roomMembers = await RoomMember.findAll({
      where: { room_id: roomId },
      attributes: ["user_id", "joined_at"]
    });

    // Get user details for all members
    const userDetails = await Promise.all(
      roomMembers.map(async (member) => {
        const user = await userService.getUserById(member.user_id);
        return {
          user_id: member.user_id,
          joined_at: member.joined_at,
          username: user && user.username ? user.username : null,
          email: user && user.email ? user.email : null,
          picture: user && user.picture ? user.picture : null
        };
      })
    );

    res.status(200).json({
      success: true,
      message: "Room users retrieved successfully",
      data: {
        room_id: roomId,
        room_name: room.name,
        total_members: room.total_members,
        users: userDetails
      }
    });
  } catch (error) {
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

module.exports = exports;
