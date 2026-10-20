---
title: Zoom Webhook Specs, Events, and Examples
pageTitle: Zoom Webhooks Specs | Examples | How to integrate
description: Webhook specificactions for Zoom including Supported Events, Example Apps, Security Specs, and Documentations.
--- 

Zoom uses webhooks to notify third-party apps of events such as Meetings, Webinars, Recordings, User Activity, Billing, and Chat Messages created.

{% table %}
---
* ## Specifications
* - **[HMAC Authentication](/security/hmac)**
  - **[Replay Prevention](/security/replay-prevention)**: ✅
  - **[Forward Compatibility](/ops-experience/versioning)**: ✅
  - **[Zero Downtime Rotation](/ops-experience/key-rotation)**: ❌
  - **[One Time Verification Challenge](/security/one-time-verification-challenge)**: ✅ (`endpoint.url_validation`, repeated every 72 hours)
  - **[Automatic Retries](/ops-experience/retries)**: ✅ up to 3 times, only for 5xx responses
---
* ## Supported Events
* - **[Official Doc ↗](https://developers.zoom.us/docs/api/webhooks/)**
---
* ## Security Headers
* - **Signature Header**: `x-zm-signature`
  - **Signature Format**: `v0=<signature>`
  - **Hash**: sha256
  - **Encode**: hex
  - **Key**: your app's Secret Token
  - **payload**: `v0:timestamp:request_body` (raw bytes)
  - **Timestamp Header**: `x-zm-request-timestamp`
  - **Timestamp Format**: Unix Date
---
* ## Documentation
* - [Official Doc ↗](https://developers.zoom.us/docs/api/webhooks/)
  - [IP Origins for allowlist ↗](https://developers.zoom.us/docs/api/webhooks/#ip-addresses)
---
* ## SDKs and Sample Code
* - [NodeJS Sample ↗](https://github.com/zoom/webhook-sample-node.js)
{% /table %}

---

## URL Validation

When you add or change an endpoint — and every 72 hours after that — Zoom sends an `endpoint.url_validation` event containing a `plainToken`. Your endpoint must respond within 3 seconds with the token and its HMAC, proving it holds the Secret Token. After six consecutive failed validations, Zoom disables the subscription. See [One Time Verification](/security/one-time-verification-challenge).

## Sample Validation

```js
const crypto = require('crypto')
const express = require('express')
const app = express()

const timeHeader = 'x-zm-request-timestamp'
const sigHeader = 'x-zm-signature'
const hashAlgo = 'sha256'
const encode = 'hex'
const hmacSecret = process.env.ZOOM_WEBHOOK_SECRET_TOKEN

// Use the raw body: re-serialized JSON will not match the signature
app.post('/zoom-webhook', express.raw({ type: 'application/json' }), (req, res) => {
    //01: Validate replay prevention with 5 minute timeframe
    const timestamp = req.get(timeHeader)
    if (!timestamp || Math.abs(Date.now() - timestamp * 1000) > 5 * 60 * 1000) {
        return res.status(403).send('Request expired')
    }
    //02: Validate signature
    const message = `v0:${timestamp}:${req.body.toString('utf8')}`
    const digest = Buffer.from('v0=' +
                   crypto.createHmac(hashAlgo, hmacSecret).update(message).digest(encode), 'utf8')
    const providerSig = Buffer.from(req.get(sigHeader) || '', 'utf8')
    if (providerSig.length !== digest.length || !crypto.timingSafeEqual(digest, providerSig)) {
        return res.status(401).send('Request unauthorized')
    }
    const event = JSON.parse(req.body)

    //03: Answer the URL validation challenge
    if (event.event === 'endpoint.url_validation') {
        const plainToken = event.payload.plainToken
        const encryptedToken = crypto.createHmac(hashAlgo, hmacSecret).update(plainToken).digest(encode)
        return res.json({ plainToken, encryptedToken })
    }
    //04: Process message
    res.json({ message: "Success" })
})
```
