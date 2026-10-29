# HTTP security and password recovery

The backend applies Helmet headers, a shared limit of 300 requests/minute/IP across API controllers, and additional per-route auth limits. Login permits 12 requests/minute, registration 5/minute, password reset submissions 10/minute, and reset email requests 3/hour. Existing failed-login checks remain active. Sensitive auth JSON is limited to 16 KiB; profile avatars and other JSON retain the existing 10 MiB limit. Profile/account responses use `private, no-store`.

Configure these environment variables on the deployed backend:

```dotenv
FRONTEND_URL=https://your-web-domain.example
PASSWORD_RESET_FRONTEND_URL=https://your-web-domain.example
CORS_ORIGINS=https://your-web-domain.example,https://your-admin-domain.example
NODE_ENV=production
```

`PASSWORD_RESET_FRONTEND_URL` is optional when `FRONTEND_URL` already points to the public site. Production disables password recovery when its destination is HTTP, localhost, malformed, or contains credentials/query/fragment. No reset token is created and no email is sent with an invalid destination. Development still supports localhost. Verify SMTP delivery with a dedicated test mailbox before accepting the deployed flow; unit tests do not prove delivery. Google-only accounts recover their Google credentials through Google, rather than this password-email flow.

CORS uses exact configured origins. Native apps and server-to-server calls without an Origin remain supported; every protected operation still requires authentication. Development additionally permits localhost/127.0.0.1 on ports 3000, 3001 and 8082. Public API documentation is disabled in production unless `ENABLE_SWAGGER=true` is explicitly set.

`TRUST_PROXY` defaults to disabled. If a reverse proxy is used, set it to trusted proxy addresses/CIDR ranges (or Express's named range `loopback` for a local gateway). Do not use `true`, a numeric hop count, or a network range reachable directly by untrusted clients. The proxy must sanitize forwarded headers. With proxy trust disabled, clients behind a gateway share its IP bucket.

The default throttler storage is per process. Multiple replicas require a shared throttler storage implementation, such as Redis, to enforce one account of requests across replicas. Backend rate limits mitigate request abuse; they do not absorb volumetric network attacks. Deploy a managed DDoS/WAF layer, prevent direct access to the origin, configure request/body/time limits on the proxy, and verify those controls separately. A tunnel URL alone is not evidence that the complete deployment resists DDoS.

Web and app must point to the same backend/database and use the same provider identity. Premium is server-owned (`users.plan`, `premiumUntil`, `sandboxPremiumUntil`); app foreground refresh and `/mobile/account` must read the current entitlement. Updating Git does not update an already installed APK or a running backend.
