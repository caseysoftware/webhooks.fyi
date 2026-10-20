---
title: Key Rotation
description: Webhooks rely heavily on secrets — hash keys, tokens, certificates — that should be rotated periodically to keep communications safe. Good webhook implementations recognize this necessity and implement features to simplify and automate the key rotations
--- 

Webhooks rely heavily on secrets — hash keys, tokens, certificates — that should be rotated periodically to keep communications safe. Good webhook implementations recognize this necessity and implement features to simplify and automate the key rotations:

Providers — like [Box](https://developer.box.com/guides/webhooks/v2/signatures-v2/), [Brex](https://developer.brex.com/docs/webhooks/), [DocuSign](https://developers.docusign.com/platform/webhooks/connect/hmac/), [PagerDuty](https://developer.pagerduty.com/docs/ZG9jOjExMDI5NTkz-verifying-signatures), and [Stripe](/webhook-directory/stripe) — implemented controls within their webhooks for key rotation. The [webhook directory](/docs/webhook-directory) tracks which providers support zero downtime rotation. 

[PagerDuty](https://developer.pagerduty.com/docs/ZG9jOjExMDI5NTkz-verifying-signatures), for example, can sign webhooks using multiple signatures and then add them all to the `X-PagerDuty-Signature` header (comma separated), allowing consumers to roll out a new secret key and gradually update webhook listeners without outages.

```
X-PagerDuty-Signature:
v1=f03de6f61df6e454f3620c4d6aca17ad072d3f8bbb2760eac3b2ad391b5e8073,
v1=130dcacb53a94d983a37cf2acba98e805a1c37185309ba56fdcccbcf00d6dd8b,
v1=ansdoj213e98jqd928u3eudh239eu2j9d2jd8ejd238eu23ei2d9j23e8u23eue3
```

[Stripe](/webhook-directory/stripe) uses the same approach. When you roll an endpoint's secret, you can keep the old one active for up to 24 hours, and Stripe adds one `v1` signature per active secret to the `Stripe-Signature` header:

```
Stripe-Signature: t=1492774577,v1=5257a869e7ec...,v1=6ffbb59b2300...
```

The [Standard Webhooks](/learn-more/standards#standard-webhooks) specification makes this part of the format: `webhook-signature` is a space-delimited list, so consumers check each signature until one matches.

```
webhook-signature: v1,g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE= v1,bm9ldHUjKzFob2VudXRob2VodWUzMjRvdWVvdW9ldQo=
```

[Box](https://developer.box.com/guides/webhooks/v2/signatures-v2/) and [DocuSign](https://developers.docusign.com/platform/webhooks/connect/hmac/) enumerate signatures as part of the header name:

```
BOX-SIGNATURE-PRIMARY: 6TfeAW3A1PASkgboxxA5yqHNKOwFyMWuEXny/FPD5hI=
BOX-SIGNATURE-SECONDARY: v+1CD1Jdo3muIcbpv5lxxgPglOqMfsNHPV899xWYydo=
```

```
X-DocuSign-Signature-1: DfV+OtRSnsuy.....NLXUyTfY=
X-DocuSign-Signature-2: CL9zR6MI/yUa.....O09tpBhk=
X-DocuSign-Signature-#: CLdaoskdi_kd.....O09tpskk=
```

[Plaid](https://plaid.com/docs/api/webhooks/webhook-verification/) goes one step further and implements the JSON Web Key (JWK) standard for rotating keys. While JWK adds extra complexity during the development, it provides a way for webhook consumers to fetch the latest keys used by Plaid to sign webhook messages.

Microsoft Graph applies the same idea to [encrypted payloads](/security/asymmetric-key-signatures#encrypting-payloads-with-asymmetric-keys): each notification names the `encryptionCertificateId` it was encrypted for, so consumers can keep old private keys until notifications stop referencing them.

## Rotation without overlap

Not every provider offers an overlap window. [Twilio](/webhook-directory/twilio) signs requests with the account's primary Auth Token, so a new secondary token isn't used for signatures until it's promoted — at which point listeners still using the old token fail. [Paddle](https://developer.paddle.com/webhooks/signature-verification) notes that it may add secret rotation in the future, and that more than one `h1` signature may appear in its header when it does.

Consumers can prepare for rotation even before a provider supports it: write verification code that accepts a list of secrets and a list of signatures, and passes if any pair matches.
