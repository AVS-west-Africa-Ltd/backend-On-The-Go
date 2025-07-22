module.exports = (sequelize, DataTypes) => {
  const BusinessPosts = sequelize.define("BusinessPosts", {
    media: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    postText: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    likes: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    businessId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
    {
      tableName: 'businessposts' // Explicitly set table name
    }
  );

  BusinessPosts.associate = (models) => {
      BusinessPosts.belongsTo(models.Business, { foreignKey: "businessId" });
  };


  return BusinessPosts;
    
}