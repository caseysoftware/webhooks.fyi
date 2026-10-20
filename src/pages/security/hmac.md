---
title: Hash-based Message Authentication Code (HMAC)
description: HMAC is, by far, the most popular authentication and message security method used on webhook requests, including 65% of the 100 webhooks we studied. In this method, the webhook provider and listener use a secret key to sign and validate webhook requests.
--- 

{% table %}
---
* **Complexity**
* - Low
---
* **Pros**
* - Authentication and Message Integrity with Low Complexity
  - Secret keys are not sent in the webhook notification
  - Hash signature enables timestamp validation
---
* **Caveats**
* - No confidentiality controls
  - Introduces additional complexity with complex signature payloads
---
* **Examples**
* - [GitHub](/webhook-directory/github)
  - [Shopify](https://shopify.dev/docs/apps/build/webhooks/verify-deliveries)
  - [Slack](/webhook-directory/slack)
  - [Square](https://developer.squareup.com/docs/webhooks/step3validate)
  - [Stripe](/webhook-directory/stripe)
  - [Twilio](/webhook-directory/twilio)
  - [Zoom](/webhook-directory/zoom)
  - [Standard Webhooks](/learn-more/standards#standard-webhooks)
{% /table %}
---

Hash-based Message Authentication Code (HMAC) is, by far, the most popular authentication and message security method used on webhook requests, including 65% of the webhooks we studied. In this method, the webhook provider and listener use a secret key to sign and validate webhook requests.

1. On webhook requests, the provider signs the webhook message using the secret key plus a hashing algorithm — typically `HMAC-SHA256`, encodes the resulting signature in `base64` or `hex`, and then includes the signature in the webhook request as a header.
1. The webhook listener receives the request and repeats the same steps — signs and encodes the webhook message using the secret key — and compares the resulting signature with the value sent in the request header. If the result matches, the request is considered legitimate.

    ```js
    const signatureHeader = 'Signature-Header'
    const signatureAlgorithm = 'sha256'
    const encodeFormat = 'hex'
    const hmacSecret = process.env.WEBHOOK_SECRET

    app.post('/webhook', (req, res) => {
      // Create digest with payload + hmac secret
      const hashPayload = req.rawBody
      const hmac = crypto.createHmac(signatureAlgorithm, hmacSecret)
      const digest = Buffer.from(signatureAlgorithm + '=' + hmac.update(hashPayload).digest(encodeFormat), 'utf8')
      
      // Get hash sent by the provider
      const providerSig = Buffer.from(req.get(signatureHeader) || '', 'utf8')

      // Compare digest signature with signature sent by provider
      if (providerSig.length !== digest.length || !crypto.timingSafeEqual(digest, providerSig)) {
        res.status(401).send('Unauthorized')
      }else{
        // Webhook Authenticated 
        // process and respond...
        res.json({ message: "Success" })
      }
    })
    ```

{% diagram-hmac / %} 

_Request Signature Validation_

## HMAC vs. Shared Secrets

HMAC offers the following advantages over [Basic Authentication and other shared secrets](/security/shared-secret):

1. **Authentication + message integrity**: Assuming the secret key is known only by the webhook provider and the listener, the HMAC process verifies that the message comes from the webhook provider (authenticity) and its contents are the same as they were at the time of sending (integrity).
1. **The secret key remains secret:** In HMAC, secret keys are not sent with the webhook request — only the signatures created with it — reducing the risk of stolen keys.

## Common verification mistakes

Most failed HMAC verifications — and most insecure ones — come from a few mistakes on the consumer side:

1. **Verifying a re-serialized body.** The signature covers the exact bytes the provider sent. Frameworks that parse JSON before your handler runs, followed by `JSON.stringify`, change whitespace and key order. Capture the raw body (for example, `express.raw()`) and verify before parsing. Stripe, Slack, GitHub, Shopify, and Linear all call this out in their docs.
1. **Comparing with `==`.** A regular string comparison returns as soon as a character differs, which can leak the expected signature through response timing. Use a constant-time function such as `crypto.timingSafeEqual` in Node.js or `hmac.compare_digest` in Python. GitHub's docs say to ["never use a plain `==` operator"](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries).
1. **Using the wrong encoding.** Providers split between `hex` and `base64`, and some add a prefix like `sha256=` or `v1,`. The [webhook directory](/docs/webhook-directory) lists the encoding for each provider.
1. **Signing the wrong content.** Not every provider signs only the body:

    {% table %}
    * Provider
    * Signed content
    ---
    * [GitHub](/webhook-directory/github)
    * `request_body`
    ---
    * [Stripe](/webhook-directory/stripe)
    * `timestamp.request_body`
    ---
    * [Slack](/webhook-directory/slack) and [Zoom](/webhook-directory/zoom)
    * `v0:timestamp:request_body`
    ---
    * [Standard Webhooks](/learn-more/standards#standard-webhooks)
    * `webhook_id.timestamp.request_body`
    ---
    * Square
    * `notification_url` + `request_body`
    ---
    * [Twilio](/webhook-directory/twilio)
    * `full_url` + sorted `POST` parameters
    {% /table %}

    When the URL is part of the signature, a proxy or load balancer that changes the scheme, host, or port will break verification.

1. **Ignoring the timestamp.** If the provider signs a timestamp, check it — otherwise a captured request can be [replayed](/security/replay-prevention) indefinitely.

## HMAC is only as good as its implementation

[comment]: <TODO: @sudobinbash: Launch blog>
[comment]: <Like any other security control, HMAC is only as good as its implementation. In our research, we saw many examples of webhook providers with unnecessary complexity, lack of features, and documentation that made their solutions tough to implement and keep safe — more on that in our [article](https://blog.ngrok.com/posts/get-webhooks-secure-it-depends-a-field-guide-to-we). Good webhook implementations will typically:>

Like any other security control, HMAC is only as good as its implementation. In our research, we saw many examples of webhook providers with unnecessary complexity, lack of features, and complex documentation that made their solutions tough to implement and keep safe. Good webhook implementations will typically:

1. Use strong hash algorithms such as `sha256` and `sha512` — providers still using `sha1`, such as [Twilio](/webhook-directory/twilio), are noted in the [directory](/docs/webhook-directory)
1. Add sensitive headers to the hash digest:
    ```js
    ...
    const clientIdHeader = 'clientid'
    ...
    app.post('/webhook', (req, res) => {
      // Create digest from the request payload and the clientid header
      const hashPayload = req.rawBody+'.'+req.get(clientIdHeader)
      const hmac = crypto.createHmac(signatureAlgorithm, hmacSecret)
      const digest = Buffer.from(signatureAlgorithm + '=' + hmac.update(hashPayload).digest(encodeFormat), 'utf8')
      ...
    })
    ```
1. Leverage HMAC signatures to implement [replay prevention](/security/replay-prevention), [versioning](/ops-experience/versioning), [key rotation](/ops-experience/key-rotation), and [unique event IDs](/ops-experience/idempotency)
1. Follow an existing convention such as [Standard Webhooks](/learn-more/standards#standard-webhooks) rather than inventing a new signature format
1. Provide great [documentation](/ops-experience/documentation) and features for better [operations](/ops-experience/intro)