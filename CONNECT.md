# CONNECT.md

## Project: Judge0 Async Execution + Fallback + Realtime Scoring (Antigravity Plan)

This document describes how to evolve the current Judge0-based execution service into a **resilient, async, realtime, fault-tolerant execution platform** with:

* Judge0 fallback support
* Async submission + polling
* Realtime score streaming via Supabase Realtime
* API endpoints for clients
* Resilience against network / node failures

---

## 1. Architecture Overview

Flow:

Client → API Server → Judge0 Cluster → API Server → Supabase Realtime → Client

Main components:

* **API Server (Node / Next / Express)**
* **Judge0 (self-hosted or API fallback)**
* **Supabase (Postgres + Realtime)**
* **Redis (optional queue)**

---

## 2. Async Execution Model

Instead of blocking on Judge0:

1. Client submits code.
2. Server sends async request to Judge0.
3. Server returns a `submission_id` immediately.
4. Server polls Judge0 in background.
5. Result is saved in Supabase.
6. Supabase Realtime pushes updates to clients.

This prevents server overload and enables scaling.

---

## 3. Judge0 Fallback Strategy

### Environment Config

```env
JUDGE0_URLS=http://localhost:2358,http://backup:2358
```

### Behavior

* URLs parsed into array.
* On submit, iterate URLs.
* Timeout each call (AbortController).
* On failure → try next.
* Log selected instance.

### Failure Conditions

Retry on:

* Network error
* Timeout
* HTTP >= 500

Do NOT retry on:

* 4xx

---

## 4. Async + Polling Strategy

### Submit Phase

* POST /api/execute
* Create DB row: `status = queued`
* Send code to Judge0.
* Save Judge0 token.
* Return job_id.

### Poll Phase

Worker loop:

* Every 1–2 seconds:
* GET /submissions/{token}
* If status < 3 → continue
* Else → store output

### States

| Status  | Meaning   |
| ------- | --------- |
| queued  | waiting   |
| running | executing |
| done    | finished  |
| error   | failed    |

---

## 5. Supabase Realtime Setup

### Table

```sql
create table executions (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  language text,
  code text,
  status text,
  score int,
  stdout text,
  stderr text,
  created_at timestamptz default now()
);
```

Enable realtime:

```sql
alter publication supabase_realtime add table executions;
```

---

## 6. Saving Scores

After Judge0 result:

* Parse stdout
* Compute score
* Update Supabase

Example logic:

* AC → 100
* WA → 30
* TLE → 0

---

## 7. Realtime Client Subscription

Client subscribes:

* Channel: executions
* Filter by user_id or job_id

Client receives:

* status updates
* stdout
* score

---

## 8. API Endpoints

### POST /api/execute

Request:

```json
{ "code": "...", "lang": "python" }
```

Response:

```json
{ "job_id": "uuid" }
```

---

### GET /api/status/:id

Returns:

```json
{ "status": "running", "score": 50 }
```

---

### GET /api/stream/:id

* SSE stream
* Push updates

---

## 9. Worker Loop

Recommended:

* Separate worker service
* Poll Judge0
* Update Supabase
* Broadcast realtime

Can be cron / bullmq / background thread.

---

## 10. Scaling Plan

* Multiple Judge0 workers
* Redis queue
* Horizontal API nodes
* Stateless API

---

## 11. Failure Handling

| Problem     | Solution          |
| ----------- | ----------------- |
| Judge0 down | fallback URLs     |
| Node crash  | jobs stored in DB |
| Network     | retry + timeout   |
| Overheat    | async + queue     |

---

## 12. Security

* Rate limit
* Sandbox containers
* CPU limits
* Memory limits

---

## 13. Next Steps

* Implement submitWithFallback()
* Add polling worker
* Create Supabase schema
* Add realtime subscription
* Build SSE endpoint

---

## 14. Goal

Transform Judge0 from a blocking API into a **distributed async execution fabric** similar to Google Antigravity architecture: resilient, realtime, observable, and scalable.

---

End of CONNECT.md
