---
title: Best Practices for Webhook Providers
description: Security Best Practices for Webhook Providers
--- 

## Provide amazing documentation

In webhook communications, the authentication, message integrity validation, and replay prevention validation, and enforcement happen on the webhook listener. Therefore, webhook providers must simplify the work on developers by providing documentation with:

* **Complete specs on your webhook security,** including the authentication mode, cipher suite, signature procedure, and best practices for security.
* **A description of the steps to validate your webhook messages**.
* **A sample code** (not a pseudo-code) developers can run to understand how webhook notifications should be processed
* **Instructions on how developers can test your webhooks** against their code running on localhost
* **Provide a mechanism to trigger, test, and replay webhooks calls** with a close feedback loop — see [Testing and Local Development](/ops-experience/testing)
* **Your delivery behavior:** timeouts, retry schedule, ordering, and duplicate handling — see [Documentation](/ops-experience/documentation)

## Implement security on egress communication

Webhook integrations seem simple to secure at the surface. However, webhook URLs can be explored by malicious actors — acting as legitimate webhook consumers — to carry out Distributed Denial of Service (DDoS), Server-Side Request Forgery (SSRF), and other attacks to the provider infrastructure: slow responses, private and reserved IPs, domains that resolve to private IPs, and redirects to internal addresses.

Webhook providers must implement security controls to mitigate these issues. This can be done at the code level or by using egress proxies for webhook traffic such as [webhook-sentry](https://github.com/juggernaut/webhook-sentry) and [smokescreen](https://github.com/stripe/smokescreen). See [SSRF and Egress Security](/security/ssrf) for the full list of attack vectors and mitigations.

## Secret keys

* Consider using [asymmetric keys](/security/asymmetric-key-signatures) for non-repudiation
* Consider individualizing secret keys per listener ([Multiple URLs](/ops-experience/multiple-urls))
* Implement a [key rotation with zero downtime](/ops-experience/key-rotation) (i.e., signing webhook messages with multiple keys) so webhook listeners can rotate keys regularly. You can also automate the key rotation by implementing APIs that listeners can call to fetch new keys autonomously.

## Encryption and hashing algorithm

* Do not use old ciphers or hashing algorithms such as SHA-1 and MD5.
* For [HMAC](/security/hmac), use at least SHA-256

## Signature Payload

* Concatenate body, timestamp, and sensitive headers to form the payload. 
* Don't add unnecessary steps to the signature, such as changing the payload capitalization and adding line breaks.
* Sign the raw body bytes you send, and tell consumers to verify against the raw body.
* Rather than inventing a new format, consider [Standard Webhooks](/learn-more/standards#standard-webhooks), which signs `webhook-id.webhook-timestamp.body` and has verification libraries in many languages.

## Replay Prevention

* [Timestamps](/security/replay-prevention) provides a simple way to validate if requests have been sent recently and reduce the risk of message replays. 
* When adopting timestamps, consider using Unix timestamp as format (7 of 10 webhook providers), and provide a recommendation of how long messages should be considered valid in your documentation. 
* Also, ensure to include the timestamp on the message integrity verification to reduce the risk of tampering.

## Versioning

* All security implementations are subject to new vulnerabilities. Consider adding a version header to your webhook messages or the hash signature to provide [forward compatibility](/ops-experience/versioning)
* Version payloads too, or send [thin events](/security/dataless-notifications) that don't need versioning

## Compensatory controls

* Whenever possible, list the IP origins for webhook messages. This information allows developers to implement IP policies in their listeners for additional security
* Provide a convenient way for listeners to verify the validity of a webhook call, such as including a webhook receipt URL/API within the webhook message.
* Consider a [one time verification challenge](/security/one-time-verification-challenge) so you only send webhooks to endpoints that expect them.

## Delivery

* Send a unique ID with every event and keep it stable across retries. See [Idempotency](/ops-experience/idempotency).
* Retry failed deliveries with exponential backoff and jitter, and notify consumers before disabling an endpoint. See [Retries and Timeouts](/ops-experience/retries).
* Document whether events are ordered, and include enough information to reorder them. See [Event Ordering](/ops-experience/ordering).
* Offer delivery logs, manual redelivery, and [resiliency](/ops-experience/resiliency) features such as heartbeats and circuit breaking.
