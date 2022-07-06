'use strict'

const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const Redis = require('redis')
const Twilio = require('twilio')
const servicebus = require('servicebus')
const validators = require('./validators')

const app = express()
const redis = Redis.createClient()
const twilioClient = Twilio(
  process.env.TWILIO_API_KEY,
  process.env.TWILIO_API_SECRET, {
  accountSid: process.env.TWILIO_ACCOUNT_SID
})
const bus = servicebus.bus({ url: process.env.AMQP_URL })

app.set('port', (process.env.PORT || 5008))
app.use(bodyParser.json())

// @NOTE
// - List of event names:
//  https://www.twilio.com/docs/video/api/status-callbacks#rooms-callback-events
// @TODO
// - [ ] These event listeners belong in a separate service, for recordings.
// = [ ] Implement `recording-failed` event listener.
bus.listen(
  `${process.env.TWILIO_ROOM_EVENT_QUEUE}.recording-started`,
  async event => {

  try {
    await redis.lPush(`${event.RoomSid}-tracks`, JSON.stringify(event))
    await redis.incr(`${event.RoomSid}-open-recordings`)
  } catch (err) {
    console.error(err)
  }
})

// @REVIEW
// - Is this truly multi-dyno safe?
//   It should be because it doesn't matter on which dyno the last event
//   arrives. `redis.decr()` is an atomic operation that *also returns* the
//   decremented value.
bus.listen(
  `${process.env.TWILIO_ROOM_EVENT_QUEUE}.recording-completed`,
  async event => {

  try {
    const openRecordings = await redis.decr(`${event.RoomSid}-open-recordings`)

    if (openRecordings === 0) {
      const tracks = await redis.lRange(`${event.RoomSid}-tracks`, 0, -1)
        .then(res => res ? res.map(val => JSON.parse(val)) : [])

      await redis.del(`${event.RoomSid}-tracks`)

      console.log(tracks)
      console.log('Call end, tracks:', tracks.map(track => track.RecordingSid))
    }
  } catch (err) {
    console.error(err)
  }
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

        return res.json(room)
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

;(async () => {
  await redis.connect()

  app.listen(app.get('port'), async () => {
    console.log(`Listening at http://localhost:${app.get('port')}`)
  })
})()
