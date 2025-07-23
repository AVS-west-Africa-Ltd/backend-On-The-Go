module.exports = (sequelize, DataTypes) => {
  const NetworkRouter = sequelize.define('NetworkRouter', {
    
      host: {
        type: DataTypes.STRING,
        allowNull: false
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false
      },
      port: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 8728 
      },
      ssl: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      metadata: {
        type: DataTypes.JSON,
        defaultValue: {
          status: 'new',
          items: []
        }
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique:true,
        references: {
          model: 'users', // or the actual table name
          key: 'id'
        },
        onDelete: 'CASCADE'
      }
  },
  {
    tableName: "networkRouters",
  });

  NetworkRouter.associate = (models) => {
      NetworkRouter.belongsTo(models.User, {
          foreignKey: "userId",
          onDelete: "CASCADE",
      });
  };


  return NetworkRouter;
  
}