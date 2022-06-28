'use strict'

const Joi = require('joi')
const createHttpError = require('http-errors')

module.exports = {
  validate: (validator, prop) => {
    return async function(req, res, next) {
      try {
        const validated = await validator.validateAsync(req[prop])
        req[prop] = validated
        next()
      } catch (err) {
        if (err.isJoi)
          return next(createHttpError(422, { message: err.message }))

        next(createHttpError(500))
      }
    }
  },

  getTokenSchema: Joi.object({
    idUser: Joi.string().required(),
    roomName: Joi.string().required()
  })
}
