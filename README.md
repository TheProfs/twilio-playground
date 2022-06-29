# twilio-playground

[Twilio][twilio] calls playground

## Install

Clone this repo, `cd` into it and then:

```bash
$ npm install
```

### Set Twilio credentials as environmental variables

You can obtain credentials from the [Twilio dashboard][twilio-console]

```bash
$ export TWILIO_ACCOUNT_SID=<account-SID> # starts with AC
$ export TWILIO_API_KEY=<api-key-name> # starts with SK
$ export TWILIO_API_SECRET=<api-secret>
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

## Authors

- [@nicholaswmin][nicholaswmin]

[twilio]: https://twilio.com
[twilio-console]: https://console.twilio.com/
[nicholaswmin]: https://github.com/nicholaswmin
