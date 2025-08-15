
module.exports = (sequelize, DataTypes) => {
  const Report = sequelize.define('Report', {
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    reporter_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'User ID of the person who submitted the report'
    },
    status: {
      type: DataTypes.ENUM('pending', 'reviewing', 'resolved', 'dismissed'),
      defaultValue: 'pending'
    },
    entity_type: {
      type: DataTypes.ENUM('user', 'post', 'comment', 'business', 'normal'),
      allowNull: false,
      defaultValue: 'normal'
    },
    entity_id: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'ID of the entity being reported'
    }
  }, {
    tableName: 'reports',
    timestamps: true
  });
  Report.associate = (models) => {
      Report.belongsTo(models.User, { foreignKey: "reporter_id",});
  };
  return Report;
    
}