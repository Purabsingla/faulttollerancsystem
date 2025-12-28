// app/page.tsx
"use client";
import { useState, useEffect } from "react";

export default function Page() {
  const [input, setInput] = useState(
    `{ "source": "A", "payload": { "amount": 100, "metric": "click" } }`
  );
  const [fail, setFail] = useState(false);
  const [log, setLog] = useState("");
  const [stats, setStats] = useState<any>(null);

  const refresh = () =>
    fetch("/api/events")
      .then((r) => r.json())
      .then(setStats);

  useEffect(() => {
    refresh();
  }, []);

  const submit = async () => {
    try {
      const body = JSON.parse(input);
      if (fail) body.simulate_failure = true; // Inject failure flag

      const res = await fetch("/api/events", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const data = await res.json();
      setLog(
        res.ok ? `Success: ${JSON.stringify(data)}` : `Error: ${data.details}`
      );
      refresh();
    } catch (e: any) {
      setLog(e.message);
    }
  };

  return (
    <div className="p-10 font-sans max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-5">Ingestion System</h1>

      {/* INPUT */}
      <div className="mb-5 border p-5 rounded bg-gray-50">
        <textarea
          className="w-full h-32 p-2 border"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="mt-2 flex gap-4">
          <label className="text-red-600 font-bold">
            <input
              type="checkbox"
              checked={fail}
              onChange={(e) => setFail(e.target.checked)}
            />{" "}
            Simulate Crash
          </label>
          <button
            onClick={submit}
            className="bg-black text-white px-4 py-1 rounded"
          >
            Send Event
          </button>
        </div>
        <div className="mt-2 text-sm text-gray-600">{log}</div>
      </div>

      {/* STATS */}
      <div className="border p-5 rounded">
        <h2 className="font-bold text-lg">Live Stats</h2>
        {stats && (
          <div>
            <p className="text-xl">
              Count: {stats.count} | Total: {stats.total_amount}
            </p>
            <pre className="bg-gray-100 p-2 mt-2 text-xs">
              {JSON.stringify(stats.events, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
