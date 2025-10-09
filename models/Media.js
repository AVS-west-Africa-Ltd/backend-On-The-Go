module.exports = (sequelize, DataTypes) => {
    const Media = sequelize.define('Media', {
        postId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        filePath: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        tableName: 'media'
    }
    );

    Media.associate = (models) => {
        Media.belongsTo(models.Post, { foreignKey: "postId", as: "media" });
    };


    return Media;
  
}
