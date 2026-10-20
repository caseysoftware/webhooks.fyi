---
title: Stripe Webhook Specs, Events, and Examples
pageTitle: Stripe Webhooks Specs | Examples| How to integrate
description: Webhook specificactions for Stripe including Supported Events, Example Apps, Security Specs, and Documentations.
--- 

Stripe uses webhooks to notify third-party apps of events such as payments processed, refund requested, product (skus) created, and charges expired. Stripe events can be used to trigger action in other systems such as changing user access in your systems after a payment is processed.

Stripe offers two payload formats: *snapshot* events that include the full API object, and *thin* events that include only the related object's ID, so your code fetches the latest state from the API. Thin events are an example of [dataless notifications](/security/dataless-notifications).

{% table %}
---
* ## Specifications
* - **[HMAC Authentication](/security/hmac)**
  - **[Replay Prevention](/security/replay-prevention)**: ✅
  - **[Forward Compatibility](/ops-experience/versioning)**: ✅
  - **[Zero Downtime Rotation](/ops-experience/key-rotation)**: ✅ (old secret can remain active for up to 24 hours)
  - **[Unique Event ID](/ops-experience/idempotency)**: ✅ `id` in the payload
  - **[Automatic Retries](/ops-experience/retries)**: ✅ up to 3 days in live mode
  - **[Ordering](/ops-experience/ordering)**: not guaranteed
---
* ## Supported Events
* - **[Snapshot Events ↗](https://docs.stripe.com/api/events/types)**
  - **[Thin Events ↗](https://docs.stripe.com/api/v2/core/events/event-types)**
---
* ## Security Headers
* - **Signature Header**: `Stripe-Signature`
  - **Hash**: sha256
  - **Encode**: hex
  - **Signature Header Format**: `t=timestamp,v1=signature[,v1=signature...]`
    > Note: Only `v1` is a valid live scheme. Stripe adds a fake `v0` signature to test events; ignore it to prevent downgrade attacks. During secret rotation, the header contains one `v1` signature per active secret.
  - **payload**: `timestamp.request_body` (raw bytes)
  - **Timestamp Format**: Unix Date
  - **Timestamp Tolerance**: 5 minutes (SDK default)
---
* ## Documentation
* - [Official Doc ↗](https://docs.stripe.com/webhooks)
  - [Event Delivery Behaviors ↗](https://docs.stripe.com/webhooks#event-delivery-behaviors)
  - [How Events Work (thin vs snapshot) ↗](https://docs.stripe.com/events/how-events-work)
  - [IP Origins for allowlist ↗](https://docs.stripe.com/ips#webhook-notifications)

---
* ## SDKs and Sample Code
* Stripe provide SDKs with an interactive webhook builder for the following programming languages:
  - [Ruby ↗](https://docs.stripe.com/webhooks/quickstart?lang=ruby)
  - [NodeJS ↗](https://docs.stripe.com/webhooks/quickstart?lang=node)
  - [PHP ↗](https://docs.stripe.com/webhooks/quickstart?lang=php)
  - [Python ↗](https://docs.stripe.com/webhooks/quickstart?lang=python)
  - [Go ↗](https://docs.stripe.com/webhooks/quickstart?lang=go)
  - [.NET ↗](https://docs.stripe.com/webhooks/quickstart?lang=dotnet)
  - [Java ↗](https://docs.stripe.com/webhooks/quickstart?lang=java)
  - [Stripe CLI ↗](https://docs.stripe.com/cli/listen) forwards events to localhost — see [Testing and Local Development](/ops-experience/testing)
{% /table %}

---

## Sample Validation

Stripe recommends its SDKs for verification. If you verify manually:

```js
const crypto = require('crypto')
const express = require('express')
const app = express()

const sigHeader = 'Stripe-Signature'
const hashAlgo = 'sha256'
const encode = 'hex'
const hmacSecret = process.env.WEBHOOK_SECRET

// Use the raw body: re-serialized JSON will not match the signature
app.post('/stripe-webhook', express.raw({ type: 'application/json' }), (req, res) => {
    //01: Get timestamp and every v1 signature (there may be several during rotation)
    const elements = (req.get(sigHeader) || '').split(',').map(e => e.split('='))
    const timestamp = (elements.find(([k]) => k === 't') || [])[1]
    const signatures = elements.filter(([k]) => k === 'v1').map(([, v]) => v)

    //02: Validate replay prevention with 5 minute timeframe
    if (!timestamp || Math.abs(Date.now() - timestamp * 1000) > 5 * 60 * 1000) {
        return res.status(403).send('Request expired')
    }

    //03: Validate signature against each v1 value
    const message = `${timestamp}.${req.body.toString('utf8')}`
    const digest = Buffer.from(crypto.createHmac(hashAlgo, hmacSecret).update(message).digest(encode), 'utf8')
    const valid = signatures.some(sig => {
        const providerSig = Buffer.from(sig, 'utf8')
        return providerSig.length === digest.length && crypto.timingSafeEqual(digest, providerSig)
    })
    if (!valid) {
        return res.status(401).send('Request unauthorized')
    }
    //04: Process message (dedupe on event id)
    res.json({ message: "Success" })
})
```
