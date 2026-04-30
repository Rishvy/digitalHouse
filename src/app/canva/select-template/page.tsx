"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import TemplateSelector from "@/components/canva/TemplateSelector";

function TemplateSelectionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const category = searchParams.get("category") || "business_cards";
  const productId = searchParams.get("productId") || undefined;
  const variationId = searchParams.get("variationId") || undefined;

  const handleTemplateSelect = async (templateId: string | null) => {
    setIsProcessing(true);

    try {
      // Build the OAuth authorize URL with template selection
      const params = new URLSearchParams();
      if (productId) params.set("productId", productId);
      if (variationId) params.set("variationId", variationId);
      if (templateId) params.set("templateId", templateId);

      // Redirect to OAuth flow
      router.push(`/api/canva/oauth/authorize?${params.toString()}`);
    } catch (error) {
      console.error("Error starting OAuth flow:", error);
      setIsProcessing(false);
      alert("Failed to start design editor. Please try again.");
    }
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-700">Starting Canva Editor...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <TemplateSelector
        category={category}
        productId={productId}
        variationId={variationId}
        onSelect={handleTemplateSelect}
      />
    </div>
  );
}

export default function TemplateSelectionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <TemplateSelectionContent />
    </Suspense>
  );
}
