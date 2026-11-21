import { Suspense } from "react";
import { notFound } from "next/navigation";
import { SEED_RECIPES } from "@/lib/seed-data";
import { CookAlongClient } from "@/components/CookAlongClient";

export function generateStaticParams() {
  return SEED_RECIPES.map((r) => ({ slug: r.slug }));
}

async function CookContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const initialRecipe = SEED_RECIPES.find((r) => r.slug === slug);
  if (!initialRecipe) notFound();

  return <CookAlongClient slug={slug} initialRecipe={initialRecipe} />;
}

export default function CookAlongPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0D0E]" aria-busy="true" />}>
      <CookContent params={params} />
    </Suspense>
  );
}
