module.exports = (models) => {

    const conversationService = {
        getConversationById: async (id, userId) => {
            return models.Conversation.findByPk(id, {
                attributes: ['id', 'created', 'modified', 'active', 'type'],
                include: [
                {
                    model: models.User,
                    as: 'participants',
                    attributes:['id', 'firstName', 'lastName', 'userName', 'pic'],
                    through: {
                        attributes: []
                    }
                },
                {
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
        getConversation: async (whereObj, userId) => {
            return models.Conversation.findOne({
                where: {
                    type: 'direct'
                },
                attributes: ['id', 'created', 'modified', 'active', 'type'],
                include: [{
                    model: models.Participant,
                    as: 'Participant',
                    where: whereObj,
                    attributes: []
                },
                {
                    model: models.User,
                    as: 'participants',
                    attributes:['id', 'firstName', 'lastName', 'userName', 'pic'],
                    through: {
                        attributes: []
                    }
                },
                {
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
        getConversationByEventId: async (eventId, userId) => {
            return models.Conversation.findOne({
                where: {
                    active: true
                },
                attributes: ['id'],
                include: [
                {
                    model: models.Event,
                    as: 'event',
                    where: {
                        id: eventId
                    },
                    attributes: ['id']
                }]
            });
        },
        getJoinedConversations: async (whereOption, userId) => {
            return models.Conversation.findAll({
                where: whereOption,
                order: [
                    ['id', 'DESC']
                ],
                limit: 15,
                attributes: ['id', 'created', 'modified', 'active', 'type'],
                include: [{
                    model: models.Participant,
                    as: 'Participant',
                    attributes:[],
                    where: {
                        userId
                    }
                }, {
                    model: models.User,
                    as: 'participants',
                    attributes:['id', 'firstName', 'lastName', 'userName', 'pic'],
                    through: {
                        attributes: []
                    }
                },
                {
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
        getParticipant: async (whereObj) => {
            return models.Participant.findOne({
                where: whereObj
            });
        },
        deleteParticipant: async (whereObj) => {
            return models.Participant.destroy({
                where: whereObj
            });
        },
        createParticipant: async (objData) => {
            return  models.Participant.create(objData);
        },
        createConversation: async (objData) => {
            return  models.Conversation.create(objData);
        },
        getMessages: async (whereObj) => {
            return models.Message.findAll({
                where: whereObj,
                attributes: {
                    exclude: ['conversation_id']
                }
            });
        },
        createMessages: async (objData) => {
            return  models.Message.create(objData);
        }
    }
    return {
        conversationService
    }
}