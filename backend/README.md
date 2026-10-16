<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Authentication API

- `POST /auth/login` accepts `{ "username": "...", "password": "..." }` and returns an access token plus the public user fields. The refresh token is set in the `HttpOnly` `refresh_token` cookie.
- `POST /auth/refresh` reads that cookie, rotates it, and returns a new access token.
- `POST /auth/logout` revokes the session represented by the refresh cookie and clears it. Existing access tokens remain valid until their 15 minute expiry.
- `GET /users` lists accounts (`users.read`: OWNER, ADMIN). `POST /users` creates `{ "username": "...", "password": "...", "role": "OWNER|ADMIN|CASHIER" }` (`users.create`: OWNER). `PATCH /users/:id` updates account fields under the role rules below. `PATCH /users/:id/status` accepts `{ "isActive": true|false }` and only changes cashier status (`users.update_cashier_profile`: OWNER). `DELETE /users/:id` permanently removes an account (`users.delete`: OWNER).

For `PATCH /users/:id`, OWNER and ADMIN can update only their own password. OWNER can update another ADMIN's username or password, and can fully update a CASHIER's username, password, role, and active status. ADMIN can update only a CASHIER's username and password. CASHIER cannot update accounts. Password changes revoke the target user's refresh sessions. The ACL's “name” field refers to the account username; the database has no separate display-name field.

## Authorization

Authorization uses a central permission catalog and role-to-permission mapping in `src/auth/permissions/permissions.ts`. Controllers declare required permissions with `@Permissions(...)`; `@AnyPermissions(...)` allows a route to accept one of several permissions while its service enforces the target-specific rule. `PermissionsGuard` checks these declarations against the authenticated user's role. The full catalog is defined centrally so future backend modules can use the same permission names.

Permissions do not replace resource-level checks. Services must still enforce conditions such as a cashier only accessing their own transactions or opening a shift only when assigned that day. Schedule, shift, transaction, reporting, and store-settings controllers are not implemented yet, so their catalog permissions are not attached to endpoints. Device management and device permissions are not part of this implementation.

## Inventory API

- `GET /inventory/dashboard` returns paginated stock by product and location plus total stock for `WAREHOUSE` and `DISPLAY` (`inventory.read_dashboard`: OWNER, ADMIN).
- `GET /inventory/movements` returns paginated movement history, newest first (`inventory.read_movements`: OWNER, ADMIN).
- `POST /inventory/restock` accepts `{ "productId": "...", "quantity": 10 }` and adds stock to `WAREHOUSE` (`inventory.restock`: OWNER).
- `POST /inventory/transfer-to-display` accepts `{ "productId": "...", "quantity": 3 }` and transfers stock from `WAREHOUSE` to `DISPLAY` (`inventory.transfer_to_display`: OWNER, ADMIN).

Inventory writes require an active product, a positive integer quantity, and sufficient warehouse stock for transfers. Stock changes and their movement records are written atomically. CASHIER has no inventory permissions. Sales movements are recorded when transaction processing is implemented; this API does not create sales or accept direct `SALE` movements.

Access tokens last 15 minutes. Refresh sessions have an absolute seven day lifetime; rotating a refresh token does not extend that deadline. Concurrent refresh requests are single use: only the request that atomically replaces the stored token hash succeeds. Cookies always use `SameSite=Lax` and use `Secure` in production. Refresh and logout also require the readable `csrf_token` cookie to match the `X-CSRF-Token` request header.

Set `ACCESS_TOKEN_SECRET` to a secret with at least 32 characters, along with `DATABASE_URL`, before starting the backend. Optional token lifetime settings are `ACCESS_TOKEN_TTL_SECONDS` and `REFRESH_TOKEN_TTL_SECONDS`.

Password hashes use Argon2.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Observability

In production applications, observability is essential for understanding how your system behaves, detecting issues early, and maintaining reliable performance.

[NestJS Observe](https://observe.nestjs.com) automatically instruments your NestJS application, giving you deep visibility into your system with minimal setup:

- **Distributed tracing:** Follow requests across services and understand how they flow through your system.
- **Waterfall analysis:** Visualize request execution and identify slow operations, bottlenecks, and unexpected delays.
- **Performance analysis:** Analyze application performance in real time and quickly pinpoint areas that need optimization.
- **Metrics:** Track key application and infrastructure metrics to understand system health and performance trends.
- **Logging:** Centralize and correlate logs with traces and other telemetry to make debugging easier.
- **Error tracking:** Detect errors quickly and investigate their root causes with the surrounding context.
- **SLA monitoring:** Track service-level objectives and identify when your application is approaching or exceeding defined thresholds.
- **Alarms and alerts:** Set up alerts for critical errors, performance degradation, SLA violations, and other anomalies so your team can react quickly.

To add it to this project:

```bash
$ npm install @nestjs/observe
```

Then follow the [setup guide](https://docs.nestjs.com/observability/overview) - it takes a single import and an app key.

The free plan needs no payment details and covers 300,000 events a month. You can also browse the [live demo](https://www.observe-demo.nestjs.com/dashboard) first - the whole dashboard over a busy service's data, with nothing to install.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Auto-instrument your application with [NestJS Observe](https://observe.nestjs.com). Distributed tracing, metrics, and logging made easy. Error tracking and performance monitoring for your NestJS applications.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
