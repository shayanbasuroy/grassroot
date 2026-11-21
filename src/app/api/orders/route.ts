import { NextResponse } from "next/server";
import { createBoxOrder } from "@/lib/store";
import type { PaymentMethod, PlanTier } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      condo_id: string;
      customer_name: string;
      customer_phone: string;
      unit_no: string;
      plan_tier: PlanTier;
      items: { recipe_id: string; portions: number }[];
      addons?: { addon_id: string; qty: number }[];
      payment_method?: PaymentMethod;
      auto_renew?: boolean;
    };

    if (
      !body.condo_id ||
      !body.customer_name?.trim() ||
      !body.customer_phone?.trim() ||
      !body.unit_no?.trim() ||
      !body.plan_tier
    ) {
      return NextResponse.json(
        { error: "All checkout fields are required" },
        { status: 400 }
      );
    }

    const order = await createBoxOrder({
      condo_id: body.condo_id,
      customer_name: body.customer_name,
      customer_phone: body.customer_phone,
      unit_no: body.unit_no,
      plan_tier: body.plan_tier,
      items: body.items || [],
      addons: body.addons || [],
      payment_method: body.payment_method || "billplz_fpx",
      auto_renew: body.auto_renew ?? true,
    });
    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to place box order" },
      { status: 400 }
    );
  }
}
