---
title: Introduction
pageTitle: Webhooks.fyi
description: Learn the most popular approaches for building, securing, and operating webhooks, with recommendations for webhook providers and consumers
---

Webhooks are the foundation of modern API development. They enable us to react to changes in our systems, an incoming text message, a successful payment, or that latest pull request no matter our stack. While webhooks are universal in concept, they are unstandardized API contracts with few organizations paying attention to their design, security controls, and overall operational experience.

Webhooks.fyi seeks to change that.

It serves both as a directory of webhook providers and a collection of best practices for providing and consuming webhooks. Starting from security, moving into payload protection, and continuing into operationalizing webhooks, we delve into the concepts and practices currently available in the wild. 

## What should you expect to find?

- [What are webhooks?](/docs/webhook-primer) and a [glossary](/docs/glossary) of common terms
- [Webhook Directory](/docs/webhook-directory) lists different webhook implementations with their security and operational experience features, with detailed pages for providers like [GitHub](/webhook-directory/github), [Stripe](/webhook-directory/stripe), and [Slack](/webhook-directory/slack)
- [Webhook Security](/security/intro) documents the approaches for securing webhooks, from [HMAC](/security/hmac) to [SSRF protection](/security/ssrf) for providers
- [Operational Experience](/ops-experience/intro) details features for better consuming and maintaining webhooks, including [retries](/ops-experience/retries), [idempotency](/ops-experience/idempotency), and [local testing](/ops-experience/testing)
- [Best Practices for webhook providers](/best-practices/webhook-providers) and [consumers](/best-practices/webhook-consumers)
- [Standardization Efforts](/learn-more/standards) such as Standard Webhooks and RFC 9421

## Contributing to webhooks.fyi

Yes! We have many webhooks to document, patterns to uncover, and best practices to highlight!
Our [contributing page](/docs/how-to-contribute) covers how you can help.

## Why did you create webhooks.fyi?

Web development is hard. As you have more moving pieces integrating more systems across different organizations, it only becomes harder.

When we were at **ngrok**, we wanted to understand how people were building and using webhooks across the entire ecosystem. During that effort, we investigated over 100 webhook providers and found practices that stood out as exceptionally powerful and others that left much to be desired. Our goal in sharing this is to inform teams to choose patterns that make building and consuming webhooks easier, faster, and more secure.

Since that time, we appreciate great sponsors such as [Hookdeck](https://hookdeck.com/?ref=webhooksfyi) supporting our efforts.

## Our contributors

Thank you to [everyone who has contributed](https://github.com/caseysoftware/webhooks.fyi/contributors) to webhooks.fyi. We appreciate you!

![Our contributors - image by contrib.rocks](https://contrib.rocks/image?repo=caseysoftware/webhooks.fyi)