---
title: Asymmetric Key Signature (EdDSA, ECDSA and RSA)
description: With Asymmetric Key Signatures, webhook providers use a private key to sign requests and listeners use a public key to validate webhook calls
--- 

{% table %}
---
* **Complexity**
* - High
---
* **Pros**
* - Extends HMAC with Non-Repudiation (ensures webhook calls can be sent only by the webhook provider)
---
* **Caveats**
* - Additional deployment complexity (compared to HMAC)
  - Additional operational complexity to issue, renew, and rotate keys
  - Additional performance concerns with signing and validating signatures (compared to HMAC)
---
* **Examples**
* - [Discord](https://docs.discord.com/developers/interactions/overview) (Ed25519)
  - [Keygen](https://keygen.sh/docs/api/signatures/#webhook-signatures) (Ed25519)
  - [PayPal](https://developer.paypal.com/api/rest/webhooks/rest/) (RSA)
  - [SendGrid](https://www.twilio.com/docs/sendgrid/for-developers/tracking-events/getting-started-event-webhook-security-features) (ECDSA)
  - [Standard Webhooks](/learn-more/standards#standard-webhooks) (Ed25519, `v1a`)
{% /table %}
---

In our research, we found a few providers — such as PayPal, SendGrid, and Discord — using asymmetric keys for signing webhook messages. In this method, the webhook provider uses a private key to sign requests while the listener uses a public key to validate webhook calls. At a conceptual level, the process works as follows:

1. On webhook requests, the provider signs the webhook message using its private key and adds the signature to the webhook request as a header.
2. The webhook listener receives the request and runs an EdDSA, ECDSA or RSA verifier with the public key, the request body, and the signed value from the provider. If the verifier returns positive, only the holder of the private key could have created the signature, and the request is considered legit.

Discord's interaction webhooks are a compact example: each request carries an `X-Signature-Ed25519` header and an `X-Signature-Timestamp` header, and the consumer verifies the signature over the timestamp concatenated with the raw body using the application's public key. Discord also [tests endpoints with invalid signatures](https://docs.discord.com/developers/interactions/overview) and removes any endpoint that fails validation.

## Asymmetric key signatures vs HMAC

The major difference between HMAC and asymmetric key signatures is in the verification process. In HMAC, webhook listeners generate the same signature from the provider using the same key to validate the request. With asymmetric signatures, listeners cannot generate the same signature. Instead, they use a verifier with the public key to confirm if the request is legit.

This difference in verification logic delivers non-repudiation. In HMAC, anyone with access to the shared secret — including every consumer — can generate a validly signed webhook request. However, with asymmetric keys, only the webhook provider — in possession of the private key — can sign webhook messages.

Webhook implementations with asymmetric keys can also use the same techniques as HMAC providers to add [replay prevention](/security/replay-prevention), [versioning](/ops-experience/versioning), and [key rotation](/ops-experience/key-rotation). SendGrid, for example, sends a timestamp header ( `X-Twilio-Email-Event-Webhook-Timestamp` ) and signs the timestamp together with the payload to mitigate replay attacks. [Standard Webhooks](/learn-more/standards#standard-webhooks) uses the same headers and signed content for its `v1a` Ed25519 signatures as for HMAC, so providers can offer both.

## Drawbacks

However, webhook signatures with asymmetric keys come with drawbacks. Asymmetric keys are considerably harder to implement than HMAC due to the following:

- **Many different methods for shipping and rotating public keys**: PayPal sends a URL to its signing certificate in the `PAYPAL-CERT-URL` header of each request — consumers must confirm the URL belongs to PayPal before fetching it, or an attacker can point it at their own certificate. SendGrid and Discord show the public key in their settings pages. Some other vendors ship asymmetric keys via proprietary APIs and using [JSON Web Keys / JWK](/security/jwt-jwk-oauth2) APIs. PayPal also offers a [postback API](https://developer.paypal.com/api/rest/webhooks/rest/) that verifies the signature for you — a variation of [calling back the service](/best-practices/webhook-consumers).
- **Different key formats**: Providers may ship keys in different formats, including PKCS8, PEM, or CER.
- **Library support**: Compared to HMAC, asymmetric key signatures introduce additional complexity with libraries for validation.
- **Performance concerns**: Signing and validating webhook payloads with asymmetric keys is computationally more expensive than using hashing functions (like SHA-256 in HMAC). While performance may not be an issue for most consumers, it is a crucial item for providers that need to keep performance while sending webhook notifications for multiple destinations with different keys.

## Encrypting payloads with asymmetric keys

Signatures prove who sent a webhook; they don't hide its contents. A few providers use the consumer's public key to encrypt the payload itself. Microsoft Graph [change notifications with resource data](https://learn.microsoft.com/en-us/graph/change-notifications-with-resource-data) require the consumer to upload a certificate when subscribing. Graph encrypts each payload with a single-use symmetric key, encrypts that key with the consumer's public key, and includes an HMAC-SHA256 signature of the encrypted data. Only the holder of the private key can read the notification — useful when webhooks pass through proxies, queues, or logs the consumer doesn't fully trust. The alternative is to not send sensitive data at all: see [Dataless Notifications](/security/dataless-notifications).
