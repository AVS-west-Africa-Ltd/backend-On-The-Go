module.exports = (sequelize, DataTypes) => {
    const Media = sequelize.define('Media', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        targetId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                notNull: { msg: 'Target ID is required' },
                isInt: { msg: 'Target ID must be an integer' }
            }
        },
        targetType: {
            type: DataTypes.ENUM('profile', 'post', 'business', 'product', 'review'),
            allowNull: false,
            validate: {
                notNull: { msg: 'Target type is required' },
                isIn: {
                    args: [['profile', 'post', 'business', 'product', 'review']],
                    msg: 'Target type must be one of: profile, post, business, product, review'
                }
            }
        },
        filePath: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notNull: { msg: 'File path is required' },
                notEmpty: { msg: 'File path cannot be empty' },
                isUrl: {
                    msg: 'File path should be a valid URL or path',
                    args: { require_protocol: false } // Allow both URLs and local paths
                }
            }
        },
        fileName: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                notEmpty: { msg: 'File name cannot be empty if provided' }
            }
        },
        mimeType: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                notEmpty: { msg: 'MIME type cannot be empty if provided' }
            }
        },
        metadata: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {}
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        uploadOrder: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: {
                min: { args: [0], msg: 'Upload order cannot be negative' }
            },
        }
    }, {
        tableName: 'media',
        timestamps: true, 
        paranoid: true, 
        indexes: [
            {
                name: 'idx_media_target',
                fields: ['targetType', 'targetId']
            },
            {
                name: 'idx_media_upload_order',
                fields: ['targetType', 'targetId', 'uploadOrder']
            },
            {
                name: 'idx_media_active',
                fields: ['isActive']
            }
        ],
        
    });

    Media.associate = (models) => {
        
        Media.belongsTo(models.Post, {
            foreignKey: 'targetId',
            constraints: false,
            as: 'post',
            scope: {
                targetType: 'post'
            }
        });

        Media.belongsTo(models.Profile, {
            foreignKey: 'targetId',
            constraints: false,
            as: 'profile',
            scope: {
                targetType: 'profile'
            }
        });
    };


    return Media;
};

