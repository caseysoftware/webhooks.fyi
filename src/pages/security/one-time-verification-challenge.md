---
title: One time verification challenge
description: Learn why and how webhook providers like Slack, Zoom, X (Twitter), Okta, and Microsoft implement a verification/challenge request before sending webhook messages
--- 

{% table %}
---
* **Complexity**
* - Medium
---
* **Pros**
* - Validates if the webhook consumer controls a destination before sending webhook notifications
  - Can be easily combined with other webhook authentication controls
  - Helps providers avoid sending traffic to URLs that never asked for it
---
* **Caveats**
* - Additional implementation complexity
  - Challenge formats are different for every provider
---
* **Examples**
* - [Adobe Sign](https://helpx.adobe.com/sign/using/adobe-sign-webhooks-api.html#VoI)
  - [Airship](https://docs.airship.com/platform/sms/inbound-message-handling/#registering-your-sms-webhook)
  - [Asana](https://developers.asana.com/docs/webhooks-guide)
  - [Meta (Facebook)](https://developers.facebook.com/docs/graph-api/webhooks/getting-started)
  - [Microsoft Graph and OneDrive](https://learn.microsoft.com/en-us/graph/change-notifications-delivery-webhooks)
  - [Okta](https://developer.okta.com/docs/concepts/event-hooks/#one-time-verification-request)
  - [Slack](/webhook-directory/slack)
  - [Smartsheet](https://smartsheet.redoc.ly/tag/webhooksDescription#section/Creating-a-Webhook)
  - [Twitch](https://dev.twitch.tv/docs/eventsub/handling-webhook-events/)
  - [X (Twitter)](https://docs.x.com/x-api/webhooks/introduction)
  - [Zoom](/webhook-directory/zoom)
{% /table %}
---

While all providers implement authentication and authorization to set up webhooks, that doesn't confirm if the webhook consumer controls the code receiving webhook notifications.

To mitigate this risk, webhook providers like [X (Twitter)](https://docs.x.com/x-api/webhooks/introduction), [Okta](https://developer.okta.com/docs/concepts/event-hooks/#one-time-verification-request), and [Microsoft Graph](https://learn.microsoft.com/en-us/graph/change-notifications-delivery-webhooks) implement a verification/challenge request.

The challenge request is sent during setup and contains a random string that should be relayed back as part of the response. Microsoft Graph, for example, expects the token back as plain text within 10 seconds:

```curl
POST https://listener.com/my-webhook?validationToken=randomString
Content-Length: 0

HTTP/1.1 200 OK
Content-Type: text/plain

randomString
```

Webhook notifications are not sent until the challenge response is successful.

## Types of challenges

Providers have converged on the idea but not the format. We see four patterns:

**Echo the challenge.** The provider sends a random value and the consumer returns it unchanged. This proves someone at the URL is expecting webhooks, but not that they hold any secret.

- Microsoft Graph sends a `validationToken` query parameter and expects it back as `text/plain`
- [Slack](/webhook-directory/slack) sends a `url_verification` event with a `challenge` field when you save a Request URL
- Meta sends `hub.mode`, `hub.verify_token`, and `hub.challenge` query parameters; the consumer checks the verify token it configured and returns `hub.challenge`
- Okta sends an `x-okta-verification-challenge` header and expects `{ "verification": "<value>" }`
- Twitch sends a `webhook_callback_verification` message and expects the raw `challenge` value
- Discord sends a `PING` interaction and expects a `PONG` response

**Prove you hold the secret.** The consumer returns an HMAC of the challenge, proving it has the signing secret — not just that it's listening.

- [Zoom](/webhook-directory/zoom) sends an `endpoint.url_validation` event with a `plainToken`; the consumer returns the token and its HMAC-SHA256 (`encryptedToken`) using the app's Secret Token
- X sends a `crc_token`; the consumer returns `sha256=` plus the base64 HMAC-SHA256 of the token, keyed with the app's secret

**Exchange the secret.** Asana sends an `X-Hook-Secret` header in its handshake; the consumer echoes it back and keeps it as the [HMAC](/security/hmac) key for future `X-Hook-Signature` validation.

**Confirm out-of-band.** Notion sends a `verification_token` to the endpoint, and the developer pastes it into Notion's UI to activate the subscription.

GitHub's `ping` event is often mistaken for a challenge. It confirms delivery works, but GitHub doesn't require a particular response.

## Periodic re-validation

A one-time check only proves control at setup. Some providers repeat it:

- Zoom revalidates every 72 hours and disables the subscription after six consecutive failures
- X re-runs its challenge-response check every 30 minutes for webhooks that haven't validated successfully in the past 24 hours
- Asana sends a heartbeat every eight hours and deletes a webhook that hasn't responded to one for 24 hours — see [Resiliency](/ops-experience/resiliency)

{% callout title="Additional security concerns for webhook providers" type="warning" %}
Webhook integrations seem simple to secure at the surface. However, webhook URLs can be explored by malicious actors — acting as legitimate webhook consumers — to carry out Distributed Denial of Service (DDoS), Server-Side Request Forgery (SSRF), and other attacks to the provider infrastructure.

[SSRF and Egress Security](/security/ssrf) provides guidelines for mitigating these risks in webhook communications. 
{% /callout %}
