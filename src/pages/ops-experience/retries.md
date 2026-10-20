---
title: Retries and Timeouts
description: Webhook providers decide what counts as a failed delivery, how long to wait for a response, how often to retry, and when to give up. These choices shape how webhook consumers must build their listeners.
---

Every webhook provider has to answer the same questions: how long will it wait for the listener to respond, what counts as a failure, how many times will it retry, and what happens when the listener stays down? Very few providers answer them the same way, and the answers determine how consumers must build their listeners.

## What providers do today

{% table %}
* Provider
* Response timeout
* Automatic retries
* After repeated failures
---
* [GitHub](/webhook-directory/github)
* [10 seconds](https://docs.github.com/en/webhooks/using-webhooks/best-practices-for-using-webhooks)
* [None](https://docs.github.com/en/webhooks/using-webhooks/handling-failed-webhook-deliveries) — redeliver manually or via the REST API
* —
---
* GitLab
* GitLab.com limit
* No automatic schedule documented — resend manually or via the API
* [Temporarily disabled after 4 consecutive failures, permanently after 40](https://docs.gitlab.com/user/project/integrations/webhooks/)
---
* [Stripe](/webhook-directory/stripe)
* Not published — "quickly return a 2xx"
* [Up to 3 days with exponential backoff](https://docs.stripe.com/webhooks#automatic-retries) in live mode; 3 attempts over a few hours in sandboxes
* —
---
* Shopify
* [5 seconds](https://shopify.dev/docs/apps/build/webhooks/troubleshooting-webhooks)
* 8 retries over 4 hours
* Subscriptions may be removed after multiple failures
---
* [Zoom](/webhook-directory/zoom)
* [3 seconds](https://developers.zoom.us/docs/api/webhooks/)
* Up to 3 retries (5, 20, and 60 minutes) — only on 5xx and some connection errors
* Subscription disabled after 6 consecutive failed revalidations
---
* Microsoft Graph
* [3 seconds](https://learn.microsoft.com/en-us/graph/change-notifications-delivery-webhooks) (10 seconds on retries)
* Up to 4 hours
* Slow endpoints are delayed; very slow endpoints have notifications dropped
---
* Okta
* [3 seconds](https://developer.okta.com/docs/concepts/event-hooks/)
* At most 1 retry — only on 5xx
* —
---
* Linear
* [5 seconds](https://linear.app/developers/webhooks)
* 3 retries (1 minute, 1 hour, 6 hours)
* May be disabled; must be re-enabled manually
---
* Asana
* [10 seconds](https://developers.asana.com/docs/webhooks-guide)
* Exponential backoff for up to 24 hours
* Webhook deleted after 24 hours without a successful delivery
---
* Mailgun
* —
* [Over 8 hours](https://documentation.mailgun.com/docs/mailgun/user-manual/events/webhooks) (5m, 10m, 15m, 1h, 2h, 4h)
* —
---
* PayPal
* —
* [Up to 25 times over 3 days](https://developer.paypal.com/api/rest/webhooks/rest/)
* —
---
* WorkOS
* —
* [Up to 6 times over 3 days](https://workos.com/docs/events/data-syncing/webhooks)
* —
---
* OpenAI
* "A few seconds"
* [Up to 72 hours with exponential backoff](https://developers.openai.com/api/docs/guides/webhooks)
* —
---
* Meta (Facebook)
* —
* [Immediately, then with decreasing frequency over 36 hours](https://developers.facebook.com/docs/graph-api/webhooks/getting-started)
* Dropped after 36 hours
{% /table %}

## What counts as a failure

Most providers treat anything other than a `2xx` response as a failed delivery, along with timeouts, connection errors, and TLS errors. The edge cases differ:

- **Redirects are failures.** Stripe and OpenAI do not follow `3xx` responses — the URL you register must be the final destination. This is also an important [SSRF](/security/ssrf) control for providers.
- **Some `4xx` responses are not retried.** Zoom and Okta only retry `5xx` responses. Mailgun treats `406 Not Acceptable` as "don't retry."
- **`410 Gone` can unsubscribe you.** Asana deletes a webhook that responds with `410`, and the [Standard Webhooks](/learn-more/standards#standard-webhooks) specification recommends that providers disable endpoints that return it.

## Respond fast, process later

Short timeouts — 3 seconds at Zoom, Okta, and Microsoft Graph — leave no room for real work inside the request. Stripe, Shopify, and Microsoft Graph all recommend the same pattern: [validate the signature](/security/hmac), persist or enqueue the event, return a `2xx` immediately, and process it asynchronously.

```js
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!isValidSignature(req)) {
    return res.status(401).send('Unauthorized')
  }
  // Persist first, then acknowledge — don't do the work inside the request
  await queue.publish(req.body)
  res.status(202).send()
})
```

A queue also absorbs bursts. Stripe notes that subscription renewals at the start of the month can produce large spikes in deliveries.

## Retries create duplicates and reorder events

A listener that finishes its work but responds after the timeout will receive the same event again. Retries also mean an older event can arrive after a newer one. Both are normal behavior for any provider with at-least-once delivery, so consumers should plan for:

- [Idempotency and duplicate events](/ops-experience/idempotency)
- [Event ordering](/ops-experience/ordering)

Retried deliveries may also carry new signatures and timestamps — Stripe [generates a new timestamp for every attempt](https://docs.stripe.com/webhooks#preventing-replay-attacks) — so [replay prevention](/security/replay-prevention) windows apply to each attempt, not to when the event first happened.

## Recovering from long outages

When the retry window closes, the event is gone unless the provider gives you another way to get it:

- **Manual redelivery:** GitHub, GitLab, and Stripe let you resend deliveries from their dashboards or APIs. Stripe allows resending from the Dashboard for 15 days and from the CLI for 30 days.
- **Event APIs:** Stripe exposes events and their related objects through its API, so consumers can fetch what they missed after an outage.
- **Reconciliation:** Shopify and Asana recommend a periodic job that fetches current state through the API, since webhooks alone can't guarantee you never miss a change.

## Recommendations

For providers:

- Document your timeout, retry schedule, what responses are retried, and when endpoints are disabled — the table above was assembled from a dozen different docs pages
- Retry with exponential backoff and jitter over a window of at least a day; the [Standard Webhooks](/learn-more/standards#standard-webhooks) specification recommends a multi-day schedule and a request timeout between 15 and 30 seconds
- Notify the consumer (email, dashboard) before disabling an endpoint
- Offer delivery logs and manual redelivery — see [Testing and Local Development](/ops-experience/testing)

For consumers:

- Acknowledge quickly and process asynchronously
- Make processing [idempotent](/ops-experience/idempotency)
- Monitor for disabled endpoints and gaps in delivery, and reconcile with the provider's API after outages

Related: [Heartbeat, Queueing, and Circuit Breaking](/ops-experience/resiliency)
