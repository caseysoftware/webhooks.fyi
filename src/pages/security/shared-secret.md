---
title: Shared Secret
description: Learn how webhook providers implement shared secrets — Basic Authentication, Shared Credentials, or Verification Tokens — to secure webhook communications.
--- 

{% table %}
---
* **Complexity**
* - Very Low
---
* **Pros**
* - Authentication with Low Complexity
---
* **Caveats**
* - No message integrity and confidentiality controls
  - Requires HTTPS to keep credentials secret
---
* **Examples**
* - [Datadog](https://docs.datadoghq.com/integrations/webhooks/#authentication)
  - [DocuSign](https://developers.docusign.com/platform/webhooks/connect/validation-and-security/)
  - [GitLab](https://docs.gitlab.com/user/project/integrations/webhooks/) (`X-Gitlab-Token`)
  - [Microsoft Graph](https://learn.microsoft.com/en-us/graph/change-notifications-delivery-webhooks) (`clientState`)
  - [mParticle](https://docs.mparticle.com/integrations/webhook/event/)
  - [Okta Event Hooks](https://developer.okta.com/docs/concepts/event-hooks/#one-time-verification-request)
  - [VMWare WorkspaceOne](https://docs.vmware.com/en/VMware-Workspace-ONE-UEM/services/System_Settings_On_Prem/GUID-AWT-SYSTEM-ADVANCED-API-NOTIF.html)
{% /table %}

---

In our research, 10% of the webhook providers use Shared Secrets — in the form of Basic Authentication, shared credentials, bearer tokens, or a verification token — for authentication. In this method, the webhook provider and listener share a common secret used exclusively to authenticate webhook requests:

1. On webhook requests, the provider sends a webhook notification containing the message plus a shared secret in a pre-defined header variable or the Authorization header using the Basic Auth format ( `Authorization: Basic <"username:password" in base64>` ):

    ```js
    // Compare secrets in constant time to avoid leaking them through response timing
    const safeEqual = (a, b) => {
      const bufA = Buffer.from(a || '', 'utf8')
      const bufB = Buffer.from(b || '', 'utf8')
      return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB)
    }

    app.post('/webhook', (req, res) => {
      
      // get authorization header (Basic <value>)
      const b64auth = (req.headers.authorization || '').split('Basic ')[1] || ''
      // Get login and password
      const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':')

      // Verify login and password are present and correct
      if (login && password && 
          safeEqual(login, process.env.WEBHOOK_LOGIN) && 
          safeEqual(password, process.env.WEBHOOK_PW)) {
        // Webhook Authenticated 
        // process and respond...
        res.json({ message: "Success" })
      }else{
        res.status(401).send('Authentication required.')
      }
    })
    ```

2. The webhook listener validates the value in the request versus the shared secret. Only requests with the correct secret are processed.

{% diagram-shared-secret / %} 

_Basic Authentication, or shared credentials, or verification token on webhook requests_

This security method addresses only the webhook service authentication and does not implement any control on message integrity. Even with HTTPS, the shared secret is processed in clear text, increasing the risk of the secret getting compromised.

Therefore, their use should be avoided in production or used only with compensatory controls — such as IP Restrictions and callback requests — to mitigate risks. See [Best Practices for Webhook Consumers](/best-practices/webhook-consumers).

## Providers are moving away from shared secrets

Several providers that started with shared secrets have since added [HMAC signatures](/security/hmac):

- **GitLab** sends the configured secret in the `X-Gitlab-Token` header, but now says the secret token is ["not recommended for new webhooks"](https://docs.gitlab.com/user/project/integrations/webhooks/). Its signing tokens follow the [Standard Webhooks](/learn-more/standards#standard-webhooks) specification, and both can be configured at once during migration.
- **Zoom** replaced its plaintext verification token with HMAC-SHA256 signatures and a [URL validation challenge](/security/one-time-verification-challenge) — see [Zoom](/webhook-directory/zoom).
- **Slack** sends a `token` with its URL verification handshake, but now marks it deprecated in favor of [signing secrets](/webhook-directory/slack).

{% callout title="Note" %}
   Some services offer basic auth as a quick option for development and unit testing, alongside more robust security controls for production usage. [DocuSign](https://developers.docusign.com/platform/webhooks/connect/validation-and-security/), for example, offers basic authentication, Request Signatures with HMAC and Mutual TLS, and encourages the use of HMAC and mTLS in production use-cases.
{% /callout %}
