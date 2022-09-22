module.exports = function (sequelize, DataTypes) {
    const Friend = sequelize.define('Friend', {
        id: {
            type: DataTypes.INTEGER(11),
            primaryKey: true,
            autoIncrement: true
        },
        user_1:  {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        user_2:  {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        time:  {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: new Date()
        }
    }, {
        tableName: 'friends'
    });

    Friend.associate = function (models) {
        
    };

    return Friend;
};
