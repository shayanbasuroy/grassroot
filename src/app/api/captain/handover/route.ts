import { NextResponse } from "next/server";
import { verifyCaptainHandover } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      token_or_order_id?: string;
      mark_late?: boolean;
    };
    if (!body.token_or_order_id?.trim()) {
      return NextResponse.json(
        { error: "Pickup QR token or Box ID is required" },
        { status: 400 }
      );
    }
    const order = await verifyCaptainHandover({
      token_or_order_id: body.token_or_order_id,
      mark_late: Boolean(body.mark_late),
    });
    return NextResponse.json({ order });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to verify handover" },
      { status: 400 }
    );
  }
}
