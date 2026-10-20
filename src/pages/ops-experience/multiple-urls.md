---
title: Multiple URLs
description: Great webhook implementations allow users to send notifications to multiple URLs with different levels of security and events notified
--- 

Often, webhook consumers must send webhook notifications to multiple systems. For example, many companies set up PagerDuty to send webhook notifications to multiple systems when incidents are triggered, including Slack — to send an alert to operations, Jira Service Desk — to track the event, and Okta Workflows — to grant temporary access to production servers so the engineer on duty can solve the issue. 

Good webhook solutions allow users to send events to multiple listeners/URLs while keeping independent authentication secrets for each system. [DocuSign](https://developers.docusign.com/platform/webhooks/connect/hmac/), for example, lets you set independent URLs with up to 20 different signing keys to support this use case.

[Stripe](/webhook-directory/stripe) supports up to [16 event destinations](https://docs.stripe.com/webhooks#set-up-your-endpoint) per account. Each endpoint subscribes to its own list of event types and gets a unique signing secret — and a different secret for test and live mode — so a compromised secret affects only one listener. Stripe also recommends subscribing each endpoint only to the events it needs, to avoid putting undue load on your servers.

Shopify lets an app hold several subscriptions to the same topic. Each delivery carries its own `X-Shopify-Webhook-Id`, while `X-Shopify-Event-Id` is shared, so consumers can tell which deliveries came from the same merchant action — see [Idempotency](/ops-experience/idempotency).

Independent endpoints also isolate failures. A slow or broken listener only affects its own [retries](/ops-experience/retries), not deliveries to the other URLs.
