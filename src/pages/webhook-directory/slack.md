---
title: Slack Webhook Specs, Events, and Examples
pageTitle: Slack Webhooks Specs | Examples | How to integrate
description: Outgoing webhook specificactions for Slack including Supported Events, Example Apps, Security Specs, and Documentations.
--- 

Slack uses outgoing webhooks to notify third-party apps of events such as messages sent, conversations started, files uploaded, and channels archived. 

{% table %}
---
* ## Specifications
* - **[HMAC Authentication](/security/hmac)**
  - **[Replay Prevention](/security/replay-prevention)**: ✅
  - **[Forward Compatibility](/ops-experience/versioning)**: ✅
  - **[Zero Downtime Rotation](/ops-experience/key-rotation)**: ❌
  - **[One Time Verification Challenge](/security/one-time-verification-challenge)**: ✅ (`url_verification` event when the Request URL is saved)
---
* ## Supported Events
* - **[Official Doc ↗](https://docs.slack.dev/reference/events)**
---
* ## Security Headers
* - **Signature Header**: `X-Slack-Signature`
  - **Signature Format**: `v0=<signature>`
  - **Hash**: sha256
  - **Encode**: hex
  - **payload**: `v0:timestamp:request_body` (raw bytes)
  - **Timestamp Header**: `X-Slack-Request-Timestamp`
  - **Timestamp Format**: Unix Date
  - **Timestamp Tolerance**: 5 minutes
---
* ## Documentation
* - [Official Doc ↗](https://docs.slack.dev/authentication/verifying-requests-from-slack)
  - [URL Verification Handshake ↗](https://docs.slack.dev/apis/events-api/using-http-request-urls)
---
* ## SDKs and Sample Code
* - [Slack Bolt SDK - JavaScript ↗](https://github.com/slackapi/bolt-js/blob/main/src/receivers/verify-request.ts)
  - [Slack Bolt SDK - Python ↗](https://github.com/slackapi/bolt-python/blob/main/slack_bolt/middleware/request_verification/async_request_verification.py)
  - [Slack Bolt SDK - Java ↗](https://github.com/slackapi/java-slack-sdk/blob/main/bolt/src/main/java/com/slack/api/bolt/middleware/builtin/RequestVerification.java)
{% /table %}

---

## Sample Validation

Slack signs the raw request body, which is JSON for Events API callbacks but form-encoded for slash commands and interactivity. Verify before parsing either format.

```js
const crypto = require('crypto')
const express = require('express')
const app = express()

const timeHeader = 'X-Slack-Request-Timestamp'
const sigHeader = 'X-Slack-Signature'
const hashAlgo = 'sha256'
const encode = 'hex'
const hmacSecret = process.env.WEBHOOK_SECRET

// Capture the raw body for any content type
app.post('/slack-webhook', express.raw({ type: '*/*' }), (req, res) => {
    //01: Validate replay prevention with 5 minute timeframe (past or future)
    const timestamp = req.get(timeHeader)
    if (!timestamp || Math.abs(Date.now() - timestamp * 1000) > 5 * 60 * 1000) {
        return res.status(403).send('Request expired')
    }
    //02: Validate signature
    const message = `v0:${timestamp}:${req.body.toString('utf8')}`
    const digest = Buffer.from("v0=" +
                   crypto.createHmac(hashAlgo, hmacSecret)
                   .update(message)
                   .digest(encode), 'utf8')
    const providerSig = Buffer.from(req.get(sigHeader) || '', 'utf8')
    if (providerSig.length !== digest.length || !crypto.timingSafeEqual(digest, providerSig)) {
        return res.status(401).send('Request unauthorized')
    }
    //03: Process message
    res.json({ message: "Success" })
})
```
