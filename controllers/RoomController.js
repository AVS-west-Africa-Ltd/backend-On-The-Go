const Room = require("../models/Room");
const RoomMember = require("../models/RoomMember");
const path = require("path");
const multer = require("multer");

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

const upload = multer({ storage: storage });

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

    const { name, type, description, status, created_by, member_ids } =
      req.body;

    try {
      const media = `${req.protocol}://${req.get("host")}/uploads/${
        req.file.filename
      }`.toString();

      const room = await Room.create({
        name,
        type,
        description,
        image_url: media,
        status,
        created_by,
        total_members: member_ids.length,
      });

      // Add members to the room
      const roomMembers = member_ids.map((user_id) => ({
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
      res.status(500).json({ success: false, error: error.message });
    }
  });
};
// Rest of the code remains the same
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

    // Check if the user is already a member of the room
    const existingMember = await RoomMember.findOne({
      where: { room_id, user_id },
    });

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: "User is already a member of the room",
      });
    }

    // Increment total_members when adding a new member
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

    // Decrement total_members when removing a member
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

module.exports = exports;
