
module.exports = (sequelize, DataTypes) => {
  const WifiSpot = sequelize.define(
    'WifiSpot',
    {
      ssid: { type: DataTypes.STRING(128), allowNull: false },
      username: { type: DataTypes.TEXT, allowNull: true },
      password: { type: DataTypes.TEXT, allowNull: true },

      latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
      longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: false },

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
        { fields: ['approved'] },
      ],
    }
  );

  WifiSpot.addHook('beforeValidate', (record) => {
    const bssid = (record.bssid || '').trim().toLowerCase();
    if (bssid) {
      record.uniqueKey = `bssid:${bssid}`;
    } else {
      const ssid = (record.ssid || '').trim().toLowerCase();
      const lat = record.latitude ?? 'null';
      const lng = record.longitude ?? 'null';
      record.uniqueKey = `ssid:${ssid}|lat:${lat}|lng:${lng}`;
    }
  });

  WifiSpot.associate = (_models) => {
    // Optionally relate to User:
    // WifiSpot.belongsTo(models.User, { foreignKey: 'submitted_by' });
  };

  return WifiSpot;
};
