module.exports = function (sequelize, DataTypes) {
    const EventJoined = sequelize.define('EventJoined', {
        userId:  {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'user_id'
        },
        eventId:  {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'event_id'
        },
        time:  {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: new Date()
        }
    }, {
        tableName: 'event_joined',
        indexes: [
            {
                unique: true,
                fields: ['user_id', 'event_id']
            }
        ]
    });

    EventJoined.removeAttribute('id');

    EventJoined.associate = function (models) {
        models.EventJoined.belongsTo(models.Event, {
            foreignKey: 'event_id'
        });
    };

    return EventJoined;
};
