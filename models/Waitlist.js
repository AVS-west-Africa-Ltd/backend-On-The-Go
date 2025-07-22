

module.exports = (sequelize, DataTypes) => {
  const Waitlist = sequelize.define("Waitlist", {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
  }, {
    tableName: "waitlist",
    timestamps: true,
  });

  return  Waitlist;
    
}