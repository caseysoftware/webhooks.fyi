---
title: Testing and Local Development
description: Webhooks are hard to test because the provider has to reach your code. Tunnels, provider CLIs, test events, and delivery logs close the feedback loop for webhook consumers.
---

Webhooks invert the usual development loop. Instead of your code calling an API, a provider calls your code — which means it needs a public HTTPS URL, real events, and a valid signature before your handler runs at all. Good providers recognize this and give developers ways to close that feedback loop.

## Getting events to localhost

**Tunnels** expose a local port on a temporary public HTTPS URL, which you register as the webhook endpoint while developing. Stripe's own docs [suggest ngrok](https://docs.stripe.com/webhooks#set-up-your-endpoint) for this; Hookdeck's CLI and Cloudflare Tunnel are common alternatives. Most tunnels also include a request inspector so you can see the exact headers and raw body the provider sent.

**Provider CLIs** skip the public URL entirely by forwarding events to localhost:

- **Stripe CLI:** `stripe listen --forward-to localhost:4242/webhook` forwards events from your account and prints a signing secret for local verification; `stripe trigger payment_intent.succeeded` creates the objects that cause an event. See [Stripe](/webhook-directory/stripe).
- **Shopify CLI:** [`shopify app webhook trigger`](https://shopify.dev/docs/api/shopify-cli/app/app-webhook-trigger) sends a sample payload for a topic to an address such as `http://localhost:3000/webhooks`. Shopify notes its payloads are always the same and failed deliveries aren't retried, so it doesn't replace end-to-end testing.

## Triggering test events

- **Ping and test events:** GitHub sends a `ping` event when a webhook is created, and GitLab offers a "Test" button that also [re-enables a disabled webhook](https://docs.gitlab.com/user/project/integrations/webhooks/) on a `2xx` response.
- **Sandbox accounts:** Stripe sandboxes generate real events with a separate signing secret — Stripe [uses a different secret for test and live](https://docs.stripe.com/webhooks) on the same endpoint.
- **Redelivery:** GitHub, GitLab, and Stripe let you resend a past delivery, which is the fastest way to reproduce a bug with a real payload. See [Retries and Timeouts](/ops-experience/retries#recovering-from-long-outages).

## Testing what can go wrong

The happy path is the easy part. Before going live, make sure your listener:

- **Rejects bad signatures.** Send a request with a missing or altered signature header and confirm you return `401`. Discord enforces this for you: its [automated security checks](https://docs.discord.com/developers/interactions/overview) send requests with invalid signatures to interaction endpoints and remove the URL if the endpoint fails validation.
- **Verifies against the raw body.** Many frameworks parse JSON before your handler runs; re-serializing it changes the bytes and breaks [HMAC verification](/security/hmac). Stripe, Slack, Shopify, and Linear all call this out.
- **Rejects stale timestamps.** Replay a captured request after your tolerance window and confirm it fails — see [Replay Prevention](/security/replay-prevention). This also means captured payloads stop verifying after a few minutes, so tests should sign fixtures with a test secret rather than replaying old requests.
- **Handles duplicates and reordering.** Deliver the same event twice and deliver events out of order. See [Idempotency](/ops-experience/idempotency) and [Event Ordering](/ops-experience/ordering).
- **Responds before the timeout.** Add artificial latency to processing and confirm the response still goes out first. See [Retries and Timeouts](/ops-experience/retries).

## Recommendations for providers

- Provide a CLI or dashboard action to send test events to any URL, including localhost
- Keep separate signing secrets for test and production environments
- Show delivery logs with request headers, payload, response status, and timing, and allow manual redelivery
- Publish sample payloads for every event type and complete, runnable verification code — see [Documentation](/ops-experience/documentation)
