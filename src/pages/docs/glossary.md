---
title: Glossary
description: Definitions for common webhook terms — providers, consumers, signatures, replay attacks, idempotency, retries, and more — with links to detailed pages and real examples.
---

Webhook docs use different words for the same ideas. These are the terms we use across webhooks.fyi, with links to where each is covered in depth.

## The basics

### Webhook

An HTTP request — usually a `POST` with a JSON or form-encoded body — that one system sends to another to report that something happened. See [What are webhooks?](/docs/webhook-primer)

### Provider

The system that sends webhooks, such as [Stripe](/webhook-directory/stripe) or [GitHub](/webhook-directory/github). Also called the *producer* or *sender*. See [Best Practices for Webhook Providers](/best-practices/webhook-providers).

### Consumer

The system that receives webhooks. Also called the *listener* or *receiver*. See [Best Practices for Webhook Consumers](/best-practices/webhook-consumers).

### Endpoint

The URL a consumer registers to receive webhooks, and the code behind it. Also called the *webhook URL*, *callback URL*, *notification URL*, or *request URL*. Many providers support several endpoints per account — see [Multiple URLs](/ops-experience/multiple-urls).

### Event

Something that happened in the provider's system, identified by an *event type* such as `payment_intent.succeeded` (Stripe) or `pull_request` (GitHub). Consumers usually subscribe to the event types they care about.

### Payload

The body of the webhook request. A *fat* or *snapshot* payload contains the full object that changed; a *thin* payload contains only identifiers, and the consumer fetches the details from the provider's API. See [Dataless Notifications](/security/dataless-notifications).

### Subscription

The registration that connects an endpoint to a set of events. Some providers, such as Microsoft Graph, require subscriptions to be [renewed before they expire](https://learn.microsoft.com/en-us/graph/change-notifications-delivery-webhooks).

## Security

### Signature

A value sent with each webhook — usually in a header — that lets the consumer verify who sent it and that the payload wasn't modified. See [HMAC](/security/hmac) and [Asymmetric Key Signatures](/security/asymmetric-key-signatures).

### Signing secret

The key a provider uses to sign webhooks with [HMAC](/security/hmac), shared with the consumer when the endpoint is created. Stripe and [Standard Webhooks](/learn-more/standards#standard-webhooks) prefix theirs with `whsec_`.

### HMAC

Hash-based Message Authentication Code. The most common webhook signature method: both sides compute a hash of the payload using the shared signing secret and compare. See [HMAC](/security/hmac).

### Shared secret

A password, token, or Basic Auth credential sent with every webhook. Simple, but it authenticates the sender without protecting the payload. See [Shared Secret](/security/shared-secret).

### Asymmetric signature

A signature created with the provider's private key and verified with its public key, using algorithms such as Ed25519, ECDSA, or RSA. Unlike HMAC, consumers can't create valid signatures themselves. See [Asymmetric Key Signatures](/security/asymmetric-key-signatures).

### Non-repudiation

The guarantee that only the provider could have produced a message. Asymmetric signatures and [mTLS](/security/end-to-end-encryption) provide it; HMAC does not, because the consumer holds the same secret.

### JWT and JWK

JSON Web Tokens carry signed claims; JSON Web Keys publish the public keys used to verify them. [Plaid](https://plaid.com/docs/api/webhooks/webhook-verification/) uses both. See [OAuth2, JWTs, and JWKs](/security/jwt-jwk-oauth2).

### mTLS

Mutual TLS: both provider and consumer present certificates during the TLS handshake. See [Mutual TLS Authentication](/security/end-to-end-encryption).

### Verification challenge

A request sent when an endpoint is registered, which the consumer must answer to prove it controls the URL. Also called a *handshake*, *URL validation*, or *challenge-response check (CRC)*. See [One Time Verification](/security/one-time-verification-challenge).

### Replay attack

Re-sending a captured, validly signed webhook to trigger the same action again. Prevented with signed timestamps and, ideally, by remembering event IDs. See [Replay Prevention](/security/replay-prevention).

### Timestamp tolerance

How old a webhook's signed timestamp may be before the consumer rejects it — commonly five minutes. See [Replay Prevention](/security/replay-prevention).

### Constant-time comparison

Comparing two signatures in a way that takes the same time whether they differ in the first character or the last, so attackers can't learn the expected signature from response timing. In Node.js, `crypto.timingSafeEqual`. See [HMAC](/security/hmac).

### Raw body

The exact bytes of the request body as received. Signatures are computed over these bytes, so parsing and re-serializing JSON before verifying will break them. See [HMAC](/security/hmac).

### SSRF

Server-Side Request Forgery: using a provider's webhook system to send requests into the provider's own network. See [SSRF and Egress Security](/security/ssrf).

### Egress proxy

A proxy that all outgoing webhook traffic must pass through, which blocks requests to internal and reserved addresses. See [SSRF and Egress Security](/security/ssrf).

## Operations

### At-least-once delivery

A delivery guarantee where every event arrives one or more times. Most providers work this way, so consumers must handle duplicates. See [Idempotency](/ops-experience/idempotency).

### Idempotency

The property that processing an event more than once has the same effect as processing it once. An *idempotency key* — such as `X-GitHub-Delivery` or `webhook-id` — identifies repeats. See [Idempotency and Duplicate Events](/ops-experience/idempotency).

### Retry

A provider's repeated attempt to deliver an event after a failure, usually with *exponential backoff* — waiting longer between each attempt. See [Retries and Timeouts](/ops-experience/retries).

### Event ordering

Whether events arrive in the order they happened. Most providers don't guarantee it. See [Event Ordering](/ops-experience/ordering).

### Heartbeat

A periodic request from the provider to check that an endpoint is healthy. See [Resiliency](/ops-experience/resiliency).

### Circuit breaker

Logic that pauses or slows delivery to an endpoint that keeps failing. See [Resiliency](/ops-experience/resiliency).

### Key rotation

Replacing a signing secret or key without dropping webhooks, usually by signing with the old and new keys during a transition. See [Zero Downtime Rotation](/ops-experience/key-rotation).

### Versioning

Labeling the signature scheme or payload format so providers can improve them without breaking existing consumers. See [Forward Compatibility](/ops-experience/versioning).

### Fan-out

Sending the same event to several endpoints, each with its own configuration. See [Multiple URLs](/ops-experience/multiple-urls).

### Tunnel

A tool that exposes a local development server on a public URL so providers can reach it. See [Testing and Local Development](/ops-experience/testing).

### Standard Webhooks

An open specification for webhook headers, signatures, and delivery behavior. See [Standardization Efforts](/learn-more/standards#standard-webhooks).
