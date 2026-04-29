"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCartStore } from "@/stores/cartStore";

type ProductResponse = {
  id: string;
  name: string;
  base_price: number;
};

type VariationResponse = {
  id: string;
  price_modifier: number;
};

function CanvaDesignResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addItem } = useCartStore();

  const imageUrl = searchParams.get("imageUrl");
  const productId = searchParams.get("productId");
  const variationId = searchParams.get("variationId");

  console.log("Canva design result page loaded with params:", {
    imageUrl: imageUrl ? "present" : "MISSING",
    productId: productId || "MISSING",
    variationId: variationId || "MISSING",
    fullUrl: typeof window !== "undefined" ? window.location.href : "SSR"
  });

  const [status, setStatus] = useState<"ready" | "loading" | "success" | "error">("ready");
  const [message, setMessage] = useState("");
  const [productName, setProductName] = useState("Your Design");
  const [unitPrice, setUnitPrice] = useState<number | null>(null);
  const [resolvedProductId, setResolvedProductId] = useState(productId || "");
  const [resolvedVariationId, setResolvedVariationId] = useState(variationId || "");
  const [resolvedImageUrl, setResolvedImageUrl] = useState(imageUrl || "");

  const canAddToCart = useMemo(
    () => Boolean(resolvedImageUrl && resolvedProductId && resolvedVariationId),
    [resolvedImageUrl, resolvedProductId, resolvedVariationId]
  );

  useEffect(() => {
    setResolvedProductId(productId || "");
    setResolvedVariationId(variationId || "");
    setResolvedImageUrl(imageUrl || "");
  }, [imageUrl, productId, variationId]);

  useEffect(() => {
    if (resolvedProductId && resolvedVariationId && resolvedImageUrl) return;

    async function recoverContext() {
      try {
        console.log("Attempting to recover missing context...", {
          hasProductId: !!resolvedProductId,
          hasVariationId: !!resolvedVariationId,
          hasImageUrl: !!resolvedImageUrl
        });

        const res = await fetch("/api/canva/latest-design-context");
        if (!res.ok) {
          console.error("Failed to fetch latest design context:", res.status);
          return;
        }
        const data = await res.json();
        
        console.log("Recovered context:", data);
        
        if (!resolvedProductId && data.productId) {
          console.log("Recovered productId:", data.productId);
          setResolvedProductId(data.productId);
        }
        if (!resolvedVariationId && data.variationId) {
          console.log("Recovered variationId:", data.variationId);
          setResolvedVariationId(data.variationId);
        }
        if (!resolvedImageUrl && data.imageUrl) {
          console.log("Recovered imageUrl:", data.imageUrl);
          setResolvedImageUrl(data.imageUrl);
        }
      } catch (err) {
        console.error("Context recovery error:", err);
        // Best effort recovery.
      }
    }

    recoverContext();
  }, [resolvedImageUrl, resolvedProductId, resolvedVariationId]);

  useEffect(() => {
    async function loadProductContext() {
      if (!resolvedProductId || !resolvedVariationId) {
        return;
      }

      try {
        const [productRes, variationRes] = await Promise.all([
          fetch(`/api/products/${resolvedProductId}`),
          fetch(`/api/product-variations/${resolvedVariationId}`),
        ]);

        if (!productRes.ok || !variationRes.ok) {
          return;
        }

        const productData = (await productRes.json()) as ProductResponse;
        const variationData = (await variationRes.json()) as VariationResponse;

        setProductName(productData.name || "Your Design");
        setUnitPrice((productData.base_price || 0) + (variationData.price_modifier || 0));
      } catch {
        // Keep page usable even if pricing context fails.
      }
    }

    loadProductContext();
  }, [resolvedProductId, resolvedVariationId]);

  const handleAddToCart = () => {
    if (!canAddToCart || !resolvedImageUrl || !resolvedProductId || !resolvedVariationId) {
      setStatus("error");
      setMessage("Missing product details. Please go back and try again.");
      return;
    }

    setStatus("loading");
    const resolvedPrice = unitPrice ?? 0;
    addItem({
      id: crypto.randomUUID(),
      productId: resolvedProductId,
      variationId: resolvedVariationId,
      quantity: 1,
      unitPrice: resolvedPrice,
      thumbnailDataUrl: resolvedImageUrl,
      productName,
      selectedTemplate: "canva-edit",
    });

    setStatus("success");
    setMessage("Added to cart. Redirecting...");
    router.push("/cart");
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold">Your Canva Edit Is Ready</h1>
      <p className="mt-2 text-sm text-on-surface/70">
        Review your edited design below, then add it to cart and continue to checkout.
      </p>

      {!resolvedImageUrl && (
        <div className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-red-700">
          Design preview is missing. Please retry the Canva return flow.
        </div>
      )}

      {resolvedImageUrl && (
        <div className="mt-6 flex justify-center">
          <div className="w-full max-w-md overflow-hidden rounded-lg border bg-white">
            <img src={resolvedImageUrl} alt="Edited Canva design" className="mx-auto max-h-80 w-auto object-contain" />
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          onClick={handleAddToCart}
          disabled={!canAddToCart || status === "loading"}
          className="rounded bg-primary px-5 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 hover:bg-primary/90 transition-colors"
          title={!canAddToCart ? "Missing product details" : "Add this design to your cart"}
        >
          {status === "loading" ? "Adding..." : "Add To Cart"}
        </button>
        <Link href="/" className="rounded border px-5 py-2 font-semibold hover:bg-surface-container transition-colors">
          Continue Shopping
        </Link>
      </div>

      {!canAddToCart && (
        <div className="mt-4 rounded border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          <strong>Debug Info:</strong> Missing required data to add to cart.
          <ul className="mt-1 list-inside list-disc">
            <li>Image URL: {resolvedImageUrl ? "✓" : "✗ Missing"}</li>
            <li>Product ID: {resolvedProductId ? "✓" : "✗ Missing"}</li>
            <li>Variation ID: {resolvedVariationId ? "✗ Missing" : "✓"}</li>
          </ul>
        </div>
      )}

      {status === "success" && (
        <p className="mt-3 text-green-700">{message}</p>
      )}
      {status === "error" && (
        <p className="mt-3 text-red-700">{message}</p>
      )}
    </div>
  );
}

export default function CanvaDesignResultPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading...</div>}>
      <CanvaDesignResultContent />
    </Suspense>
  );
}
