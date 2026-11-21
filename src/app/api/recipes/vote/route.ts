import { NextResponse } from "next/server";
import { voteRecipe } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { recipe_id?: string };
    if (!body.recipe_id) {
      return NextResponse.json({ error: "recipe_id is required" }, { status: 400 });
    }
    const result = await voteRecipe(body.recipe_id);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to vote" },
      { status: 400 }
    );
  }
}
