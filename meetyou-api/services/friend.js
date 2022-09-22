module.exports = (models) => {

    const friendService = {
        getUser: async (where) => {
            return models.User.findOne({
                where,
                attributes:['id', 'firstName', 'lastName', 'userName', 'pic']
            });
        },
        getUsers: async (where) => {
            return models.User.findAll({
                where: models.sequelize.literal(where),
                attributes:['id', 'firstName', 'lastName', 'userName', 'pic']
            });
        },
        getFriend: async (whereObj) => {
            return models.Friend.findOne({
                where : whereObj
            });
        },
        getFriends: async (userId, where) => {
            let query = `select user.id, user.first_name as firstName, user.last_name as lastName, user.username as userName, user.pic from user inner join friends on (user.id=friends.user_1 AND friends.user_2='${userId}') OR (user.id=friends.user_2 AND friends.user_1='${userId}') `;
            if(where) {
                query += where;
            }            
            console.log('Executing (default): ' + query);
            return models.sequelize.query(query, {
                type: models.sequelize.QueryTypes.SELECT
            });
        },
        getFriendRequest: async (whereObj) => {
            return models.FriendRequest.findOne({
                where : whereObj,
                attributes: ['id', 'created', 'status'],
                include: [{
                    model: models.User,
                    as: 'fromUser',
                    attributes:['id', 'firstName', 'lastName', 'userName', 'pic']
                }, {
                    model: models.User,
                    as: 'toUser',
                    attributes:['id', 'firstName', 'lastName', 'userName', 'pic']
                }]
            });
        },
        getFriendRequests: async (whereOption) => {
            return models.FriendRequest.findAll({
                where: whereOption,
                order: [
                    ['id', 'DESC']
                ],
                limit: 15,
                attributes: ['id', 'created', 'status'],
                include: [{
                    model: models.User,
                    as: 'fromUser',
                    attributes:['id', 'firstName', 'lastName', 'userName', 'pic']
                }, {
                    model: models.User,
                    as: 'toUser',
                    attributes:['id', 'firstName', 'lastName', 'userName', 'pic']
                }]
            });
        },
        createFriendRequest: async (objData) => {
            return  models.FriendRequest.create(objData);
        },
        createFriend: async (objData) => {
            return  models.Friend.create(objData);
        }
    }

    return {
        friendService
    }
}