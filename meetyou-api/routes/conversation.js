const moment = require('moment');
const Op = require("sequelize").Op;

const socketioEmitter = require('../lib/socketio_emitter');

module.exports = (router, services) => {
    router.get('/conversations', async (req, res) => {
        const whereObj = {}
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
        const conversations = await services.conversationService.getJoinedConversations(whereObj, req.user.id);
        res.json({conversations});
    });

    router.post('/conversations', async (req, res) => {
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
                message: 'You can not create conversation for yourself',
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
        const isExists = await Promise.all([
            services.friendService.getUser({id: params.user_2}),
            services.friendService.getFriend(friendParam)
        ]);
        if(!isExists[0]) {
            const result = {
                message: 'User not found',
                type: 'NotFound',
                code: 404
            }
            return res.status(result.code).json(result);
        }
        if(!isExists[1]) {
            const result = {
                message: 'This user is not your friend',
                type: 'NotFound',
                code: 400
            }
            return res.status(result.code).json(result);
        }

        let conversation = await services.conversationService.getConversation({
            [Op.and]: [{
                userId: params.user_1,
                userId: params.user_2
            }]
        }, params.user_1);
        if(!conversation) {
            conversation = await services.conversationService.createConversation({});
            await Promise.all([
                services.conversationService.createParticipant(
                    {
                        userId: params.user_1,
                        conversationId: conversation.id,
                        conversation_id: conversation.id
                    }
                ),
                services.conversationService.createParticipant(
                    {
                        userId: params.user_2,
                        conversationId: conversation.id,
                        conversation_id: conversation.id
                    }
                )
            ]);
            socketioEmitter.addConversation(conversation.id, params.user_1, [params.user_1, params.user_2]);
            conversation = await services.conversationService.getConversation({
                [Op.and]: [{
                    userId: params.user_1,
                    userId: params.user_2
                }]
            }, params.user_1);
        }
        res.json({conversation});
    });

    router.get('/conversations/:id', async (req, res) => {
        const whereObj = {
            conversationId: req.params.id
        }
        if(req.query.before) {
            whereObj.id = {
                [Op.lt]: req.query.before
            }
        }
        if(req.query.after) {
            whereObj.id = {
                [Op.gt]: req.query.after
            }
        }
        const messages = await services.conversationService.getMessages(whereObj);
        res.json({conversations: messages});
    });

    router.post('/conversations/:id/message', async (req, res) => {
        const params = {
            userId: req.user.id,
            conversationId: req.params.id
        } 
        const isExists = await Promise.all([
            services.conversationService.getConversationById(params.conversationId, params.userId),
            services.conversationService.getParticipant(params)
        ]);
        if(!isExists[0]) {
            const result = {
                message: 'Conversation with that id not found',
                type: 'NotFound',
                code: 404
            }
            return res.status(result.code).json(result);
        }
        if(!isExists[0].active) {
            const result = {
                message: 'This conversation is inactive',
                type: 'BadRequest',
                code: 400
            }
            return res.status(result.code).json(result);
        }
        if(!isExists[1]) {
            const result = {
                message: 'You are not member of this conversation',
                type: 'Unauthorized',
                code: 403
            }
            return res.status(result.code).json(result);
        }
        socketioEmitter.sendMessage(params.conversationId, req.body.message, params.userId);
        const message = await services.conversationService.createMessages({
            fromUserId: params.userId,
            conversationId: params.conversationId,
            content: req.body.message 
        });
        res.json(message);
    });

    router.post('/conversations/:id/close', async (req, res) => {
        const params = {
            userId: req.user.id,
            conversationId: req.params.id
        } 
        const isExists = await Promise.all([
            services.conversationService.getConversationById(params.conversationId, params.userId),
            services.conversationService.getParticipant(params)
        ]);
        if(!isExists[0]) {
            const result = {
                message: 'Conversation with that id not found',
                type: 'NotFound',
                code: 404
            }
            return res.status(result.code).json(result);
        }
        if(!isExists[0].active) {
            const result = {
                message: 'This conversation is already inactive',
                type: 'BadRequest',
                code: 400
            }
            return res.status(result.code).json(result);
        }
        if(isExists[0].type === 'event' && isExists[0].event && isExists[0].event.host && isExists[0].event.host.id !== params.userId) {
            const result = {
                message: 'You must be host of the event for this conversation',
                type: 'Unauthorized',
                code: 403
            }
            return res.status(result.code).json(result);
        }
        if(isExists[0].type === 'direct' && !isExists[1]) {
            const result = {
                message: 'You are not member of this conversation',
                type: 'Unauthorized',
                code: 403
            }
            return res.status(result.code).json(result);
        }
        socketioEmitter.closeConversation(params.conversationId, params.userId);
        isExists[0].active = false;
        isExists[0].modified = new Date();
        await isExists[0].save();
        res.json(isExists[0]);
    });
}