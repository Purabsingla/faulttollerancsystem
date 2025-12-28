// lib/dataSystem.ts
import crypto from "crypto";

// --- TYPES ---
export interface RawEvent {
  source?: string;
  client?: string;
  payload?: any;
  simulate_failure?: boolean;
  [key: string]: any;
}

export interface NormalizedEvent {
  client_id: string;
  metric: string;
  amount: number;
  timestamp: string;
  original_hash: string;
}

// --- IN-MEMORY DATABASE (Persists in Next.js Dev Mode) ---
const globalStore = globalThis as any;
if (!globalStore.dataStore) {
  globalStore.dataStore = {
    events: [] as NormalizedEvent[],
    hashes: new Set<string>(), // Fast lookup for duplicates
  };
}

// --- HELPER 1: Generate Hash (Deduplication) ---
function generateHash(data: any) {
  // Sort keys so {a:1, b:2} produces same hash as {b:2, a:1}
  const stableString = JSON.stringify(data, Object.keys(data).sort());
  return crypto.createHash("sha256").update(stableString).digest("hex");
}

// --- HELPER 2: Normalize Data (Clean it up) ---
function normalize(raw: RawEvent, hash: string): NormalizedEvent {
  const p = raw.payload || {};

  // Try different field names for "Amount"
  const rawAmt = p.amount ?? p.amt ?? p.value ?? 0;
  // Try different field names for "Time"
  const rawTime =
    p.timestamp ?? p.created_at ?? p.date ?? new Date().toISOString();

  return {
    client_id: raw.source || raw.client || "unknown",
    metric: p.metric || "default",
    amount: parseFloat(String(rawAmt)) || 0,
    timestamp: new Date(rawTime).toISOString(),
    original_hash: hash,
  };
}

// --- MAIN FUNCTION ---
export function processEvent(raw: RawEvent, simulateFail: boolean) {
  const hash = generateHash(raw);

  // 1. CHECK DUPLICATE
  if (globalStore.dataStore.hashes.has(hash)) {
    return { status: "skipped", msg: "Duplicate detected" };
  }

  // 2. NORMALIZE
  const cleanEvent = normalize(raw, hash);

  // 3. SIMULATE DB CRASH
  if (simulateFail) {
    throw new Error("Simulated Database Failure!");
  }

  // 4. SAVE (Atomic-ish)
  globalStore.dataStore.events.push(cleanEvent);
  globalStore.dataStore.hashes.add(hash);

  return { status: "success", data: cleanEvent };
}

// --- GET STATS FUNCTION ---
export function getSystemStats() {
  const events = globalStore.dataStore.events;
  return {
    count: events.length,
    total_amount: events.reduce((acc: number, cur: any) => acc + cur.amount, 0),
    events: events.slice(-5).reverse(), // Show last 5
  };
}
