---
title: Replay prevention
description: Learn how webhook providers leverage signed timestamps to mitigate replay attacks
--- 

{% table %}
---
* **Complexity**
* - Medium
---
* **Pros**
* - Mitigates replay attacks by adding a signed timestamp to the webhook request
---
* **Caveats**
* - Requires webhook provider and consumers to have a clock in sync (or close to)
  - Requires alignment in time format — i.e. UNIX timestamp or RFC 3339 and time zones for the proper validation
  - Timestamps can be sent in the same header as hash signatures or in a dedicated timestamp header
---
* **Examples**
* - [8x8](https://developer.8x8.com/contactcenter/docs/verify-webhook-callbacks)
  - [Calendly](https://developer.calendly.com/api-docs/ZG9jOjM2MzE2MDM4-webhook-signatures)
  - [Slack](/webhook-directory/slack)
  - [Stripe](/webhook-directory/stripe)
  - [Zoom](/webhook-directory/zoom)
  - [PayPal](https://developer.paypal.com/api/rest/webhooks/rest/)
  - [Zendesk](https://developer.zendesk.com/documentation/event-connectors/webhooks/verifying/)
  - [Keygen](https://keygen.sh/docs/api/signatures/#webhook-signatures)
  - [Standard Webhooks](/learn-more/standards#standard-webhooks)
{% /table %}
---

Many webhook vendors use hashing and encryption to add security beyond authentication and message integrity. By combining message integrity with timestamps, providers offer a way to validate when calls are made and mitigate replay attacks. In our research, we saw the use of timestamps in conjunction with [HMAC](/security/hmac) — i.e. [Calendly](https://developer.calendly.com/api-docs/ZG9jOjM2MzE2MDM4-webhook-signatures), [Stripe](/webhook-directory/stripe), and [Slack](/webhook-directory/slack), [asymmetric signatures](/security/asymmetric-key-signatures) — [PayPal](https://developer.paypal.com/api/rest/webhooks/rest/), and [JWT/JWK/OAuth](/security/jwt-jwk-oauth2) — [8x8](https://developer.8x8.com/contactcenter/docs/verify-webhook-callbacks) and [Plaid](https://plaid.com/docs/api/webhooks/webhook-verification/). Timestamp generation and validation takes the following steps:

On webhook requests, the provider:

1. Concatenates the timestamp of the request creation with the webhook payload
1. Signs the concatenated value
1. Sends both the encoded signature and the timestamp to the webhook request

The webhook listener receives the request and:

1. Extracts the timestamp — i.e., from the request header — and validates if the timestamp is within an acceptable timeframe (i.e., 3-5 minutes) of the current time, in either direction.

    ```js
      ...
      const timestampHeader = 'Request-Timestamp'
      app.post('/webhook', (req, res) => {
        // Request timestamp in unix date * 1000 (milliseconds)
        const requestTimestamp = req.get(timestampHeader) * 1000;
        // Tolerance zone: 5 minutes before or after now
        const tolerance = 5 * 60 * 1000;
        if (!requestTimestamp || Math.abs(Date.now() - requestTimestamp) > tolerance) {
          // The request timestamp is outside of the tolerance zone.
          res.status(403).send('Request expired')
        }else{
          // The request timestamp is in the tolerance zone.
          ...
    ```

1. If the timestamp is valid, repeat the same steps from the webhook provider to sign the request and compare the results with the signature sent:

    ```js
    ...
    const signatureHeader = 'Signature-Header'
    const signatureAlgorithm = 'sha256'
    const encodeFormat = 'hex'
    const hmacSecret = process.env.WEBHOOK_SECRET
    const timestampHeader = 'Request-Timestamp'
    app.post('/webhook', (req, res) => {
      ...
      if (!requestTimestamp || Math.abs(Date.now() - requestTimestamp) > tolerance) {
        // The request timestamp is outside of the tolerance zone.
        ...
      }else{
        // The request timestamp is in the tolerance zone.
        // Create digest with payload+timestamp+hmac secret
        const hashPayload = req.rawBody+'.'+req.get(timestampHeader)
        const hmac = crypto.createHmac(signatureAlgorithm, hmacSecret)
        const digest = Buffer.from(signatureAlgorithm + '=' + hmac.update(hashPayload).digest(encodeFormat), 'utf8')
        // Get hash sent by the provider
        const providerSig = Buffer.from(req.get(signatureHeader) || '', 'utf8')
        // Compare digest signature with signature sent by provider
        if (providerSig.length !== digest.length || !crypto.timingSafeEqual(digest, providerSig)) {
          res.status(401).send('Request unauthorized')
        }else{
          // Webhook Authenticated 
          // process and respond
          res.json({ message: "Success" })
        }
      }
    })
    ```

1. If the result matches, the request is considered legit. If not, the request is considered unauthenticated, or its content and timestamp are modified.

## Important Notes

- to avoid requests with tampered timestamps, webhook providers must include the timestamp in the signature digest:

  ```js
  const hashPayload = req.rawBody+'.'+req.get(timestampHeader)
  ```

- To ensure the timestamp validation works, you must keep your listener clock in sync with the webhook provider. The use of an NTP server should address this concern.

- Tolerance windows vary by provider. [Slack](/webhook-directory/slack) recommends 5 minutes, and Stripe's SDKs default to 5 minutes. [Linear](https://linear.app/developers/webhooks) recommends one minute, and [Paddle](https://developer.paddle.com/webhooks/signature-verification)'s SDKs default to five seconds. Stripe warns that a tolerance of `0` disables the check entirely.

- A timestamp tells you when the request was *signed*, not when the event happened. Stripe [generates a new timestamp and signature for each retry](https://docs.stripe.com/webhooks#preventing-replay-attacks), so a retried event still passes a 5-minute window. See [Retries and Timeouts](/ops-experience/retries).

- Some webhook providers — like [8x8](https://developer.8x8.com/contactcenter/docs/verify-webhook-callbacks), [PayPal](https://developer.paypal.com/api/rest/webhooks/rest/), [GitHub](/webhook-directory/github) (`X-GitHub-Delivery`), and [Standard Webhooks](/learn-more/standards#standard-webhooks) implementations (`webhook-id`) — also send unique ids per webhook notification. Rejecting IDs you've already processed blocks replays even inside the tolerance window, and Mailgun suggests [caching each webhook's `token`](https://documentation.mailgun.com/docs/mailgun/user-manual/events/webhooks) for the same reason. This requires consumers to store and keep track of webhook ids previously processed — see [Idempotency and Duplicate Events](/ops-experience/idempotency).