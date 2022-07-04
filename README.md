# twilio-playground

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

[Twilio][twilio] calls playground

## Install

Clone this repo, `cd` into it and then:

```bash
$ npm install
```

### Set required environmental variables

```bash
# Twilio API credentials (https://console.twilio.com/)
$ export TWILIO_ACCOUNT_SID=<account-SID> # starts with AC
$ export TWILIO_API_KEY=<api-key-name> # starts with SK
$ export TWILIO_API_SECRET=<api-secret>

# Webhook URL for receiving Room status events
$ export TWILIO_STATUS_CALLBACK_URL=https://bp-webhook-broadcast.herokuapp.com/staging/twilio/room/event

# Cloud AMQP URL (https://www.cloudamqp.com/)
$ export AMQP_URL=<cloud_amqp_url>
```

You can permanently set these variables in `~/.zshenv`:

```bash
$ touch ~/.zshenv
$ nano ~/.zshenv
# type the exports in the file, save and then:
$ source ~/.zshenv
```

## Run

Run:

```bash
$ npm run start-dev
```

then visit http://localhost:5008

## Process

 - Client sends a request to create a *Room*. If the *Room* does not exist, it
   is created.
 - Client sends a server request to create an *Access Token*, granting access
   to that *Room*.
 - Client connects to the *Room* using the *Access Token*.

## Contributing

```bash
# Lint before commiting
$ npm run lint
```

## Authors

- [@nicholaswmin][nicholaswmin]

[twilio]: https://twilio.com
[twilio-console]: https://console.twilio.com/
[nicholaswmin]: https://github.com/nicholaswmin
