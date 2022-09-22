module.exports = function (sequelize, DataTypes) {
    const Event = sequelize.define('Event', {
        id: {
            type: DataTypes.INTEGER(11),
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        time: {
            type: DataTypes.DATE,
            allowNull: false
        },
        locationName:  {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: 'location_name'
        },
        location:  {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'location_address'
        },
        shortDescription:  {
            type: DataTypes.STRING(80),
            allowNull: false,
            field: 'summary'
        },
        description:  {
            type: DataTypes.TEXT,
            allowNull: false
        },
        host_id:  {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        media:  {
            type: DataTypes.STRING(255),
            allowNull: true
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
        type:  {
            type: DataTypes.ENUM('private', 'friends', 'public'),
            allowNull: false
        },
        status:  {
            type: DataTypes.ENUM('upcoming', 'ongoing', 'ended', 'canceled'),
            allowNull: false,
            defaultValue: 'upcoming'
        },
        conversationId:  {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'conversation_id'
        },
        join:  {
            type: DataTypes.VIRTUAL
        },
        joined:  {
            type: DataTypes.VIRTUAL,
            get: function() {
                const join = this.get('join');
                this.setDataValue('join', undefined);
                return join !== 0;
            }
        }
    }, {
        tableName: 'event',
    });

    Event.associate = function (models) {
        models.Event.belongsTo(models.User, {
            as: 'host',
            foreignKey: 'host_id'
        });
        models.Event.belongsTo(models.Conversation, {
            foreignKey: 'conversation_id'
        });
        models.Event.hasMany(models.EventJoined, {
            foreignKey: 'event_id'
        });
        models.Event.hasMany(models.ChangeProposals, {
            foreignKey: 'event_id'
        });
        models.Event.belongsToMany(models.User, {
            as: 'joinedUsers',
            through: 'EventJoined',
            foreignKey: 'event_id' 
        })
    };

    return Event;
};
