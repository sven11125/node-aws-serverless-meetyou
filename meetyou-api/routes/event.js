const moment = require('moment');
const Op = require("sequelize").Op;

const socketioEmitter = require('../lib/socketio_emitter');

module.exports = (router, services, validators) => {
    router.get('/events', async (req, res) => {
        const whereObj = {}
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
        const events = await services.eventService.getEvents(whereObj, req.user.id);
        res.json({events});
    });
    router.post('/events', async (req, res) => {
        try {
            const time = moment(req.body.time);
            if(!time.isValid()) {
                const result = {
                    message: 'Invalid date format for "time"',
                    type: 'BadRequest',
                    code: 400
                }
                return res.status(result.code).json(result);
            }
            const validationResult = validators.eventValidator.createEventValidator(req.body);
            if(validationResult.error && validationResult.error.details && validationResult.error.details.length) {
                console.log('validationResult ', validationResult.error.details[0]);
                const result = {
                    message: validationResult.error.details[0].message,
                    type: 'BadRequest',
                    code: 400
                }
                return res.status(result.code).json(result);
            }
            req.body.time = time.toDate();
            req.body.host_id = req.user.id;
            // req.body.conversation = {
            //     type: 'event'
            // }
            // req.body.eventJoineds = [{
            //     userId: req.body.host_id
            // }]
            
            const conversation = await services.conversationService.createConversation({type: 'event'});
            req.body.conversationId = conversation.id
            const result = await Promise.all([
                services.eventService.createEvent(req.body),
                services.conversationService.createParticipant({
                    userId: req.user.id,
                    conversationId: conversation.id,
                    conversation_id: conversation.id
                })
            ]);
            socketioEmitter.addConversation(conversation.id, req.user.id, [req.user.id]);
            res.json(result[0]);

        } catch (error) {
            if(error.name === 'SequelizeValidationError' && error.errors && error.errors.length>0) {
                const result = {
                    message: error.errors[0].message.replace('Event.', ''),
                    type: 'BadRequest',
                    code: 400
                }
                res.status(result.code).json(result);
            } else {
                console.log(error)
                console.log(error.name);
                const result = {
                    message: 'Internal Server Error',
                    type: 'InternalServerError',
                    code: 500
                }
                res.status(result.code).json(result);
            }
        }
        
    });
    router.get('/events/history', async (req, res) => {
        const whereObj = {}
        if(req.query.before) {
            whereObj.time = {
                [Op.lt]: moment(req.query.before).toDate()
            }
        }
        if(req.query.after) {
            whereObj.time = {
                [Op.gt]: moment(req.query.after).toDate()
            }
        }
        const events = await services.eventService.getEventHistory(req.user.id, whereObj);
        events.forEach( event => event.setDataValue('host_id', undefined));
        res.json({events});
    });
    router.get('/events/:id(\\d+)', async (req, res) => {
        const event = await services.eventService.getEventById(req.params.id, req.user.id);
        if(event) {
            res.json(event);
        } else {
            const result = {
                message: 'Event with that id not found',
                type: 'NotFound',
                code: 404
            }
            res.status(result.code).json(result);
        }
    });
    router.patch('/events/:id(\\d+)', async (req, res) => {
        try {
            const time = moment(req.body.time);
            if(req.body.time && !time.isValid()) {
                const result = {
                    message: 'Invalid date format for "time"',
                    type: 'BadRequest',
                    code: 400
                }
                return res.status(result.code).json(result);
            }
            const validationResult = validators.eventValidator.updateEventValidator(req.body);
            if(validationResult.error && validationResult.error.details && validationResult.error.details.length) {
                console.log('validationResult ', validationResult.error.details[0]);
                const result = {
                    message: validationResult.error.details[0].message,
                    type: 'BadRequest',
                    code: 400
                }
                return res.status(result.code).json(result);
            }
            if(req.body.time) {
                req.body.time = time.toDate();
            }
            const params = {
                eventId: req.params.id,
                userId: req.user.id
            }
            const eventObj = await services.eventService.getEventById(params.eventId, params.userId);
            if(!eventObj) {
                const result = {
                    message: 'Event with that id not found',
                    type: 'NotFound',
                    code: 404
                }
                return res.status(result.code).json(result);
            } else if(eventObj.host.id !== params.userId) {
                const result = {
                    message: 'Only the host can make changes',
                    type: 'Forbidden',
                    code: 403
                }
                return res.status(result.code).json(result);
            } else {
                req.body.modified = new Date();
                await eventObj.update(req.body);
                res.json(eventObj);
            }
        } catch (error) {
            if(error.name === 'SequelizeValidationError' && error.errors && error.errors.length>0) {
                const result = {
                    message: error.errors[0].message.replace('Event.', ''),
                    type: 'BadRequest',
                    code: 400
                }
                res.status(result.code).json(result);
            } else {
                const result = {
                    message: 'Internal Server Error',
                    type: 'InternalServerError',
                    code: 500
                }
                res.status(result.code).json(result);
            }
        }
        
    });
    router.delete('/events/:id(\\d+)', async (req, res) => {
        const params = {
            eventId: req.params.id,
            userId: req.user.id
        }
        const eventObj = await services.eventService.getEventById(params.eventId, params.userId);
        if(!eventObj) {
            const result = {
                message: 'Event with that id not found',
                type: 'NotFound',
                code: 404
            }
            return res.status(result.code).json(result);
        } else if(eventObj.host.id !== params.userId) {
            const result = {
                message: 'Only the host can delete',
                type: 'Forbidden',
                code: 403
            }
            return res.status(result.code).json(result);
        } else {
            const conversation = await services.conversationService.getConversationByEventId(eventObj.id);
            await services.eventService.deleteEvent({id: eventObj.id});
            if(conversation) {
                socketioEmitter.closeConversation(conversation.id, params.userId);
                conversation.active = false;
                conversation.modified = new Date();
                await conversation.save();
            }
            const result = {
                message: 'Event deleted',
                type: 'Success',
                code: 200
            }
            res.json(result);
        }
        
    });

    router.post('/events/:id(\\d+)/join', async (req, res) => {
        const params = {
            userId: req.user.id,
            eventId: req.params.id
        }
        try {
            let eventObj = await services.eventService.getEventById(params.eventId, params.userId);
            if(!eventObj) {
                const result = {
                    message: 'Event with that id not found',
                    type: 'NotFound',
                    code: 404
                }
                return res.status(result.code).json(result);
            } else if(eventObj.joined) {
                const result = {
                    message: 'Event was already joined',
                    type: 'BadRequest',
                    code: 400
                }
                return res.status(result.code).json(result);
            } else {
                await services.eventService.joinEvent(params);
                const conversation = await services.conversationService.getConversationByEventId(params.eventId);
                if(conversation) {
                    await services.conversationService.createParticipant({
                        userId: params.userId,
                        conversationId: conversation.id,
                        conversation_id: conversation.id
                    });
                    socketioEmitter.addConversation(conversation.id, params.userId, [params.userId]);
                }
                eventObj = await services.eventService.getEventById(params.eventId, params.userId);
                res.json(eventObj);
            }
        } catch (error) {
            if(error.name === 'SequelizeForeignKeyConstraintError') {
                const result = {
                    message: 'Event with that id not found',
                    type: 'NotFound',
                    code: 404
                }
                res.status(result.code).json(result);
            } else if(error.name === 'SequelizeUniqueConstraintError') {
                const result = {
                    message: 'Event was already joined',
                    type: 'BadRequest',
                    code: 400
                }
                res.status(result.code).json(result);
            } else {
                console.log(error)
                console.log(error.name)
                const result = {
                    message: 'Internal Server Error',
                    type: 'InternalServerError',
                    code: 500
                }
                res.status(result.code).json(result);
            }
        }
        
    });
    router.delete('/events/:id(\\d+)/join', async (req, res) => {
        const params = {
            userId: req.user.id,
            eventId: req.params.id,
        }
        let eventObj = await services.eventService.getEventById(params.eventId, params.userId);
        if(!eventObj) {
            const result = {
                message: 'Event with that id not found',
                type: 'NotFound',
                code: 404
            }
            return res.status(result.code).json(result);
        } else if(!eventObj.joined) {
            const result = {
                message: 'wasn\'t attending event already',
                type: 'BadRequest',
                code: 400
            }
            return res.status(result.code).json(result);
        } else if(eventObj.host.id === params.userId) {
            const result = {
                message: 'You can not unjoin this even as you are host',
                type: 'BadRequest',
                code: 400
            }
            return res.status(result.code).json(result);
        } else {
            await services.eventService.unjoinEvent(params);
            const conversation = await services.conversationService.getConversationByEventId(params.eventId);
            if(conversation) {
                await services.conversationService.deleteParticipant({
                    conversationId: conversation.id,
                    userId: params.userId
                });
                socketioEmitter.leaveConversation(conversation.id, params.userId);
            }
            eventObj = await services.eventService.getEventById(params.eventId, params.userId);
            res.json(eventObj);
        }
    });


    router.post('/events/:id(\\d+)/changes', async (req, res) => {
        const whereOptions = {
            userId: req.user.id,
            eventId: req.params.id
        }
        const validationResult = validators.eventValidator.changeProposalValidator(req.body);
        if(validationResult.error && validationResult.error.details && validationResult.error.details.length) {
            console.log('validationResult ', validationResult.error.details[0]);
            const result = {
                message: validationResult.error.details[0].message,
                type: 'BadRequest',
                code: 400
            }
            return res.status(result.code).json(result);
        }
        const isExist = await Promise.all([
            services.eventService.getEventJoined(whereOptions),
            services.eventService.getChangeProposals({eventId: whereOptions.eventId, status: 'active'}, whereOptions.userId)
        ]);
        if(!isExist[0]) {
            const result = {
                message: 'You must joined this event before proposing change',
                type: 'Unauthorized',
                code: 403
            }
            return res.status(result.code).json(result);
        } else if(isExist[1].length) {
            const result = {
                message: 'There\'s already an active proposal for this event',
                type: 'BadRequest',
                code: 400
            }
            return res.status(result.code).json(result);
        } else {
            const params = {
                createdBy: req.user.id,
                eventId: req.params.id,
                type: req.body.location ? 'location' : 'time',
                proposal: req.body.location || req.body.time,
                ChangeProposalsVotes: [{
                    yes: true,
                    userId: req.user.id
                }]
            }
            const result = await services.eventService.createChangeProposal(params);
            return res.json(result);
        }
    });

    router.get('/events/:id(\\d+)/changes', async (req, res) => {
        const whereOptions = {
            userId: req.user.id,
            eventId: req.params.id
        }
        const isEventJoined = await services.eventService.getEventJoined(whereOptions);
        if(isEventJoined) {    
            const params = {
                eventId: req.params.id
            }
            const proposals = await services.eventService.getChangeProposals(params, whereOptions.userId);
            return res.json({proposals});
        } else {
            const result = {
                message: 'Only joined user can see proposal',
                type: 'Unauthorized',
                code: 403
            }
            return res.status(result.code).json(result);
        }
    });

    router.post('/events/changes/:id(\\d+)/accept', async (req, res) => {
        if(!req.query.accept || (req.query.accept.toUpperCase() != 'TRUE' && req.query.accept.toUpperCase() != 'FALSE')) {
            const result = {
                message: 'accept query string must be boolean(true or false)',
                type: 'BadRequest',
                code: 400
            }
            return res.status(result.code).json(result);
        }
        const whereOptions = {
            host: req.user.id,
            id: req.params.id,
            accept: req.query.accept && req.query.accept.toUpperCase() === 'TRUE'
        }
        const changeProposalObj = await services.eventService.getChangeProposalById(whereOptions.id, whereOptions.host); 
        if(changeProposalObj) {
            if(changeProposalObj.Event.host_id === whereOptions.host) {
                changeProposalObj.status = whereOptions.accept ? 'approved' : 'rejected';
                const objUpdate = [
                    changeProposalObj.save(),
                    services.conversationService.getConversationByEventId(changeProposalObj.Event.id)
                ]
                const message = `Proposed changes ${changeProposalObj.type} from ${changeProposalObj.Event[changeProposalObj.type]} to ${changeProposalObj.proposal} was ${changeProposalObj.status}`;
                if(whereOptions.accept) {
                    changeProposalObj.Event[changeProposalObj.type] = changeProposalObj.proposal;
                    objUpdate.push(changeProposalObj.Event.save());
                }
                const result = await Promise.all(objUpdate);
                console.log(changeProposalObj.id, changeProposalObj.Event.id, result[1].id)
                socketioEmitter.proposalChangesAction(result[1].id, message, whereOptions.host);
                changeProposalObj.setDataValue('Event', undefined);
                return res.json(changeProposalObj);
            } else {
                const result = {
                    message: 'Only host can accept change proposal',
                    type: 'Unauthorized',
                    code: 403
                }
                return res.status(result.code).json(result);
            }
        } else {
            const result = {
                message: 'Change proposal with that id not found',
                type: 'NotFound',
                code: 404
            }
            return res.status(result.code).json(result);
        }
    });


    router.post('/events/changes/:id(\\d+)/vote', async (req, res) => {
        if(!req.query.vote || (req.query.vote.toUpperCase() != 'TRUE' && req.query.vote.toUpperCase() != 'FALSE')) {
            const result = {
                message: 'vote query string must be boolean(true or false)',
                type: 'BadRequest',
                code: 400
            }
            return res.status(result.code).json(result);
        }
        const params = {
            userId: req.user.id,
            proposalId: req.params.id
        }
        let changeProposalObj = await services.eventService.getChangeProposalById(params.proposalId); 
        if(changeProposalObj) {
            const isEventJoined = await services.eventService.getEventJoined({userId: params.userId, eventId: changeProposalObj.Event.id}); 
            if(isEventJoined) {
                const changeProposalsVote = await services.eventService.getChangeProposalVote(params);
                const options = {
                    ...params,
                    yes: req.query.vote.toUpperCase() === 'TRUE',
                    no: req.query.vote.toUpperCase() !== 'TRUE'
                }
                if(changeProposalsVote) {
                    if(changeProposalsVote.yes == options.yes || changeProposalsVote.no == options.no) {
                        const result = {
                            message: 'You have already submited your vote',
                            type: 'BadRequest',
                            code: 400
                        }
                        return res.status(result.code).json(result);
                    } else {
                        const message = `Proposal changes ${changeProposalObj.type} from ${changeProposalObj.Event[changeProposalObj.type]} to ${changeProposalObj.proposal} was voted ${options.yes ? 'yes' : 'no'}`;
                        socketioEmitter.proposalChangesVote(changeProposalObj.Event.host_id, message, params.userId);
                        changeProposalsVote.yes = options.yes;
                        changeProposalsVote.no = options.no;
                        await changeProposalsVote.save();
                    }
                } else {
                    await services.eventService.createChangeProposalVote(options);   
                }
                changeProposalObj = await services.eventService.getChangeProposalById(params.proposalId, params.userId); 
                changeProposalObj.setDataValue('Event', undefined);
                return res.json(changeProposalObj);
            } else {
                const result = {
                    message: 'Only joined user can vote for proposal',
                    type: 'Unauthorized',
                    code: 403
                }
                return res.status(result.code).json(result);
            }
        } else {
            const result = {
                message: 'Change proposal with that id not found',
                type: 'NotFound',
                code: 404
            }
            return res.status(result.code).json(result);
        }
    });

    router.get('/events/invites', async (req, res) => {
        const whereOptions = {
            [Op.or]: [
                {
                    toUser: req.user.id
                },
                {
                    fromUser: req.user.id
                }
            ]
        }
        if(req.query.before) {
            whereOptions.id = {
                [Op.lt]: req.query.before
            }
        }
        if(req.query.after) {
            whereOptions.id = {
                [Op.gt]: req.query.after
            }
        }
        const eventInvites = await services.eventService.getEventInvites(whereOptions, req.user.id);
        if(eventInvites.length) {    
            return res.json({eventInvites});
        } else {
            const result = {
                message: 'no more event invites found',
                type: 'NoContent',
                code: 204
            }
            return res.status(result.code).json(result);
        }
    });

    router.post('/events/invites', async (req, res) => {
        const params = {
            fromUser: req.user.id,
            toUser: req.query.user,
            eventId: req.query.event
        }
        if(!params.toUser || !params.eventId) {
            const result = {
                message: 'user and event is required',
                type: 'BadRequest',
                code: 400
            }
            return res.status(result.code).json(result);
        }
        const isExist = await Promise.all([
            services.eventService.getEventJoined({eventId: params.eventId, userId: params.toUser}),
            services.eventService.getEventInvite({eventId: params.eventId, toUser: params.toUser}, params.fromUser)
        ]); 
        if(isExist[0]) {
            const result = {
                message: 'User already joined this event',
                type: 'BadRequest',
                code: 400
            }
            return res.status(result.code).json(result);
        } else if(isExist[1]) {
            const result = {
                message: 'User already invited for this event',
                type: 'BadRequest',
                code: 400
            }
            return res.status(result.code).json(result);
        } else {
            try {
                const eventInviteObj = await services.eventService.createEventInvites(params);
                return res.json(eventInviteObj);
            } catch (error) {
                if(error.name === 'SequelizeForeignKeyConstraintError') {
                    const result = {
                        message: 'Event with that id not found',
                        type: 'NotFound',
                        code: 404
                    }
                    return res.status(result.code).json(result);
                }
                console.log(error);
                console.log(error.name);
                const result = {
                    message: 'Internal Server Error',
                    type: 'InternalServerError',
                    code: 500
                }
                return res.status(result.code).json(result);
            }
        }
    });

    router.patch('/events/invites/:id(\\d+)', async (req, res) => {
        if(!req.query.accept || (req.query.accept.toUpperCase() != 'TRUE' && req.query.accept.toUpperCase() != 'FALSE')) {
            const result = {
                message: 'accept query string must be boolean(true or false)',
                type: 'BadRequest',
                code: 400
            }
            return res.status(result.code).json(result);
        }
        const whereOptions = {
            userId: req.user.id,
            id: req.params.id,
            accept: req.query.accept && req.query.accept.toUpperCase() === 'TRUE'
        }
        const eventInviteObj = await services.eventService.getEventInvite({id: whereOptions.id}, whereOptions.userId); 
        if(eventInviteObj) {
            if(eventInviteObj.toUser === whereOptions.userId) {
                if(eventInviteObj.status !== 'pending') {
                    const result = {
                        message: `Event invite was already ${eventInviteObj.status}`,
                        type: 'BadRequest',
                        code: 400
                    }
                    return res.status(result.code).json(result);
                }
                eventInviteObj.status = whereOptions.accept ? 'accepted' : 'rejected';
                const objUpdate = [eventInviteObj.save()]
                if(whereOptions.accept) {
                    const params = {
                        userId: whereOptions.userId,
                        eventId: eventInviteObj.event.id
                    }
                    objUpdate.push(services.eventService.joinEvent(params));
                    objUpdate.push(services.conversationService.getConversationByEventId(eventInviteObj.event.id));
                
                }
                try {
                    const result = await Promise.all(objUpdate);
                    if(result && result.length>1 && result[2]) {
                        await services.conversationService.createParticipant({
                            userId: whereOptions.userId,
                            conversationId: result[2].id,
                            conversation_id: result[2].id
                        });
                        socketioEmitter.addConversation(result[2].id, params.userId, [params.userId]);
                    }
                    return res.json(eventInviteObj);
                } catch (error) {
                    if(error.name === 'SequelizeForeignKeyConstraintError') {
                        const result = {
                            message: 'Event with that id not found',
                            type: 'NotFound',
                            code: 404
                        }
                        res.status(result.code).json(result);
                    } else if(error.name === 'SequelizeUniqueConstraintError') {
                        const result = {
                            message: 'Event was already joined',
                            type: 'BadRequest',
                            code: 400
                        }
                        res.status(result.code).json(result);
                    } else {
                        console.log(error)
                        console.log(error.name)
                        const result = {
                            message: 'Internal Server Error',
                            type: 'InternalServerError',
                            code: 500
                        }
                        res.status(result.code).json(result);
                    }
                }
            } else {
                const result = {
                    message: 'Only invited user can accept or reject invitation',
                    type: 'Unauthorized',
                    code: 403
                }
                return res.status(result.code).json(result);
            }
        } else {
            const result = {
                message: 'event invite with that id not found',
                type: 'NotFound',
                code: 404
            }
            return res.status(result.code).json(result);
        }
    });
}
