---
title: GitHub Webhook Specs, Events, and Examples
pageTitle: GitHub Webhooks Specs | Examples| How to integrate
description: Webhook specificactions for GitHub including Supported Events, Example Apps, Security Specs, and Documentations.
--- 

GitHub uses webhooks to notify third-party apps of github events — such as when an issue is created, a branch is created, or when a pull request is approved. Github events can be used to trigger action in other systems such as an external issue tracker, initiate CI builds, update a backup mirror, or even deploy to your production servers.

{% table %}
---
* ## Specifications
* - **[HMAC Authentication](/security/hmac)**
  - **[Replay Prevention](/security/replay-prevention)**: ❌ (no timestamp; use `X-GitHub-Delivery` to reject repeats)
  - **[Forward Compatibility](/ops-experience/versioning)**: ❌
  - **[Zero Downtime Rotation](/ops-experience/key-rotation)**: ❌
  - **[One Time Verification Challenge](/security/one-time-verification-challenge)**: ❌ (a `ping` event is sent on creation, but no challenge response is required)
  - **[Unique Event ID](/ops-experience/idempotency)**: ✅ `X-GitHub-Delivery`, reused on redelivery
  - **[Automatic Retries](/ops-experience/retries)**: ❌ (manual or API redelivery only)
---
* ## Supported Events
* - **[Official Doc ↗](https://docs.github.com/en/webhooks/webhook-events-and-payloads)**
---
* ## Security Headers
* - **Signature Header**: `X-Hub-Signature-256`
  - **Signature Format**: `sha256=<signature>`
  - **Hash**: sha256
  - **Encode**: hex
  - **payload**: `request_body` (raw bytes)
  - **Legacy Header**: `X-Hub-Signature` (sha1, kept for backward compatibility)
---
* ## Documentation
* - [Official Doc ↗](https://docs.github.com/en/webhooks/about-webhooks)
  - [Validating Deliveries ↗](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries)
  - [Best Practices ↗](https://docs.github.com/en/webhooks/using-webhooks/best-practices-for-using-webhooks)
  - [Handling Failed Deliveries ↗](https://docs.github.com/en/webhooks/using-webhooks/handling-failed-webhook-deliveries)
  - [IP Origins for allowlist ↗](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-githubs-ip-addresses)
---
* ## SDKs and Sample Code
* - [Python ↗](https://github.com/github/platform-samples/tree/master/hooks/python)
  - [Ruby ↗](https://github.com/github/platform-samples/tree/master/hooks/ruby)
  - [Jenkins ↗](https://github.com/github/platform-samples/tree/master/hooks/jenkins)
{% /table %}
---

## Sample Validation

GitHub expects a `2xx` response within 10 seconds and does not retry failed deliveries automatically. See [Retries and Timeouts](/ops-experience/retries).

```js
const crypto = require('crypto')
const express = require('express')
const app = express()

const sigHeader = 'X-Hub-Signature-256'
const hashAlgo = 'sha256'
const encode = 'hex'
const hmacSecret = process.env.WEBHOOK_SECRET

// Use the raw body: re-serialized JSON will not match the signature
app.post('/github-webhook', express.raw({ type: 'application/json' }), (req, res) => {
  //01: Validate signature
  const digest = Buffer.from('sha256=' +
                  crypto.createHmac(hashAlgo, hmacSecret)
                  .update(req.body).digest(encode), 'utf8')
  const providerSig = Buffer.from(req.get(sigHeader) || '', 'utf8')
  if (providerSig.length !== digest.length || !crypto.timingSafeEqual(digest, providerSig)) {
      return res.status(401).send('Request unauthorized')
  }
  //02: Process message (dedupe on X-GitHub-Delivery)
  res.json({ message: "Success" })
})
```
