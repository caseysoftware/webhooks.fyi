---
title: Idempotency and Duplicate Events
description: Most webhook providers deliver events at least once, so every consumer eventually receives the same event twice. Providers that send a stable, unique event ID make deduplication simple.
---

Most webhook providers guarantee *at-least-once* delivery. When a provider can't confirm that a listener received an event — a timeout, a dropped connection, a `5xx` — it [retries](/ops-experience/retries). If the listener actually processed the first attempt but responded too slowly, it now receives the same event twice.

Providers say this plainly in their docs: Stripe endpoints ["might occasionally receive the same event more than once"](https://docs.stripe.com/webhooks#handle-duplicate-events), Okta delivery is ["best-effort and at least once"](https://developer.okta.com/docs/concepts/event-hooks/), and Twitch ["sends you a notification at least once"](https://dev.twitch.tv/docs/eventsub/handling-webhook-events/). The exceptions trade duplicates for lost events: Asana describes its delivery as [at-most-once](https://developers.asana.com/docs/webhooks-guide) and recommends a fallback polling system for critical use cases.

An operation is *idempotent* when performing it once or many times has the same result. Consumers make webhook processing idempotent by recording which events they've handled and skipping repeats — and that's only practical when the provider sends a stable ID.

## Unique event IDs

{% table %}
* Provider
* Where the ID lives
* Notes
---
* [GitHub](/webhook-directory/github)
* `X-GitHub-Delivery` header
* Redeliveries reuse the [original value](https://docs.github.com/en/webhooks/using-webhooks/best-practices-for-using-webhooks)
---
* GitLab
* `webhook-id` header (also `Idempotency-Key`)
* [Stays the same across retries](https://docs.gitlab.com/user/project/integrations/webhooks/) and manual resends
---
* Shopify
* `X-Shopify-Webhook-Id` and `X-Shopify-Event-Id` headers
* [Webhook-Id](https://shopify.dev/docs/apps/build/webhooks/verify-deliveries) is unique per subscription delivery; Event-Id is shared by every delivery triggered by the same merchant action
---
* [Stripe](/webhook-directory/stripe)
* `id` field in the payload
* Track [event IDs](https://docs.stripe.com/webhooks#event-ordering) rather than the `created` timestamp
---
* Twitch
* `Twitch-Eventsub-Message-Id` header
* Also part of the [signed content](https://dev.twitch.tv/docs/eventsub/handling-webhook-events/)
---
* Okta
* `eventId` field in each event
* [Compare against IDs already received](https://developer.okta.com/docs/concepts/event-hooks/)
---
* Standard Webhooks (OpenAI, GitLab, and others)
* `webhook-id` header
* The [specification](/learn-more/standards#standard-webhooks) defines it as the idempotency key and includes it in the signature
{% /table %}

## Deduplicating on the consumer

The simplest approach is a table (or cache) of processed IDs with a unique constraint:

```js
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!isValidSignature(req)) {
    return res.status(401).send('Unauthorized')
  }
  const eventId = req.get('webhook-id')

  // INSERT ... ON CONFLICT DO NOTHING returns 0 rows if we've seen this ID
  const inserted = await db.query(
    'INSERT INTO processed_events (id) VALUES ($1) ON CONFLICT DO NOTHING',
    [eventId]
  )
  if (inserted.rowCount === 0) {
    // Duplicate: acknowledge it so the provider stops retrying
    return res.status(200).send()
  }

  await queue.publish(req.body)
  res.status(202).send()
})
```

A few details matter:

- **Acknowledge duplicates with a `2xx`.** Returning an error for a duplicate triggers more retries.
- **Record the ID together with the work.** If you record the ID and then crash before processing, the event is lost; if you process and then fail to record the ID, it will be processed again. Recording both in the same transaction avoids either outcome.
- **Keep IDs at least as long as the retry window.** Stripe and PayPal retry for up to three days, OpenAI for 72 hours. See [Retries and Timeouts](/ops-experience/retries).

## Duplicates without duplicate IDs

Event IDs only catch redeliveries of the same event. Stripe notes that in some cases [two separate events are generated](https://docs.stripe.com/webhooks#handle-duplicate-events) for the same change, and recommends using the ID of the object in `data.object` along with the event type to identify them.

The most robust defense is making the handler itself idempotent: set an order's status to `paid` rather than incrementing a counter, and upsert records by the provider's object ID rather than inserting new ones. Fetching current state from the provider's API — the approach behind [thin events](/security/dataless-notifications) — also makes repeated processing harmless.

## Event IDs and replay prevention

Unique IDs also strengthen [replay prevention](/security/replay-prevention). A signed timestamp limits how long a captured request is useful; remembering processed IDs rejects a replay even inside that window. GitHub recommends `X-GitHub-Delivery` for exactly this purpose, and Mailgun suggests [caching the `token`](https://documentation.mailgun.com/docs/mailgun/user-manual/events/webhooks) sent with each webhook and rejecting reuse.

## Recommendations for providers

- Send a unique ID with every event and keep it identical across retries and manual redeliveries
- Include the ID in the [signed content](/security/hmac) so it can't be altered — as [Standard Webhooks](/learn-more/standards#standard-webhooks) and Twitch do
- Document your delivery guarantee (at-most-once, at-least-once) and how long consumers should retain IDs
