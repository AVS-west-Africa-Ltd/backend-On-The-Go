
module.exports = (sequelize, DataTypes) => {
  const WifiSpot = sequelize.define(
    'WifiSpot',
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },

      // Basics
      ssid: { type: DataTypes.STRING(128), allowNull: false },
      password_enc: { type: DataTypes.TEXT, allowNull: true }, // encrypted password

      // Location
      latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
      longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: false },

      // Metadata
      platform: { type: DataTypes.STRING(32), allowNull: true }, // e.g., "wifi-map"
      capturedAt: { type: DataTypes.DATE, allowNull: true },
      source_ip: { type: DataTypes.STRING(45), allowNull: true },
      submitted_by: { type: DataTypes.INTEGER, allowNull: true }, // optional FK to User
      approved: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },

      // Optional Wi-Fi extras
      bssid: { type: DataTypes.STRING(32), allowNull: true },
      security: { type: DataTypes.STRING(64), allowNull: true },
      capabilities: { type: DataTypes.TEXT, allowNull: true },
      provider: { type: DataTypes.STRING(128), allowNull: true },
      shared_by: { type: DataTypes.STRING(128), allowNull: true },
      last_signal: { type: DataTypes.STRING(64), allowNull: true },
      last_connection: { type: DataTypes.STRING(64), allowNull: true },
      connections: { type: DataTypes.INTEGER, allowNull: true },
      download_speed_mbps: { type: DataTypes.FLOAT, allowNull: true },
      upload_speed_mbps: { type: DataTypes.FLOAT, allowNull: true },
      ping_ms: { type: DataTypes.INTEGER, allowNull: true },
      rssi_dbm: { type: DataTypes.INTEGER, allowNull: true },
      frequency_mhz: { type: DataTypes.INTEGER, allowNull: true },
      channel: { type: DataTypes.INTEGER, allowNull: true },
      band: { type: DataTypes.STRING(16), allowNull: true },
      address: { type: DataTypes.TEXT, allowNull: true },
      source: { type: DataTypes.STRING(128), allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },

      // Dedupe key: ssid+lat+lng unless bssid present
      uniqueKey: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    },
    {
      tableName: 'wifi_spots',
      timestamps: true,
      indexes: [
        { fields: ['latitude', 'longitude'] },
        { fields: ['ssid'] },
        { fields: ['approved'] },
        { unique: true, fields: ['uniqueKey'] },
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
