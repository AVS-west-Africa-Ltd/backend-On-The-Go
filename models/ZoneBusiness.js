// models/ZoneBusiness.js
module.exports = (sequelize, DataTypes) => {
  const ZoneBusiness = sequelize.define('ZoneBusiness', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: false,
    },
    longitude: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    zone: {
      type: DataTypes.CHAR(1),
      allowNull: false,
    },
    registered: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    radius: {
      type: DataTypes.INTEGER,
      defaultValue: 3000,
    },
    // New: array of note objects { name, note, createdAt }
    notes: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
  });

  return ZoneBusiness;
};
