module.exports = function (sequelize, DataTypes) {
    const ChangeProposals = sequelize.define('ChangeProposals', {
        id: {
            type: DataTypes.INTEGER(11),
            primaryKey: true,
            autoIncrement: true
        },
        type:  {
            type: DataTypes.ENUM('time', 'location'),
            allowNull: false
        },
        proposal:  {
            type: DataTypes.TEXT('medium'),
            allowNull: false,
            field: 'content'
        },
        createdBy:  {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'created_by'
        },
        is_voted:  {
            type: DataTypes.VIRTUAL
        },
        vote:  {
            type: DataTypes.VIRTUAL,
            get: function() {
                const vote = this.get('is_voted');
                this.setDataValue('is_voted', undefined);
                return vote !== 0;
            }
        },
        status:  {
            type: DataTypes.ENUM('active', 'approved', 'rejected'),
            allowNull: false,
            defaultValue: 'active'
        },
        eventId:  {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'event_id'
        }
    }, {
        tableName: 'change_proposals'
    });

    ChangeProposals.associate = function (models) {
        models.ChangeProposals.belongsTo(models.Event, {
            foreignKey: 'event_id'
        });
        models.ChangeProposals.hasMany(models.ChangeProposalsVote, {
            foreignKey: 'proposal_id'
        });
    };

    return ChangeProposals;
};
