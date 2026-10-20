---
title: Dataless notifications
description: Learn how webhook providers like Microsoft Graph, Stripe, and OpenAI send thin webhook notifications without passing confidential data, and the trade-offs with this approach.
--- 

{% table %}
---
* **Complexity**
* - High
---
* **Pros**
* - Send webhook notifications without confidential data
  - Help reduce webhook security requirements
  - Can reduce request traffic with bulk operations
  - Consumers always act on the latest state, which sidesteps [ordering](/ops-experience/ordering) and [duplicate](/ops-experience/idempotency) problems
  - Payloads don't need [versioning](/ops-experience/versioning) when the API already is
---
* **Caveats**
* - Webhook consumers must reach provider to gather information
  - Webhook consumers must have API keys to call the provider
  - API Performance and API Limits
---
* **Examples**
* - [Asana](https://developers.asana.com/docs/webhooks-guide)
  - [Microsoft Graph and OneDrive](https://learn.microsoft.com/en-us/onedrive/developer/rest-api/concepts/using-webhooks)
  - [OpenAI](https://developers.openai.com/api/docs/guides/webhooks)
  - [Smartsheet](https://smartsheet.redoc.ly/tag/webhooksDescription#section/Intro-to-Webhooks)
  - [Stripe thin events](/webhook-directory/stripe)
{% /table %}
---

Dataless notifications — increasingly called *thin events* or *thin payloads* — use webhooks only to signal that something happened. The payload carries identifiers, not the data itself, reducing the risk of data breaches.

Microsoft OneDrive (via Microsoft Graph) sends only a subscription id, expiration date, resource path, and the `clientState` secret the consumer chose when subscribing — no file contents or metadata:

```
{
  "value": [
    {
      "subscriptionId": "A640DFF3-0429-44FC-AF7E-30523A476864",
      "expirationDateTime": "2017-02-22T16:00:00Z",
      "resource": "/me/drive/root",
      "clientState": "client-specific string"
    }
  ]
}
```

Upon receiving a webhook notification, consuming apps make a request to the provider to gather more details about the event.

## Thin events in modern APIs

The pattern has spread well beyond file storage:

- **Stripe** [introduced thin events](https://docs.stripe.com/changelog/acacia/2024-09-30/api-v2-thin-events) with its v2 API in 2024 and now recommends them for new integrations. A thin event includes a `related_object` with the object's ID, type, and API URL, but not the object itself. Stripe lists the benefits: the payloads are unversioned, which makes integrations easier to maintain, and fetching the latest object "helps prevent application errors caused by outdated object data (for example, race conditions)."

    ```json
    {
      "id": "evt_test_65R9Ijk8dKEYZcXeRWn16R9A7j1FSQ3w3TGDPLLGSM4CW0",
      "object": "v2.core.event",
      "type": "v1.billing.meter.error_report_triggered",
      "created": "2024-09-17T06:20:52.246Z",
      "related_object": {
        "id": "mtr_test_61R9IeP0SgKbYROOx41PEAQhH0qO23oW",
        "type": "billing.meter",
        "url": "/v1/billing/meters/mtr_test_61R9IeP0SgKbYROOx41PEAQhH0qO23oW"
      }
    }
    ```

- **OpenAI** webhooks include only the ID of the object that changed, such as a response ID, and consumers call the API to retrieve the output.
- **Asana** sends compact events describing what changed, and consumers fetch the current resource from the API.
- The [Standard Webhooks](/learn-more/standards#standard-webhooks) specification describes thin payloads as an option that lets consumers fetch only the data they need, giving providers more control over access.

## Trade-offs

While this technique helps reduce webhook security requirements, it requires webhook consumers to make proprietary API calls to the webhook provider to gather details.
This adds implementation complexity for the webhook consumer and operational complexity with distributing API keys, handling REST API performance, and rate limits. A burst of events becomes a burst of API calls, so consumers should process thin events from a queue — see [Retries and Timeouts](/ops-experience/retries).

Because the consumer always fetches the current state, thin events pair naturally with the [call back the service](/best-practices/webhook-consumers) control: a forged notification can only cause the consumer to read data it is already allowed to read. Consumers should still [verify signatures](/security/hmac), since forged notifications can drive API usage and rate limits.

When the data must be in the payload but still kept confidential, Microsoft Graph's [encrypted rich notifications](/security/asymmetric-key-signatures#encrypting-payloads-with-asymmetric-keys) are the alternative.
