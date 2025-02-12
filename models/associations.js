const Room = require("./Room");
const RoomMember = require("./RoomMember");
const Chat = require("./Chat");
const Invitation = require("./Invitation");

const setupAssociations = () => {
  // Room associations
  Room.hasMany(Chat, {
    foreignKey: "room_id",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  Room.hasMany(RoomMember, {
    as: "members",
    foreignKey: "room_id",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  Room.hasOne(Invitation, {
    as: "invitation",
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

  // Invitation associations
  Invitation.belongsTo(Room, {
    as: "room",
    foreignKey: "room_id",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
};

module.exports = setupAssociations;