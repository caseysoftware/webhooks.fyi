---
title: Best Practices for Webhook Consumers
description: Security Best Practices for Webhook Consumers
---

In addition to using a good webhook provider and implementation, you can take the following steps to improve your webhook security:

* **Use HTTPS on the listener with a strong cipher suite**: First and foremost, do not operate in clear text (seriously, don't!). Most webhooks don't provide any control to encrypt your messages. This recommendation is even more critical in webhooks with  Basic Authentication and shared secrets. Use HTTPS with a strong cipher suite to mitigate the man-in-the-middle.

* **Review the webhook documentation and ensure you're implementing all the security features offered:** in webhook communications, the authentication, message integrity validation, replay prevention validation, and enforcement happen on the webhook listener. Therefore, you should read, understand, and implement the security controls made available by your provider. The [webhook directory](/docs/webhook-directory) summarizes what each provider offers.

* **Verify signatures correctly:** compute the signature over the raw request body — not re-serialized JSON — and compare with a constant-time function. These are the most common verification mistakes; see [HMAC](/security/hmac#common-verification-mistakes) and working examples for [GitHub](/webhook-directory/github), [Stripe](/webhook-directory/stripe), and [Slack](/webhook-directory/slack).

* **Check timestamps:** if the provider signs a timestamp, reject requests outside a few minutes of your clock to block [replay attacks](/security/replay-prevention).

* **Restrict who can send you webhook requests based on the IP**: Some services — i.e. [GitHub](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-githubs-ip-addresses), [Stripe](https://docs.stripe.com/ips#webhook-notifications), and [Zoom](https://developers.zoom.us/docs/api/webhooks/) — provide a public list of IPs used in their service to send you webhook notifications. You can use this list to implement network restrictions and ensure only the webhook service is sending notifications. Note that this may not be possible if the webhook service does not provide a list of their origin IPs, and that providers change these lists over time — GitHub recommends updating your allow list periodically.

* **Storing secrets**: Credentials and shared secrets should be treated as confidential information and handled like private keys (stored appropriately both by the webhook service and listener in production usage).

* **Segmenting secrets:** Some services — like DocuSign and Stripe — will let you adopt a unique secret for each webhook listener ([Multiple URLs](/ops-experience/multiple-urls)), allowing consumers to segment secrets and reduce the likelihood of compromise.

* **Rotating secrets:** In addition to segmentation, you can also change secrets at regular intervals or after important events — i.e., when a critical employee leaves the organization — to mitigate risk if the secret is compromised. Providers with [zero downtime rotation](/ops-experience/key-rotation) let you do this without dropping webhooks.

* **Use robust signature algorithms**: Use the strongest hashing algorithms available with the webhook signature whenever possible, such as SHA256. When a provider sends both, prefer the newer header — i.e., GitHub's `X-Hub-Signature-256` over the SHA-1 `X-Hub-Signature`.

* **Call back the service:** An interesting method to validate if a webhook request is legitimate is to call the service that sent the webhook from a different channel, such as their REST API, to confirm said event happened. Some services — i.e., Atlassian Jira and Stripe's thin events — will include an API endpoint in the webhook body to facilitate the validation. However, this approach impacts performance and time to value. Providers that send [dataless notifications](/security/dataless-notifications) build this pattern in.

{% diagram-callback / %}

_Webhook notification with API callback_

## Operational practices

Security is only half of a reliable listener. You should also:

* **Respond quickly and process asynchronously:** many providers time out in 3 to 10 seconds. Verify, enqueue, and return a `2xx` before doing real work. See [Retries and Timeouts](/ops-experience/retries).

* **Expect duplicates:** most providers deliver at least once. Track event IDs and make handlers idempotent. See [Idempotency and Duplicate Events](/ops-experience/idempotency).

* **Don't assume order:** compare timestamps or versions, or fetch the latest state from the provider's API. See [Event Ordering](/ops-experience/ordering).

* **Reconcile after outages:** when a provider's retry window closes, events are gone. Use redelivery tools or the provider's API to catch up.

* **Test the failure paths:** bad signatures, stale timestamps, duplicates, and slow processing. See [Testing and Local Development](/ops-experience/testing).
