"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCartStore } from "@/stores/cartStore";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function CanvaDesignResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addItem } = useCartStore();
  
  const designId = searchParams.get("designId");
  const productId = searchParams.get("productId");
  const variationId = searchParams.get("variationId");
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
   
  useEffect(() => {
    async function processDesign() {
      if (!designId || !productId || !variationId) {
        setStatus("error");
        setMessage("Missing required parameters");
        return;
      }
       
      try {
        // Export design from Canva
        const exportRes = await fetch(`/api/canva/export-design?designId=${designId}`);
        const exportData = await exportRes.json();
         
        if (!exportRes.ok) {
          throw new Error(exportData.error || "Failed to export design");
        }
         
        const { imageUrl } = exportData;
         
        if (!imageUrl) {
          throw new Error("No image URL returned");
        }
         
        // Fetch the image and upload to Supabase Storage
        const imageRes = await fetch(imageUrl);
        const imageBlob = await imageRes.blob();
        const fileName = `canva-design-${Date.now()}.png`;
         
        const supabase = createSupabaseBrowserClient();
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("customer-uploads")
          .upload(fileName, imageBlob, {
            contentType: "image/png",
            upsert: false,
          });
           
        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }
         
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from("customer-uploads")
          .getPublicUrl(uploadData.path);
       
        // Get product and variation details
        const productRes = await fetch(`/api/products/${productId}`);
        const productData = await productRes.json();
         
        const variationRes = await fetch(`/api/product-variations/${variationId}`);
        const variationData = await variationRes.json();
         
        // Add to cart
        addItem({
          id: crypto.randomUUID(),
          productId,
          variationId,
          quantity: 1,
          unitPrice: variationData.price_modifier + productData.base_price,
          thumbnailDataUrl: publicUrl,
          productName: productData.name,
          selectedTemplate: "canva-edit",
        });
         
        setStatus("success");
        setMessage("Design added to cart successfully!");
         
        // Redirect to cart after 2 seconds
        setTimeout(() => {
          router.push("/cart");
        }, 2000);
         
      } catch (err: unknown) {
        setStatus("error");
        if (err instanceof Error) {
          setMessage(err.message);
        } else {
          setMessage("Failed to process design");
        }
      }
    }
     
    processDesign();
  }, [designId, productId, variationId, addItem, router]);
   
  return (
    <div className="container mx-auto px-4 py-8 text-center">
      {status === "loading" && (
        <div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Processing your Canva design...</p>
        </div>
      )}
       
      {status === "success" && (
        <div>
          <div className="text-green-500 text-4xl mb-4">✓</div>
          <h2 className="text-xl font-semibold mb-2">{message}</h2>
          <p>Redirecting to cart...</p>
        </div>
      )}
       
      {status === "error" && (
        <div>
          <div className="text-red-500 text-4xl mb-4">✗</div>
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-red-500">{message}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 rounded bg-primary px-4 py-2 text-white"
          >
            Go Back
          </button>
        </div>
      )}
    </div>
  );
}

export default function CanvaDesignResultPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 text-center">Loading...</div>}>
      <CanvaDesignResultContent />
    </Suspense>
  );
}