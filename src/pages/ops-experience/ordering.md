---
title: Event Ordering
description: Webhook providers rarely guarantee that events arrive in the order they happened. Consumers need strategies for stale, early, and missing events.
---

It's natural to assume webhooks arrive in the order things happened: a customer is created, then an invoice, then a payment. In practice, few providers promise that, and their docs say so:

- Stripe ["doesn't guarantee the delivery of events in the order that they're generated"](https://docs.stripe.com/webhooks#event-ordering). Creating a subscription can produce `customer.subscription.created`, `invoice.created`, `invoice.paid`, and `charge.created`, in any order.
- Okta events ["may arrive late, out of order, or in duplicate batches"](https://developer.okta.com/docs/concepts/event-hooks/).
- Shopify deliveries [can arrive late, sometimes up to a day](https://shopify.dev/docs/apps/build/webhooks/troubleshooting-webhooks).

## Why events arrive out of order

- **Retries:** an event that failed on the first attempt is [retried](/ops-experience/retries) minutes or hours later, after newer events were delivered successfully.
- **Parallel delivery:** providers deliver from many workers at once, and network latency varies per request.
- **Parallel processing:** even if events arrive in order, a consumer processing them with several workers can finish them out of order.
- **Batching:** some providers aggregate frequent changes — Notion batches `page.content_updated` events, which [may not be sent immediately](https://developers.notion.com/reference/webhooks).

## Strategies for consumers

**Fetch the current state.** Treat the webhook as a signal that something changed, then read the latest version of the object from the provider's API. This is the model behind [dataless notifications and thin events](/security/dataless-notifications), and Stripe recommends it explicitly — if `invoice.paid` arrives first, retrieve the invoice, charge, and subscription from the API.

**Discard stale updates.** If the payload carries a timestamp or version for the resource, store it and ignore any event older than what you already have:

```js
const incoming = event.data
const current = await db.findOrder(incoming.id)

if (current && current.updated_at >= incoming.updated_at) {
  // We already have newer data; skip this event
  return
}
await db.upsertOrder(incoming)
```

Be careful about timestamp precision. Stripe notes that its snapshot events record `created` in seconds, so distinct events can share a timestamp — don't use it to determine order.

**Handle events whose dependencies haven't arrived.** When an event references an object you haven't seen yet, fetch it from the API, or park the event and retry processing later, rather than failing.

**Design for out-of-order state transitions.** A state machine that rejects `paid` because it never saw `created` will break. Accept transitions that move forward, and ignore ones that move backward.

**Reconcile periodically.** Shopify recommends a reconciliation job that fetches data you may have missed through its APIs. The same job fixes anything ordering issues left behind.

**Use the provider's ordering hints.** Okta recommends using the `published` timestamp on each event to establish order.

## Recommendations for providers

- Document whether ordering is guaranteed — most providers don't, and consumers shouldn't have to guess
- Include when the event occurred, with enough precision to compare events, plus a resource version or `updated_at` where possible
- Consider [thin payloads](/security/dataless-notifications) for resources that change frequently, so consumers always fetch the latest state
- Pair ordering guidance with [unique event IDs](/ops-experience/idempotency), since retries cause both duplicates and reordering
