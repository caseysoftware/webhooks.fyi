---
title: Mutual TLS Authentication (mTLS)
description: The use of mTLS authentication ensures both webhook service and listener are authenticated — through a TLS handshake — before a webhook message is sent 
--- 

{% table %}
---
* **Complexity**
* - Very High
---
* **Pros**
* - Message Confidentiality
  - Non-Repudiation (ensures webhook calls can be sent only by the webhook provider)
  - Both webhook providers and consumers can revocate trust independently
---
* **Caveats**
* - High complexity (compared against HMAC)
  - Operational complexity on key issuance, rotation, and revocation

---
* **Examples**
* - [Adobe Sign](https://helpx.adobe.com/sign/using/adobe-sign-webhooks-api.html#SSL)
  - [DocuSign](https://developers.docusign.com/platform/webhooks/mutual-tls)
  - [PagerDuty](https://developer.pagerduty.com/docs/1fb4905778afc-mutual-tls)
{% /table %}
---

The use of Mutual TLS (mTLS) authentication ensures that traffic is secure and trusted in both directions between webhook services and listeners. With mTLS, both webhook service and listener pass through a TLS handshake — in which both systems present trusted certificates — before the webhook notification is sent. 

This method delivers a stronger authentication between the webhook service and listener and ensures communication confidentiality — a webhook message is sent only after both sides are authenticated. When combined with webhook signatures, it also delivers message integrity.

{% diagram-mtls / %} 

_Mutual TLS with request signature validation_

## Security at the transport layer

Mutual TLS (mTLS) applies two-way authentication at the transport layer. Like two-way SSL, mTLS works the same way with in most TCP communications, regardless of application-level protocol:
- Webhooks leverage mTLS for two-way encryption similarly to protocols like HTTPS, SQL, and SSH.
- mTLS can be combined with other webhooks security controls, such as [HMAC](/security/hmac). [DocuSign](https://developers.docusign.com/platform/webhooks/mutual-tls), for example, supports both.

## Where mTLS ends

mTLS authenticates a *connection*, not a *message*. Once the TLS session is terminated — commonly at a load balancer, API gateway, or CDN in front of the listener — the application only sees a plain HTTP request, plus whatever headers the proxy chooses to forward about the client certificate. That has two consequences:

- The application must trust the proxy to have validated the provider's certificate, and should reject requests that didn't arrive through it.
- Nothing proves the payload wasn't changed between the proxy and the application, or after it was written to a queue. A signature — [HMAC](/security/hmac) or [asymmetric](/security/asymmetric-key-signatures) — travels with the message, so it can be verified anywhere, at any time.

For most consumers, mTLS is defense in depth on top of signatures rather than a replacement for them.

## Drawbacks

However, mTLS is often difficult to configure (when compared against HMAC). It also requires updates whenever TLS certificates are issued, renewed, or revoked both on the webhook service and the listener side. This additional burden is considered overkill for most webhook use-cases.