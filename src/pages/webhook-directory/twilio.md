---
title: Twilio Webhook Specs, Events, and Examples
pageTitle: Twilio Webhooks Specs | Examples| How to integrate
description: Webhook specificactions for Twilio including Supported Events, Example Apps, Security Specs, and Documentations.
--- 

Twilio uses webhooks to notify third-party apps of events in its main products including voice calls initiated, SMS messages sent, and dialogs started in autopilot. You can wire Twilio events to trigger action in third-party apps such as record when someone responds to an SMS message.

Unlike most providers, Twilio doesn't sign the raw request body. It signs the full URL Twilio requested plus the `POST` parameters, which means the URL your code reconstructs must match the one Twilio called exactly — including scheme, host, port, and query string.

{% table %}
---
* ## Specifications
* - **[HMAC Authentication](/security/hmac)**
  - **[Replay Prevention](/security/replay-prevention)**: ❌
  - **[Forward Compatibility](/ops-experience/versioning)**: ❌
  - **[Zero Downtime Rotation](/ops-experience/key-rotation)**: ❌ (signatures use the primary Auth Token; a secondary token must be promoted first)
---
* ## Supported Events
* - Twilio provides different events for each product — Voice, SMS, Conversations, Sync, Authy, Chat, and Autopilot. The full list of events for each product is available in its **[Official Doc ↗](https://www.twilio.com/docs/usage/webhooks#webhooks-by-product)**
---
* ## Security Headers
* - **Signature Header**: `X-Twilio-Signature`
  - **Hash**: sha1
  - **Encode**: base64
  - **Key**: your account's primary Auth Token
  - **payload**: `full_url` + each `POST` parameter name and value, sorted alphabetically by name, with no delimiters
  - **JSON bodies**: Twilio adds a `bodySHA256` query parameter (hex SHA-256 of the raw body) to the URL, and the URL alone is signed
---
* ## Documentation
* - [Official Doc ↗](https://www.twilio.com/docs/usage/security#validating-requests)
---
* ## SDKs and Sample Code
* - Every Twilio helper library includes `validateRequest` (form bodies) and `validateRequestWithBody` (JSON bodies)
  - [Voice Webhook: Example ↗](https://www.twilio.com/docs/voice/tutorials/how-to-respond-to-incoming-phone-calls/node)
  - [SMS Webhook: Example ↗](https://www.twilio.com/docs/sms/tutorials/how-to-receive-and-reply-node-js)
  - [Authy Webhook: Example ↗](https://github.com/AuthySE/webhooks-api)
{% /table %}

---

## Sample Validation

Twilio recommends its helper libraries for validation. For a form-encoded `POST`, the manual equivalent is:

```js
const crypto = require('crypto')
const express = require('express')
const app = express()

const sigHeader = 'X-Twilio-Signature'
const hashAlgo = 'sha1'
const encode = 'base64'
const authToken = process.env.TWILIO_AUTH_TOKEN
// The exact URL configured in Twilio. Behind a proxy or load balancer,
// don't rebuild it from request headers — they may not match.
const webhookUrl = 'https://example.com/twilio-webhook'

app.post('/twilio-webhook', express.urlencoded({ extended: false }), (req, res) => {
  //01: Build the signed string: URL + sorted param names and values
  const params = req.body
  const message = Object.keys(params).sort()
                  .reduce((acc, key) => acc + key + params[key], webhookUrl)

  //02: Validate signature
  const digest = Buffer.from(crypto.createHmac(hashAlgo, authToken)
                 .update(Buffer.from(message, 'utf8')).digest(encode), 'utf8')
  const providerSig = Buffer.from(req.get(sigHeader) || '', 'utf8')
  if (providerSig.length !== digest.length || !crypto.timingSafeEqual(digest, providerSig)) {
      return res.status(403).send('Request unauthorized')
  }
  //03: Process message
  res.type('text/xml').send('<Response></Response>')
})
```
