
module.exports = (sequelize, DataTypes) => {
  const Activity = sequelize.define(
    "Activity",
    {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
            model: "users",
            key: "id",
            },
        },
        url: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        method: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        ip: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        userAgent: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        statusCode: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        timestamp: true,
        tableName: "activities",
    }
  );


  return  Activity;
    
}