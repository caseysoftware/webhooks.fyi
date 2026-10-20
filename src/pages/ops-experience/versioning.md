---
title: Forward Compatibility and versioning
description: Successful webhook implementations will naturally evolve with improvements. Great webhook providers send version information in webhook requests to enable a more seamless transition to consumers to adopt improvements. 
--- 

Successful webhook implementations will naturally evolve with improvements in messaging, new features, and better security controls. Webhook providers — such as [PagerDuty](https://developer.pagerduty.com/docs/ZG9jOjExMDI5NTkz-verifying-signatures), [Circle CI](https://circleci.com/docs/2.0/webhooks/), and [Brex](https://developer.brex.com/docs/webhooks/) — send version information in webhook requests to enable a more seamless transition to consumers to adopt improvements. 

The webhook version can be sent in multiple ways:

- On the signature payload:
    ```
    X-PagerDuty-Signature:
    v1=f03de6f61df6e454f3620c4d6aca17ad072d3f8bbb2760eac3b2ad391b5e8073,
    v1=130dcacb53a94d983a37cf2acba98e805a1c37185309ba56fdcccbcf00d6dd8b
    ```
- On a dedicated signature header:
    ```
    BOX-SIGNATURE-VERSION: 1
    ```
- As part of the signature header name:
    ```
    X-HubSpot-Signature-v3: <signed value>
    ```
- As a prefix on each signature, as in [Standard Webhooks](/learn-more/standards#standard-webhooks), where `v1` is HMAC-SHA256 and `v1a` is Ed25519:
    ```
    webhook-signature: v1,K5oZfzN95Z9UVu1EsfQmfVNQhnkZ2pj9o9NDN/H/pI4=
    ```

[Hubspot](https://developers.hubspot.com/docs/api/webhooks/validating-requests) is an example of a provider that changed versions of its webhook notification over the years. In its initial version (v1), Hubspot signed only the webhook request body to validate calls. Over the years, Hubspot improved its webhooks to include timestamp validation, changed the webhook signature contents, and changed the encoding from hex to base64.  

By informing the webhook signature version to the listener (via a header value or within the signed message), Hubspot made forward compatibility possible without breaking legacy endpoints. The versioning also allowed Hubspot to rollout webhook improvements per event basis, reducing the migration complexity for both provider and consumers.

## Upgrading signatures side by side

A common pattern is sending the old and new signatures together while consumers migrate:

- [GitHub](/webhook-directory/github) added `X-Hub-Signature-256` (HMAC-SHA256) and still sends the original `X-Hub-Signature` (HMAC-SHA1) for backward compatibility.
- X sends `X-Twitter-Webhooks-Signature-OAuth2`, signed with the app's OAuth 2.0 client secret, alongside the legacy `X-Twitter-Webhooks-Signature` during migration, and [recommends verifying the new header first](https://docs.x.com/x-api/webhooks/introduction).
- GitLab lets a webhook have both a legacy secret token and a [Standard Webhooks](/learn-more/standards#standard-webhooks) signing token at once, so consumers can switch without downtime.

Versioned schemes also protect against downgrade attacks. [Stripe](/webhook-directory/stripe) tells consumers to ignore every scheme other than `v1` — including the fake `v0` signature it adds to test events — so an attacker can't strip the strong signature and leave a weaker one.

## Versioning the payload

Signatures are only half of the contract; the payload changes too. Two approaches stand out:

- **Pin the payload to an API version.** Stripe structures snapshot events according to the API version of the account or endpoint when the event is created, so upgrading the API doesn't change the shape of events an existing endpoint receives until the endpoint is upgraded.
- **Don't version the payload at all.** Stripe's [thin events](/security/dataless-notifications) carry only IDs, and the consumer fetches the object through an API version it controls. Stripe notes this makes integrations easier to maintain because the payloads are unversioned.
