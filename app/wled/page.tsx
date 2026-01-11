import * as React from "react";
import { Suspense } from "react";
import WledPageClient from "@/app/wled/wled-page-client";

export default function WledPage() {
  return (
    <Suspense fallback={<div className="p-6 text-muted-foreground">Loading…</div>}>
      <WledPageClient />
    </Suspense>
  );
}
