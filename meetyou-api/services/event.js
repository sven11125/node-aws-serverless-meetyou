module.exports = (models) => {

    const eventService = {
        getEventById: async (id, userId) => {
            return models.Event.findByPk(id, {
                attributes: [
                    'id', 'name', 'time', 'location', 'description', 'shortDescription', 'created', 'modified', 'type', 'status',
                    [models.sequelize.literal('(SELECT COUNT(*) FROM event_joined WHERE event_joined.event_id = Event.id)'), 'joinedCount'],
                    [models.sequelize.literal(`(SELECT COUNT(*) FROM event_joined WHERE event_joined.event_id = Event.id AND event_joined.user_id='${userId}')`), 'join']
                ],
                include: [{
                    model: models.User,
                    as: 'joinedUsers',
                    attributes:['id', 'firstName', 'lastName', 'userName', 'pic'],
                    through: {
                        attributes: []
                    }
                },
                {
                    model: models.User,
                    as: 'host',
                    attributes:['id', 'firstName', 'lastName', 'userName', 'pic']
                }]
            });
        },
        getEvents: async (whereOption, userId) => {
            return models.Event.findAll({
                where: whereOption,
                order: [
                    ['id', 'DESC']
                ],
                limit: 15,
                attributes: [
                    'id', 'name', 'time', 'location', 'shortDescription', 'created', 'modified', 'type', 'status',
                    [models.sequelize.literal('(SELECT COUNT(*) FROM event_joined WHERE event_joined.event_id = Event.id)'), 'joinedCount'],
                    [models.sequelize.literal(`(SELECT COUNT(*) FROM event_joined WHERE event_joined.event_id = Event.id AND event_joined.user_id='${userId}')`), 'join']
                ],
                include: [{
                    model: models.User,
                    as: 'host',
                    attributes:['id', 'firstName', 'lastName', 'userName', 'pic']
                }]
            });
        },
        getEventHistory: async (userId, whereOption) => {
            return models.Event.findAll({
                where: whereOption,
                order: [
                    ['time', 'DESC']
                ],
                limit: 15,
                attributes: [
                    'id', 'name', 'time', 'location', 'shortDescription', 'created', 'modified', 'type', 'status', 'host_id',
                    [models.sequelize.literal('(SELECT COUNT(*) FROM event_joined WHERE event_joined.event_id = Event.id)'), 'joinedCount'],
                    [models.sequelize.literal(`(SELECT COUNT(*) FROM event_joined WHERE event_joined.event_id = Event.id AND event_joined.user_id='${userId}')`), 'join']
                ],
                include: [{
                    model: models.EventJoined,
                    where: {
                        userId
                    },
                    attributes: []
                },
                {
                    model: models.User,
                    as: 'host',
                    attributes:['id', 'firstName', 'lastName', 'userName', 'pic']
                }]
                
            });
        },
        createEvent: async (eventObj) => {
            const event = await models.Event.create(eventObj, {
                include: [models.Conversation]
            });
            await eventService.joinEvent({userId: event.host_id, eventId: event.id})
            return eventService.getEventById(event.id, event.host_id);
        },
        updateEventById: async (whereObj, eventObj) => {
            return models.Event.update(eventObj, {
                where: whereObj
            });
        },
        deleteEvent: async (whereObj) => {
            return models.Event.destroy({
                where: whereObj
            });
        },
        getEventJoined: async (whereObj) => {
            return models.EventJoined.findOne({
                where: whereObj
            });
        },
        joinEvent: async (eventJoinedObj) => {
            return models.EventJoined.create(eventJoinedObj);
        },
        unjoinEvent: async (whereObj) => {
            return models.EventJoined.destroy({
                where: whereObj
            });
        },
        createChangeProposal: async (changeProposalsObj) => {
            const changeProposalObj = await models.ChangeProposals.create(changeProposalsObj, {
                include: [models.ChangeProposalsVote]
            });
            return eventService.getChangeProposalById(changeProposalObj.id, changeProposalObj.createdBy);
        },
        getChangeProposals: async (whereObj, userId) => {
            return models.ChangeProposals.findAll({
                where: whereObj,
                attributes: [
                    'id', 'type', 'proposal', 'status', 'vote',
                    [models.sequelize.literal('(SELECT COUNT(*) FROM change_proposals_vote WHERE change_proposals_vote.proposal_id = ChangeProposals.id and change_proposals_vote.yes=1)'), 'votesYes'],
                    [models.sequelize.literal('(SELECT COUNT(*) FROM change_proposals_vote WHERE change_proposals_vote.proposal_id = ChangeProposals.id and change_proposals_vote.no=1)'), 'votesNo'],
                    [models.sequelize.literal(`(SELECT COUNT(*) FROM change_proposals_vote WHERE change_proposals_vote.proposal_id = ChangeProposals.id AND change_proposals_vote.user_id='${userId}')`), 'is_voted']
                ]
            });
        },
        getChangeProposalById: async (id, userId) => {
            return models.ChangeProposals.findOne({
                where: {
                    id
                },
                attributes: [
                    'id', 'type', 'proposal', 'status', 'vote',
                    [models.sequelize.literal('(SELECT COUNT(*) FROM change_proposals_vote WHERE change_proposals_vote.proposal_id = ChangeProposals.id and change_proposals_vote.yes=1)'), 'votesYes'],
                    [models.sequelize.literal('(SELECT COUNT(*) FROM change_proposals_vote WHERE change_proposals_vote.proposal_id = ChangeProposals.id and change_proposals_vote.no=1)'), 'votesNo'],
                    [models.sequelize.literal(`(SELECT COUNT(*) FROM change_proposals_vote WHERE change_proposals_vote.proposal_id = ChangeProposals.id AND change_proposals_vote.user_id='${userId}')`), 'is_voted']
                ],
                include: [models.Event]
            });
        },
        createChangeProposalVote: async (changeProposalVoteObj) => {
            return models.ChangeProposalsVote.create(changeProposalVoteObj);
        },
        getChangeProposalVote: async (whereObj) => {
            return models.ChangeProposalsVote.findOne({
                where: whereObj
            });
        },
        getEventInvites: async (whereOption, userId) => {
            return models.EventInvites.findAll({
                where: whereOption,
                order: [
                    ['id', 'DESC']
                ],
                limit: 15,
                attributes: ['id', 'toUser', 'fromUser', 'created', 'status'],
                include: [{
                    model: models.Event,
                    as: 'event',
                    attributes: [
                        'id', 'name', 'time', 'location', 'shortDescription', 'created', 'modified', 'type', 'status',
                        [models.sequelize.literal('(SELECT COUNT(*) FROM event_joined WHERE event_joined.event_id = event.id)'), 'joinedCount'],
                        [models.sequelize.literal(`(SELECT COUNT(*) FROM event_joined WHERE event_joined.event_id = event.id AND event_joined.user_id='${userId}')`), 'join']
                    ],
                    include: [{
                        model: models.User,
                        as: 'host',
                        attributes:['id', 'firstName', 'lastName', 'userName', 'pic']
                    }]
                }]
            });
        },
        getEventInvite: async (whereOption, userId) => {
            return models.EventInvites.findOne({
                where: whereOption,
                attributes: ['id', 'toUser', 'fromUser', 'created', 'status'],
                include: [{
                    model: models.Event,
                    as: 'event',
                    attributes: [
                        'id', 'name', 'time', 'location', 'shortDescription', 'created', 'modified', 'type', 'status',
                        [models.sequelize.literal('(SELECT COUNT(*) FROM event_joined WHERE event_joined.event_id = event.id)'), 'joinedCount'],
                        [models.sequelize.literal(`(SELECT COUNT(*) FROM event_joined WHERE event_joined.event_id = event.id AND event_joined.user_id='${userId}')`), 'join']
                    ],
                    include: [{
                        model: models.User,
                        as: 'host',
                        attributes:['id', 'firstName', 'lastName', 'userName', 'pic']
                    }]
                }]
            });
        },
        createEventInvites: async (eventInvitesObj) => {
            return models.EventInvites.create(eventInvitesObj);
        },
    }

    return {
        eventService
    }
}