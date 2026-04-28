"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/pricing/calculatePrice";
import { useCartStore } from "@/stores/cartStore";
import { Upload, X, Image, AlertCircle } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clear, updateItem } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingForItem, setUploadingForItem] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pinCode: "",
    phone: "",
  });

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [items]);
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createSupabaseBrowserClient();
      const sb = supabase as any;
      const { data } = await sb.auth.getUser();
      if (!data.user) {
        router.replace("/auth/login?redirectTo=/checkout");
        return;
      }
      setReady(true);
    };
    void checkAuth();
  }, [router]);

  if (!ready) {
    return <div className="mx-auto max-w-7xl px-4 py-8">Checking your session...</div>;
  }

  const gst = subtotal * 0.18;
  const total = subtotal + gst;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, itemId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingForItem(itemId);
    setUploadError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const sb = supabase as any;
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${itemId}-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await sb
        .storage
        .from('products')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = sb.storage.from('products').getPublicUrl(fileName);
      
      updateItem(itemId, { thumbnailDataUrl: publicUrl });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingForItem(null);
    }
  };

  const removeArtwork = (itemId: string) => {
    updateItem(itemId, { thumbnailDataUrl: null });
  };

  const submit = async () => {
    // Check if all items have artwork
    const itemsWithoutArtwork = items.filter(item => !item.thumbnailDataUrl);
    if (itemsWithoutArtwork.length > 0) {
      setUploadError(`Please upload artwork for: ${itemsWithoutArtwork.map(i => i.productName || 'item').join(', ')}`);
      return;
    }

    setUploadError(null);
    setLoading(true);

    const response = await fetch("/api/orders/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shippingAddress: {
          fullName: form.fullName,
          addressLine1: form.addressLine1,
          addressLine2: form.addressLine2 || undefined,
          city: form.city,
          state: form.state,
          pinCode: form.pinCode,
          phone: form.phone,
        },
        subtotal,
        taxAmount: gst,
        totalAmount: total,
        items: items.map((item) => ({
          productId: item.productId,
          variationId: item.variationId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          artworkUrl: item.thumbnailDataUrl,
        })),
      }),
    });

    const body = await response.json();
    setLoading(false);
    if (!response.ok) {
      setUploadError(body.error || "Failed to create order");
      return;
    }

    clear();
    router.push(`/orders/${body.orderId}/confirmation`);
  };

  return (
    <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 md:grid-cols-[1fr_380px] md:px-8 md:py-8">
      <div className="space-y-6 order-2 md:order-1">
        {/* Artwork Upload Section */}
        <div className="rounded-xl bg-surface-container p-5">
          <h2 className="text-lg font-bold mb-4">Upload Your Artwork</h2>
          <p className="text-sm text-foreground/60 mb-4">
            Upload print-ready files (PNG, JPG, PDF) for each item. Ensure 300 DPI for best quality.
          </p>
          
          {uploadError && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-50 text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {uploadError}
            </div>
          )}

          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 rounded-lg bg-surface-container-low">
                <div className="w-20 h-20 rounded-lg bg-foreground/5 overflow-hidden shrink-0">
                  {item.thumbnailDataUrl ? (
                    <img src={item.thumbnailDataUrl} alt="Artwork" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="h-8 w-8 text-foreground/20" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.productName || "Custom Product"}</p>
                  <p className="text-xs text-foreground/50">Qty: {item.quantity}</p>
                </div>

                <div className="flex items-center gap-2">
                  {item.thumbnailDataUrl ? (
                    <button
                      type="button"
                      onClick={() => removeArtwork(item.id)}
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingForItem === item.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 disabled:opacity-50"
                    >
                      {uploadingForItem === item.id ? (
                        <>Uploading...</>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Upload
                        </>
                      )}
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,application/pdf"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, item.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Address */}
        <div className="rounded-xl bg-surface-container p-5">
          <h2 className="text-lg font-bold mb-4">Shipping Address</h2>
          <div className="grid gap-3">
            {["fullName", "addressLine1", "addressLine2", "city", "state", "pinCode", "phone"].map((field) => (
              <input
                key={field}
                placeholder={field.replace(/([A-Z])/g, ' $1').trim()}
                value={form[field as keyof typeof form]}
                onChange={(event) => setForm((v) => ({ ...v, [field]: event.target.value }))}
                className="w-full rounded bg-surface-container-low px-3 py-2.5 text-sm"
              />
            ))}
          </div>
        </div>

        {/* Place order */}
        <div className="rounded-xl bg-surface-container p-5">
          <h2 className="text-lg font-bold mb-4">Place Order</h2>
          <button
            type="button"
            disabled={loading || items.length === 0}
            onClick={submit}
            className="w-full rounded-lg bg-foreground py-3.5 font-semibold text-background transition-all hover:bg-foreground/90 disabled:opacity-50"
          >
            {loading ? "Placing order..." : `Place Order ${formatCurrency(total)}`}
          </button>
        </div>
      </div>

      {/* Order Summary */}
      <aside className="order-1 md:order-2 h-fit space-y-4 rounded-xl bg-surface-container p-5">
        <h2 className="font-heading text-lg font-semibold">Order Summary</h2>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-foreground/70">
                {item.productName || "Product"} × {item.quantity}
              </span>
              <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-foreground/10 pt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-foreground/70">Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-foreground/70">GST (18%)</span>
            <span>{formatCurrency(gst)}</span>
          </div>
          <div className="flex justify-between font-semibold text-lg pt-2 border-t border-foreground/10">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </aside>
    </section>
  );
}
