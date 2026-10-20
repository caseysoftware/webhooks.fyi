---
title: What are webhooks?
description: A quick primer on webhooks and how they work
---

## What are webhooks?

Webhooks are how one system notifies another system of a state change.

In architectural terms, a webhook is a programming language agnostic approach for sending messages between distributed systems. The power of webhooks comes first from being independent of any specific tech stack and second from the notification-based approach. Regardless of your architecture, your systems can receive or broadcast webhooks without being dependent on a specific vendor or even on the same network. Further, downstream systems receiving webhooks don't need to poll a central system for updates or status changes, they can simply listen for an event and process the results.

In practical terms, a webhook is simply an HTTP request - usually a POST or GET - with a JSON payload or parameters broadcast from the central system. Much of the modern web is built on this distributed communication pattern. They're popularly used to notify third-party systems of events such as a new incident tracked by PagerDuty, a successful payment in [Stripe](/webhook-directory/stripe), an SMS received by [Twilio](/webhook-directory/twilio), or a pull request opened on [GitHub](/webhook-directory/github).

## Webhooks vs. polling

Without webhooks, a system that needs to know about changes has to poll: call an API every few seconds or minutes and compare the results. Polling wastes requests when nothing changed and adds delay when something did. Webhooks flip the direction — the provider sends a request when the event happens. The trade-off is that the consumer must run a public endpoint, verify that requests are genuine, and cope with failed and repeated deliveries.

## Anatomy of a webhook

A typical webhook delivery looks like this:

```
POST /webhooks/stripe HTTP/1.1
Host: api.example.com
Content-Type: application/json
Stripe-Signature: t=1492774577,v1=5257a869e7ecebeda32affa62cdca3fa51cad7e77a0e56ff536d0ce8e108d8bd

{"id": "evt_1NG8Du2eZvKYlo2CUI79vXWy", "type": "payment_intent.succeeded", "data": {...}}
```

- **Endpoint:** the URL the consumer registered with the provider — see [Multiple URLs](/ops-experience/multiple-urls)
- **Event type and ID:** what happened, and a unique ID for [deduplication](/ops-experience/idempotency)
- **Payload:** the details of the event, or only identifiers in [thin events](/security/dataless-notifications)
- **Signature and timestamp:** proof of who sent it and when — see [HMAC](/security/hmac) and [Replay Prevention](/security/replay-prevention)
- **Response:** the consumer answers with a `2xx` quickly, or the provider [retries](/ops-experience/retries)

The [glossary](/docs/glossary) defines these terms, and the [webhook directory](/docs/webhook-directory) shows how each provider implements them.