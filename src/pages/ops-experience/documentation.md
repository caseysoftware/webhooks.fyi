---
title: Documentation
description: Delightful developer and ops experience starts with docs that are easy to understand, complete, and insightful. Given each webhook implementation's uniqueness, good documentation is crucial for building webhook consumers fast and safely.
--- 

Delightful developer and ops experience starts with docs that are easy to understand, complete, and insightful. Given each webhook implementation's uniqueness, good documentation is crucial for building webhook consumers fast and safely. Great webhook documentation provides:


{% table %}
* Best Practice
* Examples
---
* An overview of when webhooks should be used
* - [Stripe](https://stripe.com/docs/webhooks/stripe-events#why-use-webhooks)
  - [Twilio](https://www.twilio.com/docs/usage/webhooks/webhooks-overview)
---
* A list of events supported and how to subscribe to events 
* - [Square](https://developer.squareup.com/docs/webhooks/v2webhook-events-tech-ref)
  - [GitHub](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads)
---
* (If [one time verification](/security/one-time-verification-challenge) check exists), how to perform the verification
* - [Okta](https://developer.okta.com/docs/concepts/event-hooks/#one-time-verification-request) 
  - [Microsoft OneDrive](https://docs.microsoft.com/en-us/onedrive/developer/rest-api/concepts/webhook-receiver-validation-request?view=odsp-graph-online)
---
* A comprehensive list of the security features and why they exist
* - [DocuSign](https://developers.docusign.com/platform/webhooks/connect/validation-and-security/)
---
* Human-friendly descriptions of why and how security controls work 
* - [DocuSign](https://developers.docusign.com/platform/webhooks/connect/hmac/#how-it-works)
  - [Calendly](https://developer.calendly.com/api-docs/ZG9jOjM2MzE2MDM4-webhook-signatures)
---
* The journey (steps) for receiving, validating, and processing webhook events
* - [Shopify](https://shopify.dev/apps/webhooks/configuration/https#step-1-register-an-endpoint)
  - [Square](https://developer.squareup.com/docs/webhooks/overview#related-topics)
---
* Example payloads 
* - [Aftership](https://www.aftership.com/docs/aftership/webhook/webhook-specifications#body)
  - [Typeform](https://developer.typeform.com/webhooks/example-payload/)
  - [PagerDuty](https://developer.pagerduty.com/docs/ZG9jOjQ1MTg4ODQ0-overview#event-data-types)
---
* Complete sample code 
* - [Buildkite](https://buildkite.com/docs/apis/webhooks#example-implementations) 
  - [Zoom](https://github.com/zoom/webhook-sample-node.js)
---
* How to operate & [retry](/ops-experience/retries) when webhook messages are lost (i.e. due to outages)
* - [Stripe](https://docs.stripe.com/webhooks#event-delivery-behaviors)
  - [BigCommerce](https://developer.bigcommerce.com/api-docs/store-management/webhooks/about-webhooks#callback-retry-mechanism)
---
* Delivery guarantees: timeouts, [duplicates](/ops-experience/idempotency), and [ordering](/ops-experience/ordering)
* - [Okta](https://developer.okta.com/docs/concepts/event-hooks/)
  - [Stripe](https://docs.stripe.com/webhooks#event-ordering)
---
* How to test webhooks [locally](/ops-experience/testing) and trigger sample events
* - [Stripe](https://docs.stripe.com/webhooks#test-webhook)
  - [Shopify](https://shopify.dev/docs/api/shopify-cli/app/app-webhook-trigger)
---
* Information that can enable compensatory controls, such as list of IPs for firewall rules
* - [Brex](https://developer.brex.com/docs/webhooks/#ip-whitelisting)
  - [Castle](https://docs.castle.io/docs/subscribe-to-webhooks#allowlisting-castle-ips)
{% /table %}


Providers can also publish machine-readable descriptions of every event using the `webhooks` field in [OpenAPI 3.1](/learn-more/standards#open-api-and-async-api), which lets consumers generate types and validators instead of copying payloads by hand.

Unfortunately, we found webhook documentation that makes knowledge assumptions, skips steps, and consistently delivers incomplete code snippets. About 10% of the webhooks we've seen missed critical information in their docs — including lack of the encoding format (base64 or hex), the signature date format (Unix or RFC 3339), and hash signature payload instructions — the details we now track in the [webhook directory](/docs/webhook-directory). To overcome incomplete docs, we spent significant time performing guesswork, scraping the internet, and unit testing webhooks until we found something that worked. While we were motivated to continue digging and researching to get the correct answer, many developers would have skipped verifying webhooks out of frustration.
