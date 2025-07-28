module.exports = (sequelize, DataTypes) => {
    const MarketerTerritory = sequelize.define('MarketerTerritory', {
      marketerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Marketers',
          key: 'id'
        }
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 6),
        allowNull: false
      },
      longitude: {
        type: DataTypes.DECIMAL(10, 6),
        allowNull: false
      },
      radius: {
        type: DataTypes.INTEGER,
        defaultValue: 1609.34,
        allowNull: false
      },
    status: {
      type: DataTypes.ENUM('active', 'completed', 'inactive', 'unassigned'),
      defaultValue: 'active'
    }
    ,
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    });

    // Manual relationship methods
    MarketerTerritory.prototype.getMarketer = async function() {
      return await sequelize.models.Marketer.findByPk(this.marketerId);
    }; 


    return MarketerTerritory;
  
}