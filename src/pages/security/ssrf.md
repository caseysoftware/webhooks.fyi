---
title: SSRF and Egress Security
description: When users can register any URL as a webhook endpoint, providers must protect their own infrastructure from Server-Side Request Forgery (SSRF), slow responses, and redirect tricks.
---

{% table %}
---
* **Complexity**
* - Medium
---
* **Pros**
* - Protects the provider's internal network and cloud metadata services from user-supplied URLs
  - Contains slow or malicious endpoints so they can't exhaust delivery workers
---
* **Caveats**
* - Validating the URL at registration is not enough — DNS and redirects can change where a request goes
  - Requires network-level controls, not just application code
---
* **Examples**
* - [Smokescreen](https://github.com/stripe/smokescreen) (Stripe's egress proxy)
  - [webhook-sentry](https://github.com/juggernaut/webhook-sentry)
  - [Standard Webhooks security recommendations](https://github.com/standard-webhooks/standard-webhooks/blob/main/spec/standard-webhooks.md)
{% /table %}
---

Most webhook security focuses on the consumer: is this request really from the provider? But a webhook is an HTTP request the provider makes to a URL chosen by someone else. Malicious users can register webhook URLs that point back into the provider's own network, then use the webhook system to probe internal services — a Server-Side Request Forgery (SSRF) attack. Others register endpoints that respond slowly or never respond, tying up delivery workers.

## Attack vectors

[cuu508](https://news.ycombinator.com/item?id=32518208) summarized the problem well from running a monitoring service that calls user-defined webhooks:

> * Timeouts: the user can set up a webhook receiver that takes very long to generate a response. Your service must be able to deal with that.
> * Timeouts (slowloris): the webhook target could be sending back one byte at a time, with 1 second pauses inbetween. If you are using, say, the "requests" python library for making HTTP requests, the "timeout" parameter will not help here
> * Private IPs and reserved IPs: you probably don't want users defining webhooks to http://127.0.0.1:<some-port> and probing your internal network. Remember about private IPv6 ranges too
> * Domains that resolve to private IPs: attacker could set up foo.com which resolves to a private IP. It is not enough to just validate webhook URLs when users set them up.
> * HTTP redirects to private IPs. If your HTTP client library follows HTTP redirects, the attacker can set up a webhook endpoint that redirects to a private IP. Again, it is not enough to validate the user-supplied URL.
> * Excessive HTTP redirects. The attacker can set up a redirect loop - make sure this does not circumvent your timeout setting.

Two more are worth adding:

- **Cloud metadata endpoints:** link-local addresses such as `169.254.169.254` expose instance credentials on most cloud providers. They are the most valuable SSRF target and must be blocked explicitly.
- **Response exfiltration:** delivery logs that show the endpoint's full response body turn a blind SSRF into one that leaks data. Truncate or omit response bodies from requests to unexpected destinations.

## Mitigations

**Route webhook traffic through an egress proxy.** A dedicated proxy such as [Smokescreen](https://github.com/stripe/smokescreen) or [webhook-sentry](https://github.com/juggernaut/webhook-sentry) resolves the destination, blocks private, loopback, link-local, and reserved ranges (IPv4 and IPv6), and is the only path to the internet for delivery workers. The [Standard Webhooks](/learn-more/standards#standard-webhooks) specification recommends this approach.

**Isolate delivery workers.** Run them in a network segment with no access to internal services, so a bypass of the proxy still reaches nothing of value. Standard Webhooks recommends a private subnet that can only reach the internet through the proxy.

**Check the IP you actually connect to.** Validate the resolved address at send time, then connect to that address — not to the hostname again. Re-resolving lets an attacker return a public IP for the check and a private one for the connection (DNS rebinding).

**Don't follow redirects.** Stripe and OpenAI treat a `3xx` response as a failed delivery and require the registered URL to be the final destination — see [Retries and Timeouts](/ops-experience/retries). If you must follow redirects, validate every hop and cap the count.

**Enforce a total deadline.** Set a timeout on the whole request, including connecting, TLS, and reading the response, and cap the response size. A per-read timeout doesn't stop a slowloris response.

**Require HTTPS and standard ports.** Restricting endpoints to `https` on port `443` removes many internal targets outright. Stripe requires HTTPS endpoints in live mode.

**Confirm the endpoint wants your traffic.** A [one-time verification challenge](/security/one-time-verification-challenge) proves the URL is controlled by someone expecting webhooks, which prevents a provider from being used to send traffic to arbitrary third-party servers.

## Related

- [Best Practices for Webhook Providers](/best-practices/webhook-providers)
- [Introduction to Webhook Security](/security/intro)
