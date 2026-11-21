import { NextResponse } from "next/server";
import { manageBoxOrder } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      order_id?: string;
      auto_renew?: boolean;
      paused?: boolean;
    };
    if (!body.order_id) {
      return NextResponse.json({ error: "order_id is required" }, { status: 400 });
    }
    const order = await manageBoxOrder({
      order_id: body.order_id,
      auto_renew: body.auto_renew,
      paused: body.paused,
    });
    return NextResponse.json({ order });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update subscription" },
      { status: 400 }
    );
  }
}
