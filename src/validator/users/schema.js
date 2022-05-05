// skema dibuat sesuai dengan ketetapan API yang dibuat, dimana 'username', 'password', dan 'fullname' harus didefinisikan (required) dan bertipe  string.
const Joi = require('joi');

const UserPayloadSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
    fullname: Joi.string().required(),
});

module.exports = { UserPayloadSchema };