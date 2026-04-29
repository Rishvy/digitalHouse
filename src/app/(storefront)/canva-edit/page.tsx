"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface BrandTemplate {
  id: string;
  name: string;
  thumbnail_url: string;
}

export default function CanvaEditPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get("productId");
  const variationId = searchParams.get("variationId");
  
  const [templates, setTemplates] = useState<BrandTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  
  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch("/api/canva/templates");
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch templates");
        }
        
        setTemplates(data.templates || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchTemplates();
  }, []);
  
  async function handleStartEditing() {
    if (!selectedTemplate || !productId || !variationId) {
      setError("Please select a template");
      return;
    }
    
    try {
      setLoading(true);
      
      // Create design from brand template
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Please log in");
      }
      
      // Call Canva API to create design from template
      const createRes = await fetch("/api/canva/create-design", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          brandTemplateId: selectedTemplate,
        }),
      });
      
      const createData = await createRes.json();
      
      if (!createRes.ok) {
        throw new Error(createData.error || "Failed to create design");
      }
      
      const designId = createData.design_id;
      const returnNavUri = `${window.location.origin}/api/canva/return-nav?productId=${productId}&variationId=${variationId}`;
      
      // Redirect to Canva Editor
      window.location.href = `https://www.canva.com/design/${designId}/edit?returnTo=${encodeURIComponent(returnNavUri)}`;
      
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Loading Canva templates...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="text-red-500 text-4xl mb-4">✗</div>
        <h2 className="text-xl font-semibold mb-2">Error</h2>
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 rounded bg-primary px-4 py-2 text-white"
        >
          Go Back
        </button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Select a Canva Template</h1>
      
      {templates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-foreground/60">No brand templates found in your Canva account.</p>
          <p className="text-sm text-foreground/40 mt-2">Please install brand templates from your Canva account first.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {templates.map((template) => (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`cursor-pointer rounded-lg border-2 overflow-hidden transition-all ${
                  selectedTemplate === template.id
                    ? "border-primary shadow-lg"
                    : "border-foreground/10 hover:border-foreground/30"
                }`}
              >
                <img
                  src={template.thumbnail_url}
                  alt={template.name}
                  className="w-full aspect-square object-cover"
                />
                <div className="p-3">
                  <p className="text-sm font-semibold truncate">{template.name}</p>
                </div>
              </div>
            ))}
          </div>
          
          <button
            onClick={handleStartEditing}
            disabled={!selectedTemplate || loading}
            className="w-full rounded-lg bg-[#00c4cc] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[#00c4cc]/90 disabled:opacity-50"
          >
            Start Editing in Canva
          </button>
        </>
      )}
    </div>
  );
}
