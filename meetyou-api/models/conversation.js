module.exports = function (sequelize, DataTypes) {
    const Conversation = sequelize.define('Conversation', {
        id: {
            type: DataTypes.INTEGER(11),
            primaryKey: true,
            autoIncrement: true
        },
        created:  {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: new Date()
        },
        modified:  {
            type: DataTypes.DATE,
            allowNull: true
        },
        active:  {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        type:  {
            type: DataTypes.ENUM('event', 'direct', 'group'),
            allowNull: false,
            defaultValue: 'direct'
        },
        lastMessageId:  {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'last_message_id'
        }
    }, {
        tableName: 'conversation'
    });

    Conversation.associate = function (models) {
        models.Conversation.belongsToMany(models.User, {
            as: 'participants',
            through: 'Participant',
            foreignKey: 'conversation_id' 
        })
        models.Conversation.hasMany(models.Participant, {
            as: 'Participant',
            foreignKey: 'conversation_id'
        });
        models.Conversation.hasMany(models.Message, {
            foreignKey: 'conversation_id'
        });
        models.Conversation.hasOne(models.Event, {
            foreignKey: 'conversation_id',
            as: 'event'
        });
        // models.Conversation.belongsTo(models.Message, {
        //     foreignKey: 'last_message_id',
        //     as: 'lastMessage'
        // });
    };

    return Conversation;
};
