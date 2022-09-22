module.exports = function (sequelize, DataTypes) {
    const FriendRequest = sequelize.define('FriendRequest', {
        id: {
            type: DataTypes.INTEGER(11),
            primaryKey: true,
            autoIncrement: true
        },
        user_1:  {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'from_user'
        },
        user_2:  {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'to_user'
        },
        created:  {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: new Date()
        },
        status:  {
            type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
            allowNull: false,
            defaultValue: 'pending'
        }
    }, {
        tableName: 'friend_request'
    });

    FriendRequest.associate = function (models) {
        models.FriendRequest.belongsTo(models.User, {
            foreignKey: 'from_user',
            as: 'fromUser'
        });
        models.FriendRequest.belongsTo(models.User, {
            foreignKey: 'to_user',
            as: 'toUser'
        });
    };

    return FriendRequest;
};
