// app/api/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { processEvent, getSystemStats } from "@/lib/dataSystem";

// POST: Accepts data from clients
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Separate the "simulation flag" from the actual data
    const simulateFail = body.simulate_failure === true;
    const { simulate_failure, ...realData } = body;

    const result = processEvent(realData, simulateFail);

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Internal Server Error", details: err.message },
      { status: 500 }
    );
  }
}

// GET: Returns the dashboard stats
export async function GET() {
  const stats = getSystemStats();
  return NextResponse.json(stats, { status: 200 });
}
