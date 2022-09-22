const Joi = require('joi');

const joiOptions = {
    presence: 'required'
}

const eventSchema = Joi.object().keys({
    name: Joi.string().max(50),
    time: Joi.date(),
    locationName: Joi.string().max(100).allow(null, '').optional(),
    location: Joi.string().max(255),
    shortDescription: Joi.string().max(80),
    description: Joi.string(),
    type: Joi.string().valid('private', 'friends', 'public'),
    status: Joi.string().valid('upcoming', 'ongoing', 'ended', 'canceled').optional()
});

const changeProposalSchema = Joi.object().keys({
    time: Joi.date(),
    location: Joi.string().max(255)
}).xor('time', 'location');

module.exports = {
    eventValidator: {
        createEventValidator: (data) => {
            return Joi.validate(data, eventSchema, joiOptions);
        },
        updateEventValidator: (data) => {
            return Joi.validate(data, eventSchema);
        },
        changeProposalValidator: (data) => {
            return Joi.validate(data, changeProposalSchema);
        }
    }
}