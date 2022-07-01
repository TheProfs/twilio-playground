'use strict'

const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const Twilio = require('twilio')
const validators = require('./validators')

const accountSid = process.env.twilioAccountSid
const apiKey = process.env.twilioApiKey
const apiSecret = process.env.twilioApiSecret

const AccessToken = Twilio.jwt.AccessToken
const VideoGrant = AccessToken.VideoGrant

const app = express()
const twilioClient = Twilio(apiKey, apiSecret, { accountSid })

app.set('port', (process.env.PORT || 5008))
app.use(bodyParser.json())

app.get('/', async (req, res, next) => {
  res.sendFile(path.resolve(__dirname, '../index.html'))
})

app.post(
  '/room',
  validators.validate(validators.room.post),
  async (req, res, next) => {
    try {
      try {
        const room = await twilioClient.video.rooms(req.body.roomName).fetch()

        res.json(room)
      } catch (err) {
        if (err.status === 404) {
          const room = await twilioClient.video.rooms.create({
            type: req.body.roomType,
            uniqueName: req.body.roomName,
            recordParticipantsOnConnect: req.body.roomShouldRecord
          })

          return res.json(room)
        }

        throw err
      }
    } catch (err) {
      next(err)
    }
  })

app.get(
  '/token',
  validators.validate(validators.token.get),
  async (req, res, next) => {
    try {
      const videoGrant = new VideoGrant({ room: req.query.roomName })
      const token = new AccessToken(accountSid, apiKey, apiSecret, {
        identity: req.query.idUser
      })

      token.addGrant(videoGrant)

      res.json(token.toJwt())
    } catch (err) {
      next(err)
    }
  })

app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).send({
    code: err.code || null,
    message: err.message || 'A server error occured'
  })
})

app.listen(app.get('port'), () => {
  console.log(`Listening at http://localhost:${app.get('port')}`)
})
