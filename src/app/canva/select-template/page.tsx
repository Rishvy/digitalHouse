"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense, useEffect } from "react";
import TemplateSelector from "@/components/canva/TemplateSelector";
import { useTemplateSelection } from "@/lib/canva/template-selection";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function TemplateSelectionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  const category = searchParams.get("category") || "business_cards";
  const productId = searchParams.get("productId") || undefined;
  const variationId = searchParams.get("variationId") || undefined;

  // Get user ID from session
  useEffect(() => {
    async function getUserId() {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id);
    }
    getUserId();
  }, []);

  // Use deep module - hides template fetching, OAuth URL construction
  const { templates, loading, error, startWithTemplate } = useTemplateSelection(
    category,
    { userId, productId, variationId }
  );

  const handleTemplateSelect = async (templateId: string | null) => {
    if (!userId) {
      alert("Please log in to continue");
      return;
    }

    setIsProcessing(true);

    try {
      // Get OAuth URL from deep module
      const oauthUrl = startWithTemplate(templateId);
      
      // Redirect to OAuth flow
      router.push(oauthUrl);
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
        templates={templates}
        loading={loading}
        error={error}
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
