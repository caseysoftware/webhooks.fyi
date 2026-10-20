---
title: OAuth2, JWTs, and JWKs
description: Learn how webhook providers use OAuth, JSON Web Tokens (JWTs), and JSON Web Keys (JWKs) in creative ways to protect their webhooks
---

{% table %}
---
* **Complexity**
* - Very High
---
* **Pros**
* Enables additional security features such as:
  - Message payload formatting with JSON Web Tokens (JWTs)
  - APIs for public key release and rotation with JSON Web Keys (JWKs)
  - Ability to use third-party OAuth Authorization servers for webhook authentication
---
* **Caveats**
* - High complexity
  - Outside of the [OpenID Shared Signals Framework](/learn-more/standards#open-id-shared-signals-framework-ssf), each provider uses JWTs, JWKs, and OAuth in its own way
---
* **Examples**
* - [Akamai/Janrain](https://janrain-education-center.knowledgeowl.com/home/json-web-keys)
  - [Brex](https://developer.brex.com/openapi/webhooks_api/#operation/listSecrets)
  - [Microsoft Graph](https://learn.microsoft.com/en-us/graph/change-notifications-with-resource-data)
  - [Plaid](https://plaid.com/docs/api/webhooks/webhook-verification/)
  - [SendGrid](https://www.twilio.com/docs/sendgrid/for-developers/tracking-events/getting-started-event-webhook-security-features)
  - [Wix](https://devforum.wix.com/kb/en/article/about-webhooks)

{% /table %}
---

Webhook providers such as SendGrid, Wix, and Brex use security methods and protocols typically found in REST APIs — such as OAuth, JSON Web Tokens (JWTs), and JSON Web Keys (JWKs) — in creative ways to protect their webhooks:

* **SendGrid uses OAuth as a client.** Before sending a webhook message, SendGrid uses the OAuth 2.0 Client Credentials grant against the consumer's Authorization Server to obtain an access token, and sends it in the `Authorization` header. Webhook listeners must validate the OAuth token to ensure the request is trusted and authorized using the validation method defined by the OAuth Authorization Server. If the listener rejects the token with a `4xx`, SendGrid requests a new token and retries. SendGrid can combine this with its [ECDSA signatures](/security/asymmetric-key-signatures).
* **Brex uses OAuth to release webhook keys.** Brex uses HMAC with symmetric SHA256 keys for webhook validation. However, webhook listeners must request a REST API (GET /v1/webhooks/secrets) protected with OAuth to obtain the shared key. The call should happen regularly to prevent downtime after a key rotation.
* **Wix uses JWT in the webhook payload.** Wix implements JWT in the webhook payload. Webhook listeners validate the webhook signature following the JWT standard, using a public certificate provided by Wix in the webhook registration.
* **Janrain (an Akamai product) uses JWKs and JWTs in webhook notifications.** Janrain takes a similar approach to Wix and sends a JWT in the webhook payload for validation. However, instead of shipping public certificates in the webhook registration, they implement the JSON Web Key (JWK) standard and endpoint to obtain the public keys for webhook validation.
* **Plaid uses JWTs and JWKs in webhook notifications, but not on the message.** Plaid uses JWTs and JWKs like Janrain but stores the JWT in the `Plaid-Verification` header and uses the webhook payload to send information. The JWT is signed with `ES256`; its `kid` identifies the key to fetch from Plaid's `/webhook_verification_key/get` endpoint, and its `request_body_sha256` claim binds the token to the payload. Consumers reject tokens whose `iat` is more than 5 minutes old, which provides [replay prevention](/security/replay-prevention).
* **Microsoft Graph sends JWTs alongside encrypted payloads.** Graph change notifications that include resource data carry a `validationTokens` array of JWTs, which consumers validate against Microsoft's published OpenID configuration keys — checking expiry, audience, and the calling app's ID — before trusting the [encrypted payload](/security/asymmetric-key-signatures#encrypting-payloads-with-asymmetric-keys).

## A standard approach: Security Event Tokens

The [OpenID Shared Signals Framework](/learn-more/standards#open-id-shared-signals-framework-ssf), finalized in 2025, builds on IETF standards for exactly this pattern: events are Security Event Tokens ([RFC 8417](https://www.rfc-editor.org/rfc/rfc8417.html)) — signed JWTs — pushed to the receiver over HTTP ([RFC 8935](https://www.rfc-editor.org/rfc/rfc8935.html)), with keys published as JWKs. While SSF targets security events between identity providers and applications, it's the most complete standard for JWT-based webhooks today.
