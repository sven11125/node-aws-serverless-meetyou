module.exports = function (sequelize, DataTypes) {
    const EventInvites = sequelize.define('EventInvites', {
        id: {
            type: DataTypes.INTEGER(11),
            primaryKey: true,
            autoIncrement: true
        },
        fromUser:  {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'from_user'
        },
        toUser:  {
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
        },
        eventId:  {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'event_id'
        }
    }, {
        tableName: 'event_invites'
    });

    EventInvites.associate = function (models) {
        models.EventInvites.belongsTo(models.Event, {
            foreignKey: 'event_id',
            as: 'event'
        });
    };

    return EventInvites;
};
