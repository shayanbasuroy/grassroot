import { NextResponse } from "next/server";
import { submitCookFeedback } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      recipe_id?: string;
      rating?: "too_easy" | "just_right" | "tricky";
      keep_next_week?: boolean;
    };
    if (!body.recipe_id || !body.rating) {
      return NextResponse.json(
        { error: "recipe_id and rating are required" },
        { status: 400 }
      );
    }
    const feedback = await submitCookFeedback({
      recipe_id: body.recipe_id,
      rating: body.rating,
      keep_next_week: body.keep_next_week ?? true,
    });
    return NextResponse.json({ feedback }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save feedback" },
      { status: 400 }
    );
  }
}
