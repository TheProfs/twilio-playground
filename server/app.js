'use strict'

const path = require('path')
const express = require('express')
const AccessToken = require('twilio').jwt.AccessToken
const validators = require('./validators')

const app = express()
const VideoGrant = AccessToken.VideoGrant

const twilioAccountSid = process.env.twilioAccountSid
const twilioApiKey = process.env.twilioApiKey
const twilioApiSecret = process.env.twilioApiSecret

app.set('port', (process.env.PORT || 5008))

app.get('/', async (req, res, next) => {
  res.sendFile(path.resolve(__dirname, '../index.html'))
})

app.get(
  '/token',
  validators.validate(validators.getTokenSchema, 'query'),
  async (req, res, next) => {
    const videoGrant = new VideoGrant({ room: req.query.roomName })
    const token = new AccessToken(
      twilioAccountSid,
      twilioApiKey,
      twilioApiSecret,
      {
        identity: req.query.idUser
      }
    )

    token.addGrant(videoGrant)

    res.json(token.toJwt())
})

app.listen(app.get('port'), () => {
  console.log(`Listening at http://localhost:${app.get('port')}`)
})
