const moment = require('moment');
const Op = require("sequelize").Op;

module.exports = (router, services) => {
    router.get('/friends', async (req, res) => {
        let where;
        if(req.query.after && req.query.before) {
            where = ` where time BETWEEN '${moment(req.query.after).format('YYYY-MM-DDThh:mm:ss')}' AND '${moment(req.query.before).format('YYYY-MM-DDThh:mm:ss')}'`;
        } else if(req.query.before) {
            where = ` where time < '${moment(req.query.before).format('YYYY-MM-DDThh:mm:ss')}'`;
        } else if(req.query.after) {
            where = ` where time > '${moment(req.query.after).format('YYYY-MM-DDThh:mm:ss')}'`;
        }
        const friends = await services.friendService.getFriends(req.user.id, where);
        res.json({friends});
    });
    router.delete('/friends', async (req, res) => {
        const params = {
            user_1: req.user.id,
            user_2: req.query.user
        } 
        if(!params.user_2) {
            const result = {
                message: 'user required',
                type: 'BadRequest',
                code: 400
            }
            return res.status(result.code).json(result);
        }
        if(params.user_1 === params.user_2) {
            const result = {
                message: 'You can not unfriend yourself',
                type: 'BadRequest',
                code: 400
            }
            return res.status(result.code).json(result);
        }
        const friendParam = {
            [Op.or]: [{
                [Op.and]: [params]
            },
            {
                [Op.and]: [{
                    user_1: params.user_2,
                    user_2: params.user_1
                }]
            }]
        }
        const friend = await services.friendService.getFriend(friendParam);
        if(!friend) {
            const result = {
                message: 'This user is not your friend',
                type: 'NotFound',
                code: 404
            }
            return res.status(result.code).json(result);
        }
        await friend.destroy();
        const result = {
            message: 'Friend removed successfully',
            type: 'Success',
            code: 200
        }
        res.json(result);
    });
    router.get('/friends/requests', async (req, res) => {
        const whereObj = {
            status: 'pending',
            user_2: req.user.id
        }
        if(req.query.before) {
            whereObj.created = {
                [Op.lt]: moment(req.query.before).toDate()
            }
        }
        if(req.query.after) {
            whereObj.created = {
                [Op.gt]: moment(req.query.after).toDate()
            }
        }
        const friendRequests = await services.friendService.getFriendRequests(whereObj);
        res.json({friendRequests});
    });

    router.post('/friends/requests', async (req, res) => {
        const params = {
            user_1: req.user.id,
            user_2: req.query.user
        }
        if(!params.user_2) {
            const result = {
                message: 'user required',
                type: 'BadRequest',
                code: 400
            }
            return res.status(result.code).json(result);
        }
        if(params.user_1 === params.user_2) {
            const result = {
                message: 'You can not send friend request to yourself',
                type: 'BadRequest',
                code: 400
            }
            return res.status(result.code).json(result);
        }
        const friendParam = {
            [Op.or]: [{
                [Op.and]: [params]
            },
            {
                [Op.and]: [{
                    user_1: params.user_2,
                    user_2: params.user_1
                }]
            }]
        }
        const friendRequestParam = {
            status: 'pending',
            ...friendParam
        }
        const isExists = await Promise.all([
            services.friendService.getUser({id: req.query.user}),
            services.friendService.getFriend(friendParam),
            services.friendService.getFriendRequest(friendRequestParam)
        ]);
        if(!isExists[0]) {
            const result = {
                message: 'User with given id not found',
                type: 'NotFound',
                code: 404
            }
            return res.status(result.code).json(result);
        }
        if(isExists[1]) {
            const result = {
                message: 'User already friend',
                type: 'BadRequest',
                code: 400
            }
            return res.status(result.code).json(result);
        }
        if(isExists[2]) {
            const result = {
                message: 'User already have a pending request',
                type: 'BadRequest',
                code: 400
            }
            return res.status(result.code).json(result);
        }
        const friendRequest = await services.friendService.createFriendRequest(params);
        res.json(friendRequest);
    });

    router.patch('/friends/requests/:id', async (req, res) => {
        const params = {
            userId: req.user.id,
            id: req.params.id,
            accept: req.query.accept
        }
        if(!params.accept) {
            const result = {
                message: 'accept required',
                type: 'BadRequest',
                code: 400
            }
            return res.status(result.code).json(result);
        }
        if(!(params.accept.toUpperCase() === 'TRUE' || params.accept.toUpperCase() === 'FALSE')) {
            const result = {
                message: 'accept must be true or false',
                type: 'BadRequest',
                code: 400
            }
            return res.status(result.code).json(result);
        }
        params.accept = params.accept.toUpperCase() === 'TRUE' ? true : false;
        const friendRequest = await services.friendService.getFriendRequest({id: params.id})
        if(!friendRequest) {
            const result = {
                message: 'Friend request with that id not found',
                type: 'NotFound',
                code: 404
            }
            return res.status(result.code).json(result);
        }
        if(friendRequest.status !== 'pending') {
            const result = {
                message: 'This friend request already ' + friendRequest.status,
                type: 'BadRequest',
                code: 400
            }
            return res.status(result.code).json(result);
        }
        if(friendRequest.toUser.id !== params.userId) {
            const result = {
                message: 'You are not authorized to process this friend request',
                type: 'Unauthorized',
                code: 403
            }
            return res.status(result.code).json(result);
        }
        friendRequest.status = params.accept ? 'accepted' : 'rejected';
        const processFriendRequest = [friendRequest.save()];
        if(params.accept) {
            processFriendRequest.push(
                services.friendService.createFriend({
                    user_1: friendRequest.fromUser.id,
                    user_2: friendRequest.toUser.id
                })
            );
        }
        await Promise.all(processFriendRequest);
        res.json(friendRequest);
    });

    router.get('/users/autocomplete', async (req, res) => {
        const name = req.query.name;
        if(!name) {
            const result = {
                message: 'name required',
                type: 'BadRequest',
                code: 400
            }
            return res.status(result.code).json(result);
        }
        const where = `username LIKE '%${name}%' OR CONCAT(first_name, ' ', last_name) LIKE  '%${name}%' `
        const users = await services.friendService.getUsers(where);
        if(!users.length) {
            const result = {
                message: 'There are no user with given name',
                type: 'NoContent',
                code: 204
            }
            return res.status(result.code).json(result);
        }
        res.json({users});
    });
    router.get('/users/:username', async (req, res) => {
        const user = await services.friendService.getUser({userName: req.params.username});
        if(!user) {
            const result = {
                message: 'User with that username not found',
                type: 'NotFound',
                code: 404
            }
            return res.status(result.code).json(result);
        }
        res.json(user);
    });

}