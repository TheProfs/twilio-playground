'use strict'

const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const Twilio = require('twilio')
const servicebus = require('servicebus')
const validators = require('./validators')

const app = express()
const twilioClient = Twilio(
  process.env.TWILIO_API_KEY,
  process.env.TWILIO_API_SECRET, {
  accountSid: process.env.TWILIO_ACCOUNT_SID
})
const bus = servicebus.bus({ url: process.env.AMQP_URL })

app.set('port', (process.env.PORT || 5008))
app.use(bodyParser.json())

// List of event names:
// https://www.twilio.com/docs/video/api/status-callbacks#rooms-callback-events

;['room-created', 'recording-started', 'recording-completed'].forEach(event => {
  bus.listen(`bp-webhook-broadcast.staging.twilio.room.${event}`, event => {
    console.log(event)
  })
})

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
            recordParticipantsOnConnect: req.body.roomShouldRecord,
            statusCallback: process.env.TWILIO_STATUS_CALLBACK_URL,
            statusCallbackMethod: 'POST'
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
      const videoGrant = new Twilio.jwt.AccessToken.VideoGrant({
        room: req.query.roomName
      })
      const token = new Twilio.jwt.AccessToken(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_API_KEY,
        process.env.TWILIO_API_SECRET,
        { identity: req.query.idUser }
      )

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
