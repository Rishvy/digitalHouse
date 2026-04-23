"use client";

import dynamic from "next/dynamic";

const VistaEditor = dynamic(() => import("./VistaEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-surface text-sm text-on-surface/60">
      Loading design editor…
    </div>
  ),
});

export function DesignEditor(props: {
  productId: string;
  variationId: string;
  qty: number;
  templateJson: string;
}) {
  return <VistaEditor {...props} />;
}
