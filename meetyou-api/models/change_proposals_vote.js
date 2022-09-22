module.exports = function (sequelize, DataTypes) {
    const ChangeProposalsVote = sequelize.define('ChangeProposalsVote', {
        userId:  {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'user_id'
        },
        proposalId:  {
            type: DataTypes.INTEGER(11),
            allowNull: true,
            field: 'proposal_id'
        },
        yes:  {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        no:  {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        created:  {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: new Date()
        },
        modified:  {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'change_proposals_vote'
    });

    ChangeProposalsVote.removeAttribute('id');

    ChangeProposalsVote.associate = function (models) {
        models.ChangeProposalsVote.belongsTo(models.ChangeProposals, {
            foreignKey: 'proposal_id'
        });
    };

    return ChangeProposalsVote;
};
