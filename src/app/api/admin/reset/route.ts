import { NextResponse } from "next/server";
import { resetDemoState } from "@/lib/store";

export async function POST() {
  try {
    await resetDemoState();
    return NextResponse.json({ ok: true, message: "Demo state reset cleanly" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to reset state" },
      { status: 500 }
    );
  }
}
