# Fern Labour

A monorepo for tracking labour (the childbirth kind). Includes the main tracking app, marketing site, and supporting services.

## What is this?

Fern Labour is a contraction timing app for expecting parents.

## Project structure

The project is split into apps, services, and packages. Some apps have a backend, some are just frontends. 

## Labour app

The app is deployed at [app.fernlabour.com](https://app.fernlabour.com)

React frontend with a Rust backend built on Cloudflare Workers and Durable Objects.

### Frontend

- React & TypeScript
- Vite for builds
- WebSocket connection for real-time updates

#### Backend architecture

Cloudflare Workers run at the edge across hundreds of data centers globally, so latency is low everywhere. Workers can be exposed publicly via HTTP or accessed privately through Service Bindings (which run in the same process with almost no overhead).

Durable Objects (DOs) extend this with stateful execution. Each DO has its own thread of execution and up to 10GB of durable storage. They're created on-demand and can be reached via HTTP or WebSocket.

The labour app allocates one Durable Object per labour. This gives each labour its own isolated "server" that lives in a geographically close data center, manages its own WebSocket connections to clients, and owns its data completely. Storage and compute are essentially sharded per labour (per aggregate in DDD terms).

#### Command and query design

The backend follows CQRS (Command Query Responsibility Segregation) with event sourcing:

* **Commands** execute domain logic, mutate state, and append events. They either succeed (returning `204 No Content`) or are rejected.
* **Events** are the source of truth and drive all side effects independently of the command request.
* **Queries** read from projections (materialized views derived from events).

#### Why Durable Objects are a good fit

Durable Objects align naturally with CQRS and event sourcing because they provide a *synchronous, single-threaded execution model* for the write path:

* Each Durable Object instance is addressed by a globally unique ID and executes on a **single thread**, guaranteeing strict serialisation of commands.
* Storage is **synchronous, in-process SQLite**, so reads and writes complete immediately (although some time is taken post-request for the changes to be fully durable (I don't want to get into input/output gates here)) and the command path never needs `async` or `await`.
* Because there is no asynchronous I/O in the write path, the scheduler cannot interleave other work mid-command, so state transitions and event persistence are atomic by construction.

Asynchronous work is explicitly deferred:

* An **alarm handler** runs *after* the command completes and handles side effects such as projection updates, external API calls, and WebSocket broadcasts.
* Only one alarm may run per Durable Object at a time, and failures automatically retry with exponential backoff (up to six attempts).

This cleanly separates concerns:

* **Write path**: synchronous, single-threaded, deterministic.
* **Read path / side effects**: asynchronous and eventually consistent.

#### Request flow

**Write path**

1. Client sends an HTTP POST with a command to the [API Worker](apps/labour/worker/src/api_worker)
2. [Middleware](apps/labour/worker/src/api_worker/api/middleware.rs) validates the token via the [auth-service](services/auth-service)
3. The [router](apps/labour/worker/src/api_worker/api/routes/commands.rs) extracts the `labour_id` and routes to the corresponding Durable Object
4. The DO's [fetch handler](apps/labour/worker/src/durable_object/mod.rs) receives the request
5. The [command processor](apps/labour/worker/src/durable_object/write_side/application/command_processors) checks authorization, then passes to the [aggregate](apps/labour/worker/src/durable_object/write_side/domain/aggregate.rs)
6. Events are written to the [event store](apps/labour/worker/src/durable_object/write_side/infrastructure/persistence/event_store.rs)
7. The response returns immediately (204 No Content)
8. An alarm is scheduled to run after the response sends

**Async side effects (alarm handler)**

Once the write returns, the [alarm handler](apps/labour/worker/src/durable_object/mod.rs) processes:

1. Project events into local read models (DO storage)
2. Broadcast new events to connected WebSocket clients
3. Project events into external read models (In a central D1 database for cross-labour queries)
4. Execute any policies that generate further side effects (sending notifications, API calls, etc.)
5. If new events were generated, schedule another alarm

**Read path**

Queries follow the same routing as writes but skip the event store and directly return the current read model from DO storage as JSON.

## Marketing app

Static NextJS site exported to HTML for fast load times. Currently deployed at [staging.fernlabour.com](https://staging.fernlabour.com).

Built with:
- NextJS & Typescript
- Tailwind CSS

## Admin dashboard

Admin dashboard used to track contact-us message requests and outgoing notifications.

Cassette-Futurism inspired. [Demo here](https://admin-demo.kgdev.me/)

## Services

### Notification service

Reuses the Worker/DO CQRS pattern as the labour app. It was my test of the architecture's suitability, it also works just fine.

Three workers handle different concerns:

- **Notification**: Core logic and the NotificationAggregate DO
- **Generation**: Accepts templates and outputs HTML emails or SMS/WhatsApp messages
- **Dispatch**: Routes notifications to Resend (email) or Twilio (SMS/WhatsApp) and handles delivery webhooks

The key difference with the Notification DO is that all read models are projected off the durable object to a central D1 read model database. This is because sharding notification state per aggregate is, let's be honest, completely deranged.

It could, quite possibly, be the most mid-level overengineered way to send an email imaginable.

### User service

Queries user data from Clerk. It's the lazy option (avoids building custom authentication).

### Auth service

Validates auth tokens from multiple issuers (multi-tenant support). Supports:
- Clerk JWT tokens
- Custom service tokens

### Contact service

Boring state based worker that stores contact messages in D1 and alerts me on slack.
