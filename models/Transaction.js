module.exports = (sequelize, DataTypes) => {

  const Transaction = sequelize.define(
    "Transaction",
    {
        reference: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        businessId: {
            type: DataTypes.INTEGER,
            allowNull: false, 
        },
        ticketId: {
            type: DataTypes.INTEGER,
            allowNull: false, 
        },
        amount: {
            type: DataTypes.DOUBLE,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM,
            values: ["pending", "completed"],
            allowNull: false,
            defaultValue: "pending"
        },
        hotspotTicket: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: {},
        },
      
     
    },
    {
      tableName: "transactions",
      timestamps: true
    }
  );

  Transaction.associate = (models) => {
      Transaction.belongsTo(models.User, {
        foreignKey: "userId",
      });

  };

  return Transaction;
}