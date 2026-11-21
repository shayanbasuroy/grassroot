import { NextResponse } from "next/server";
import { connection } from "next/server";
import { getAppState } from "@/lib/store";

export async function GET() {
  await connection();
  try {
    const state = await getAppState();
    return NextResponse.json(state);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load state" },
      { status: 500 }
    );
  }
}
