Fault-Tolerant Data Processing System

This is a Fault-Tolerant Data Processing System built with Next.js and TypeScript. It is designed to ingest unreliable data from multiple clients, normalize it, deduplicate events using content-based hashing, and handle partial failures gracefully.

🚀 Getting Started

First, install the dependencies:

npm install

# or

yarn install

Then, run the development server:

npm run dev

# or

yarn dev

Open http://localhost:3000 with your browser to see the result.

The application includes a built-in dashboard where you can manually send events, toggle failure simulations, and view live aggregated stats.

📋 Assignment Deliverables & Design Decisions

Below are the specific answers to the design questions required for the assignment.

1. What assumptions did you make?

Identity via Content: Since clients do not provide a guaranteed unique ID, I assumed that Identity = Content. If two JSON payloads contain the exact same data (even if keys are in a different order), they are treated as the same event.

Schema Flexibility: I assumed that clients might use various keys for the same data concepts. The normalization layer heuristically maps keys like amt, value, or cost to a standardized amount field.

Persistence: Given the 60-minute constraint, I assumed an In-Memory Singleton Store (globalThis) is acceptable to demonstrate the architecture and logic, rather than setting up a persistent external database like PostgreSQL or MongoDB.

2. How does your system prevent double counting?

I implemented Content-Based Deduplication using cryptographic hashing. The process is as follows:

Canonicalization: When an event arrives, the JSON keys are sorted alphabetically. This ensures that { "a": 1, "b": 2 } generates the same signature as { "b": 2, "a": 1 }.

Hashing: A SHA-256 hash is generated from this stable string string.

Lookup: Before processing, this hash is checked against a Set of previously processed hashes.

Action: If the hash exists, the system returns a 200 OK (Idempotent success) but internally skips the aggregation logic.

3. What happens if the database fails mid-request?

The system is designed to maintain Atomicity to prevent "ghost records":

The system first normalizes and validates the incoming data.

It then attempts the write operation (this is where the "Simulate Failure" toggle triggers an error).

Crucially, the "Deduplication Hash" is only saved to the tracking Set after a successful write.

Result: If the database fails mid-request, the hash is never saved. When the client retries the request later, the Deduplication Check sees it as "new" and allows it to proceed. This prevents valid data from being permanently rejected as a duplicate due to a previous failed attempt.

4. What would break first at scale?

Memory (RAM) is the primary bottleneck in this implementation.

The Problem: The current implementation stores every normalized event and every deduplication hash in the Node.js process memory. As the volume of events grows, the application will eventually hit the V8 Heap Limit and crash with an Out Of Memory (OOM) error.

The Distributed Problem: If this application were deployed across multiple server instances (e.g., Kubernetes pods), the local in-memory sets would not share state. Instance A would not know that Instance B already processed a specific event, leading to potential duplicates.

The Fix:

Move the deduplication state (hashes) to a shared, high-performance Key-Value store like Redis.

Move the event storage to a persistent SQL database or Data Warehouse (e.g., Snowflake, BigQuery).
