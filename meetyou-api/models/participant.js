module.exports = function (sequelize, DataTypes) {
    const Participant = sequelize.define('Participant', {
        conversationId:  {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'conversation_id'
        },
        userId:  {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'user_id'
        },
        joinedTime:  {
            type: DataTypes.DATE,
            allowNull: false,
            field: 'joined_time',
            defaultValue: new Date()
        }
    }, {
        tableName: 'participants'
    });

    Participant.associate = function (models) {
        // models.Participant.belongsTo(models.Conversation, {
        //     foreignKey: 'conversation_id'
        // });
    };

    return Participant;
};
