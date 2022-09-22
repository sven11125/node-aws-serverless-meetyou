module.exports = function (sequelize, DataTypes) {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.STRING(255),
            primaryKey: true
        },
        firstName:  {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'first_name'
        },
        lastName:  {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'last_name'
        },
        userName:  {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'username'
        },
        pic:  {
            type: DataTypes.TEXT,
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
        token:  {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'user',
    });

    User.associate = function (models) {
        
    };

    return User;
};
