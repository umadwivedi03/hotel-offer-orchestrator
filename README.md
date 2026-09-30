# Hotel Offer Orchestrator

Node.js + TypeScript + Express + Temporal + Redis + Docker Compose implementation of a hotel-offer aggregation workflow.

## Architecture

```text
Client
  |
  v
Express API :3000
  |
  | starts Temporal Workflow
  v
Temporal Server :7233
  |
  v
Temporal Worker
  |---- parallel Activity ---> Supplier A (/supplierA/hotels)
  |---- parallel Activity ---> Supplier B (/supplierB/hotels)
  |
  v
Deduplicate by hotel name + choose cheapest offer
  |
  v
API saves result to Redis
  |
  v
Redis Sorted Set (price index) + JSON records
  |
  v
ZRANGEBYSCORE price filter
  |
  v
Client JSON
```

## Requirements

- Docker Desktop / Docker Engine + Compose
- Node.js 22+ for local development

## Run with Docker

```bash
docker compose up --build
```

API: http://localhost:3000

## Test

```bash
curl "http://localhost:3000/api/hotels?city=delhi"
curl "http://localhost:3000/api/hotels?city=delhi&minPrice=5000&maxPrice=6000"
curl "http://localhost:3000/health"
```

## Expected Delhi behavior

Supplier A has Holtin at 6000 and Supplier B has Holtin at 5340, so Holtin is returned from Supplier B. Radison is returned from Supplier A because 5900 is cheaper than 6200. Unique hotels such as Taj Palace and Imperial are retained.

## Redis filtering

The worker/API saves each final hotel as a JSON value and adds its ID to a Redis Sorted Set scored by price:

- `hotels:<city>:price` -> sorted set
- `hotel:<city>:<hotel>` -> JSON

Filtering uses Redis `ZRANGEBYSCORE`, so the application does not fetch the entire list and filter it in JavaScript.

## Temporal details

Supplier calls are implemented as Temporal Activities. The workflow schedules both activities concurrently with `Promise.allSettled`. The comparison/deduplication logic is deterministic workflow code. If one supplier is temporarily unavailable, its result is treated as empty and the other supplier can still produce offers. If both fail, the workflow fails.

## Local development

Start Redis and Temporal separately, then:

```bash
npm install
npm run build
npm run dev
```

Set environment variables from `.env.example` as needed. For local API/worker, use `TEMPORAL_ADDRESS=localhost:7233`, `REDIS_URL=redis://localhost:6379`, and supplier URLs pointing to `http://localhost:3000/...`.

## Postman

The repository includes `Hotel-Offer-Orchestrator.postman_collection.json` covering normal aggregation, Redis price filtering, no-result city, both mock suppliers, and health.

## Failure simulation

For a real deployment, put a feature flag or test-only endpoint in front of a supplier failure. For example, changing `SUPPLIER_A_URL` to an unavailable host in the worker container simulates Supplier A being down. The workflow's `allSettled` behavior allows Supplier B results to continue.
