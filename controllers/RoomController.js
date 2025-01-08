const Room = require("../models/Room");
const RoomMember = require("../models/RoomMember");
const userService = require("../services/UserService");
const multer = require("multer");
const path = require("path");

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

// Initialize multer
const upload = multer({ storage });

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

// Get room by ID
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
  const uploadHandler = upload.single("image");

  uploadHandler(req, res, async (err) => {
    if (err) {
      console.error("Error uploading file:", err);
      return res.status(501).json({
        success: false,
        message: "Error uploading room image",
        error: err.message,
      });
    }

    const { name, type, description, status, created_by, member_ids } = req.body;

    try {
      let image_url = null;
      if (req.file) {
        image_url = `https://api.onthegoafrica.com/uploads/${req.file.filename}`;
      }

      const room = await Room.create({
        name,
        type,
        description,
        image_url,
        status,
        created_by,
        total_members: member_ids ? member_ids.length : 1,
      });

      const memberIds = typeof member_ids === "string" ? JSON.parse(member_ids) : member_ids;
      const roomMembers = memberIds.map((user_id) => ({
        room_id: room.id,
        user_id,
      }));

      await RoomMember.bulkCreate(roomMembers);

      res.status(201).json({
        success: true,
        message: "Room created successfully",
        data: {
          ...room.toJSON(),
          members: roomMembers,
        },
      });
    } catch (error) {
      console.error("Error creating room:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
};

// Update an existing room
exports.updateRoom = async (req, res) => {
  const uploadHandler = upload.single("image");

  uploadHandler(req, res, async (err) => {
    if (err) {
      console.error("Error uploading file:", err);
      return res.status(501).json({
        success: false,
        message: "Error uploading room image",
        error: err.message,
      });
    }

    const { roomId } = req.params;
    const { name, type, description, status } = req.body;

    try {
      const room = await Room.findByPk(roomId);

      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Room not found",
        });
      }

      let updateData = { name, type, description, status };
      if (req.file) {
        updateData.image_url = `https://api.onthegoafrica.com/uploads/${req.file.filename}`;
      }

      await room.update(updateData);

      res.status(200).json({
        success: true,
        message: "Room updated successfully",
        data: room,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
};

// Add a member to a room
exports.addMember = async (req, res) => {
  const { room_id, user_id } = req.body;

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

    await room.increment("total_members", { by: 1 });

    const member = await RoomMember.create({
      room_id,
      user_id,
    });

    res.status(201).json({
      success: true,
      message: "Member added successfully",
      data: member,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Remove a member from a room
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

    res.status(200).json({
      success: true,
      message: "Member removed successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all users in a room
exports.getRoomUsers = async (req, res) => {
  const { roomId } = req.params;

  try {
    const room = await Room.findByPk(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const roomMembers = await RoomMember.findAll({
      where: { room_id: roomId },
      attributes: ["user_id", "joined_at"],
    });

    const userDetails = await Promise.all(
      roomMembers.map(async (member) => {
        const user = await userService.getUserById(member.user_id);
        return {
          user_id: member.user_id,
          joined_at: member.joined_at,
          username: user?.username,
          email: user?.email,
          picture: user?.picture,
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
        users: userDetails,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = exports;
