"use client";

import dynamic from "next/dynamic";

const FabricEditor = dynamic(() => import("./FabricEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-gray-950 text-sm text-gray-400">
      Loading editor...
    </div>
  ),
});

export function DesignEditor(props: {
  productId: string;
  variationId: string;
  qty: number;
  templateJson: string;
}) {
  return <FabricEditor {...props} />;
}