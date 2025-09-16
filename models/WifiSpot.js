
module.exports = (sequelize, DataTypes) => {
  const WifiSpot = sequelize.define(
    'WifiSpot',
    {
      ssid: { type: DataTypes.STRING(128), allowNull: false },
      username: { type: DataTypes.TEXT, allowNull: true },
      password: { type: DataTypes.TEXT, allowNull: true },

      latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
      longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },

      security: { type: DataTypes.STRING(64), allowNull: true },
      provider: { type: DataTypes.STRING(128), allowNull: true },
      download_speed_mbps: { type: DataTypes.FLOAT, allowNull: true },
      upload_speed_mbps: { type: DataTypes.FLOAT, allowNull: true },
      address: { type: DataTypes.TEXT, allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      tableName: 'wifi_spots',
      timestamps: true,
      indexes: [
        { fields: ['latitude', 'longitude'] },
        { fields: ['ssid'] },
      ],
    }
  );
  
  WifiSpot.associate = (_models) => {
    
  };

  return WifiSpot;
};
