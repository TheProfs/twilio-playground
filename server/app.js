'use strict'

const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const Twilio = require('twilio')
const AccessToken = Twilio.jwt.AccessToken
const validators = require('./validators')

const twilioAccountSid = process.env.twilioAccountSid
const twilioApiKey = process.env.twilioApiKey
const twilioApiSecret = process.env.twilioApiSecret

const app = express()
const VideoGrant = AccessToken.VideoGrant
const twilioClient = Twilio(twilioApiKey, twilioApiSecret, {
  accountSid: twilioAccountSid
})

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

        res.json(await twilioClient.video.rooms(req.body.roomName).fetch())
      } catch (err) {
        if (err.status === 404) {
          const room = await twilioClient.video.rooms.create({
            type: req.body.roomType,
            uniqueName: req.body.roomName
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
