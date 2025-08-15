// models/WifiSpot.js
module.exports = (sequelize, DataTypes) => {
  const WifiSpot = sequelize.define(
    'WifiSpot',
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      ssid: { type: DataTypes.STRING(128), allowNull: false },
      password_enc: { type: DataTypes.TEXT, allowNull: true }, // AES-256 encrypted
      latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
      longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
      platform: { type: DataTypes.STRING(16), allowNull: true },
      capturedAt: { type: DataTypes.DATE, allowNull: true },
      source_ip: { type: DataTypes.STRING(45), allowNull: true },
      submitted_by: { type: DataTypes.INTEGER, allowNull: true }, // optional FK to User
      approved: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      tableName: 'wifi_spots',
      timestamps: true,
      indexes: [
        { fields: ['latitude', 'longitude'] },
        { fields: ['ssid'] },
        { fields: ['approved'] },
      ],
    }
  );

  WifiSpot.associate = (models) => {
    // Optional: WifiSpot.belongsTo(models.User, { foreignKey: 'submitted_by' });
  };

  return WifiSpot;
};