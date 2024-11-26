const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const BusinessPosts = sequelize.define("BusinessPosts", {
  media: {
    type: DataTypes.TEXT,
    get() {
      const rawValue = this.getDataValue("media");
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue("media", JSON.stringify(value));
    },
  },
  postText: {
    type: DataTypes.TEXT, // Text content for the post
    allowNull: false,
  },
  likes: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
});

module.exports = BusinessPosts;
