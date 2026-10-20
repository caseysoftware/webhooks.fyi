---
title: Standardization Efforts
description: Learn more about the standardization efforts on webhook communications and security
---

Today, service providers take different approaches when designing and delivering webhooks, leading to inconsistency and complexity in the marketplace — compare the signature schemes in our [webhook directory](/docs/webhook-directory).
These projects can help standardize how webhooks — and events in general — are built, secured, described, and consumed, making it easier for both providers and consumers to integrate:

## Standard Webhooks

The Standard Webhooks specification is a set of conventions to be followed by webhook producers (senders) to provide webhook consumers (receivers) a secure, consistent, and interoperable interface for webhooks. The specification includes both requirements for any compatible implementation and recommendations that are not necessarily required for compatibility, but provide a better experience for the producers, consumers, or both.

The core of the spec is three headers and one signing scheme:

```
webhook-id: msg_2KWPBgLlAfxdpx2AI54pPJ85f4W
webhook-timestamp: 1674087231
webhook-signature: v1,K5oZfzN95Z9UVu1EsfQmfVNQhnkZ2pj9o9NDN/H/pI4=
```

- **Signed content:** `webhook-id.webhook-timestamp.body`, so the ID and timestamp are protected along with the payload — see [HMAC](/security/hmac) and [Replay Prevention](/security/replay-prevention)
- **Symmetric signatures (`v1`):** HMAC-SHA256, base64 encoded, with secrets prefixed `whsec_`
- **Asymmetric signatures (`v1a`):** Ed25519 — see [Asymmetric Key Signatures](/security/asymmetric-key-signatures)
- **Rotation:** the signature header is a space-delimited list, so a message can carry signatures from old and new keys — see [Zero Downtime Rotation](/ops-experience/key-rotation)
- **Idempotency:** `webhook-id` doubles as the idempotency key — see [Idempotency](/ops-experience/idempotency)

The spec also makes recommendations on [retries and timeouts](/ops-experience/retries), [thin payloads](/security/dataless-notifications), and [SSRF protection](/security/ssrf). Implementations include [Svix](https://docs.svix.com/receiving/verifying-payloads/how-manual), [OpenAI](https://developers.openai.com/api/docs/guides/webhooks), and [GitLab](https://docs.gitlab.com/user/project/integrations/webhooks/) signing tokens.

[Learn More >](https://www.standardwebhooks.com/)

## IETF HTTP Message Signatures (RFC 9421)

HTTP Message Signatures describes a method of creating, encoding, and verifying signatures over components of an HTTP message, such as the method, target URI, selected headers, and a digest of the body. It can be used on various applications, including most webhook implementations (over 65% of the webhook implementations rely on signatures for authentication and message integrity). The IETF HTTP Working Group published it as [RFC 9421](https://www.rfc-editor.org/rfc/rfc9421.html), a Standards Track RFC, in February 2024. Its companion, [RFC 9530 Digest Fields](https://www.rfc-editor.org/rfc/rfc9530.html), defines the `Content-Digest` header for hashing the body.

Unlike most proprietary webhook schemes, RFC 9421 supports both [HMAC](/security/hmac) and [asymmetric](/security/asymmetric-key-signatures) algorithms, and explicitly covers which headers are signed.

[Learn More >](https://www.rfc-editor.org/rfc/rfc9421.html)

## OpenID Shared Signals Framework (SSF)

The Shared Signals Framework is an OpenID Foundation standard for security products to send events to each other — for example, telling a SaaS app that a user's session was revoked or their credentials were compromised. It relies on webhook-style push delivery of signed JSON Web Tokens called Security Event Tokens ([RFC 8417](https://www.rfc-editor.org/rfc/rfc8417.html)), delivered over HTTP using [RFC 8935](https://www.rfc-editor.org/rfc/rfc8935.html). The OpenID Foundation approved the [Shared Signals Framework 1.0](https://openid.net/specs/openid-sharedsignals-framework-1_0-final.html), [CAEP 1.0](https://openid.net/specs/openid-caep-1_0-final.html), and [RISC 1.0](https://openid.net/specs/openid-risc-1_0-final.html) as Final Specifications in 2025.

SSF is the most complete example of a standardized approach to [JWTs and JWKs](/security/jwt-jwk-oauth2) for event delivery.

[Learn More >](https://openid.net/wg/sharedsignals/)

## CloudEvents

CloudEvents is a specification for describing event data in a common way. The specification includes [webhooks](https://github.com/cloudevents/spec/blob/main/cloudevents/http-webhook.md) and seeks to simplify event declaration and delivery across systems. CloudEvents [graduated](https://www.cncf.io/projects/cloudevents/) within the Cloud Native Computing Foundation (CNCF) in January 2024. Its HTTP webhook spec also defines an abuse-protection handshake, similar to the [one time verification challenges](/security/one-time-verification-challenge) many providers use.

[Learn More >](https://cloudevents.io/)

## OpenAPI and AsyncAPI

Describing webhooks is a separate problem from delivering them. [OpenAPI 3.1](https://spec.openapis.org/oas/v3.1.0.html) added a top-level `webhooks` field for "requests initiated other than by an API call," so providers can document every event payload alongside their API — and consumers can generate types and validators from it. [AsyncAPI](https://www.asyncapi.com/) takes an event-first approach to describing message-driven APIs. Either makes it easier to deliver the [documentation](/ops-experience/documentation) consumers need.

## REST Hooks

REST Hooks are an initiative ran by Zapier ran from 2013 to 2017. Their goal was to create a collection of patterns for treating webhooks like subscriptions with a [minimum implementation walkthrough](http://resthooks.org/docs/). 

[Learn More >](https://github.com/zapier/resthooks)
