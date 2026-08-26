import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalDoc } from "@/components/legal/LegalDoc";
import { LEGAL_DOCS, type LegalDocId } from "@/lib/mocks/legalDoc";

export const metadata: Metadata = {
  title: "Privacy & Terms - Nevo",
};

// `Nevo Legal Doc` - Privacy Policy and Terms of Service, the destinations
// behind the activation consent line.
// Next.js 16: `params` is a Promise and must be awaited.
export default async function LegalPage({
  params,
}: {
  params: Promise<{ doc: string }>;
}) {
  const { doc } = await params;
  if (!(doc in LEGAL_DOCS)) notFound();
  return <LegalDoc doc={doc as LegalDocId} />;
}
