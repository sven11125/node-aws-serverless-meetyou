module.exports = function (sequelize, DataTypes) {
    const UserRead = sequelize.define('UserRead', {
        id: {
            type: DataTypes.INTEGER(11),
            primaryKey: true,
            autoIncrement: true
        },
        fromUserId:  {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'from_user_id'
        },
        conversationId:  {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'conversation_id'
        },
        content:  {
            type: DataTypes.TEXT('medium'),
            allowNull: true
        },
        created:  {
            type: DataTypes.DATE,
            allowNull: false
        }
    }, {
        tableName: 'user_read'
    });

    UserRead.associate = function (models) {
        models.UserRead.belongsTo(models.Conversation, {
            foreignKey: 'conversation_id'
        });
    };

    return UserRead;
};
