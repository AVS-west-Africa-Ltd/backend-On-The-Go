const Room = require("./Room");
const RoomMember = require("./RoomMember");
const Chat = require("./Chat");

const setupAssociations = () => {
  // Room associations
  Room.hasMany(Chat, {
    foreignKey: "room_id",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  Room.hasMany(RoomMember, {
    as: "members", // Explicit alias for RoomMember association
    foreignKey: "room_id",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  // Chat associations
  Chat.belongsTo(Room, {
    foreignKey: "room_id",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  // RoomMember associations
  RoomMember.belongsTo(Room, {
    foreignKey: "room_id",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
};

module.exports = setupAssociations;
