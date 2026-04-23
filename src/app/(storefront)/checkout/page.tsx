"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/pricing/calculatePrice";
import { isValidGstNumber } from "@/lib/validation/gst";
import { useCartStore } from "@/stores/cartStore";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clear } = useCartStore();
  const [gstError, setGstError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [gateway, setGateway] = useState<"cashfree" | "razorpay">("cashfree");
  const [ready, setReady] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pinCode: "",
    phone: "",
    gstNumber: "",
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

  const submit = async () => {
    if (form.gstNumber && !isValidGstNumber(form.gstNumber)) {
      setGstError("Invalid GST format");
      return;
    }
    setGstError(null);
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
        gstNumber: form.gstNumber || undefined,
        subtotal,
        taxAmount: gst,
        totalAmount: total,
        items: items.map((item) => ({
          productId: item.productId,
          variationId: item.variationId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          designState: item.designState,
        })),
      }),
    });

    const body = await response.json();
    setLoading(false);
    if (!response.ok) return;

    const paymentResponse = await fetch("/api/payments/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: body.orderId,
        preferredGateway: gateway,
      }),
    });
    const paymentBody = await paymentResponse.json();
    if (!paymentResponse.ok) {
      setLoading(false);
      return;
    }

    // For now we redirect to confirmation after order+payment intent creation.
    // Frontend checkout SDK integration can use paymentBody.payment session data.
    clear();
    router.push(`/orders/${body.orderId}/confirmation`);
  };

  return (
    <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 md:grid-cols-[1fr_340px] md:px-8">
      <div className="space-y-3 rounded-xl bg-surface-container p-4">
        <h1 className="text-2xl font-bold">Checkout</h1>
        {["fullName", "addressLine1", "addressLine2", "city", "state", "pinCode", "phone", "gstNumber"].map((field) => (
          <input
            key={field}
            placeholder={field}
            value={form[field as keyof typeof form]}
            onChange={(event) => setForm((v) => ({ ...v, [field]: event.target.value }))}
            className="w-full rounded bg-surface-container-low px-3 py-2 text-sm"
          />
        ))}
        {gstError && <p className="text-sm text-error">{gstError}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setGateway("cashfree")}
            className={`rounded px-3 py-1 text-xs ${gateway === "cashfree" ? "bg-primary-container text-on-primary-fixed" : "bg-surface-container-low"}`}
          >
            Cashfree
          </button>
          <button
            type="button"
            onClick={() => setGateway("razorpay")}
            className={`rounded px-3 py-1 text-xs ${gateway === "razorpay" ? "bg-primary-container text-on-primary-fixed" : "bg-surface-container-low"}`}
          >
            Razorpay fallback
          </button>
        </div>
        <button
          type="button"
          disabled={loading || items.length === 0}
          onClick={submit}
          className="rounded bg-primary-container px-4 py-2 font-semibold text-on-primary-fixed disabled:opacity-50"
        >
          {loading ? "Placing order..." : "Place order"}
        </button>
      </div>
      <aside className="h-fit space-y-2 rounded-xl bg-surface-container-high p-4">
        <h2 className="font-heading text-lg font-semibold">Order Summary</h2>
        <p className="flex justify-between text-sm"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></p>
        <p className="flex justify-between text-sm"><span>GST (18%)</span><span>{formatCurrency(gst)}</span></p>
        <p className="flex justify-between font-semibold"><span>Total</span><span>{formatCurrency(total)}</span></p>
      </aside>
    </section>
  );
}
