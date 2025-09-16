// models/Activity.js
module.exports = (sequelize, DataTypes) => {
  const Activity = sequelize.define(
    'Activity',
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      userId: { type: DataTypes.INTEGER, allowNull: true },
      url: { type: DataTypes.STRING(1024), allowNull: false },   // was 255
      method: { type: DataTypes.STRING(8), allowNull: false },
      ip: { type: DataTypes.STRING(45), allowNull: true },
      userAgent: { type: DataTypes.TEXT, allowNull: true },      // was STRING(255)
      statusCode: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    },
    {
      tableName: 'activities',
      timestamps: true,
      indexes: [{ fields: ['createdAt'] }, { fields: ['statusCode'] }],
    }
  );
  return Activity;
};
