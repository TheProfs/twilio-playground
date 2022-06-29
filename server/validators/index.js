'use strict'

const Joi = require('joi')
const createHttpError = require('http-errors')

module.exports = {
  validate: (validator) => {
    return async function(req, res, next) {
      const prop = req.method === 'GET' ? 'query' : 'body'

      try {
        const validated = await validator.validateAsync(req[prop])
        req[prop] = validated
        next()
      } catch (err) {
        if (err.isJoi)
          return next(createHttpError(422, {
            message: err.message,
            path: req.path,
            method: req.method,
            prop: prop
          }))

        next(createHttpError(500))
      }
    }
  },

  token: {
    get: Joi.object({
      idUser: Joi.string().required(),
      roomName: Joi.string().required()
    })
  },

  room: {
    post: Joi.object({
      roomName: Joi.string().required(),
      roomType: Joi.string()
        .valid('go','peer-to-peer', 'group-small', 'group')
        .required()
    })
  }
}
