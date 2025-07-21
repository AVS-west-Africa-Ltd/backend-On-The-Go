module.exports = (sequelize, DataTypes) => {
    const Image = sequelize.define('Image', {
        postId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        fileName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        filePath: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        tableName: 'images' // Explicitly set table name
    }
    );

    Image.associate = (models) => {
    Image.belongsTo(models.Post, { foreignKey: "postId", as: "images" });
    };


    return Image;
  
}
