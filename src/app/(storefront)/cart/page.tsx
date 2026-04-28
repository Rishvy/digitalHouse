"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/pricing/calculatePrice";
import { useCartStore } from "@/stores/cartStore";

export default function CartPage() {
  const { items, removeItem } = useCartStore();
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const shipping = subtotal > 0 ? 120 : 0;
  const gst = subtotal * 0.18;
  const total = subtotal + shipping + gst;

  return (
    <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 md:grid-cols-[1fr_340px] md:px-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Your Cart</h1>
        {items.length === 0 && <p className="rounded bg-surface-container p-4 text-sm">Your cart is empty.</p>}
        {items.map((item) => (
          <article key={item.id} className="grid gap-4 rounded-xl bg-surface-container p-4 sm:grid-cols-[1fr_auto]">
            <div>
              <h3 className="font-semibold">{item.productName ?? "Custom Product"}</h3>
              <p className="text-sm text-on-surface/70">Qty: {item.quantity}</p>
              <p className="text-sm">{formatCurrency(item.unitPrice)}</p>
            </div>
            <button type="button" onClick={() => removeItem(item.id)} className="self-start rounded bg-on-surface px-3 py-1 text-xs text-surface">
              Remove
            </button>
          </article>
        ))}
      </div>

      <aside className="h-fit space-y-2 rounded-xl bg-surface-container-high p-4">
        <h2 className="font-heading text-lg font-semibold">Order Summary</h2>
        <p className="flex justify-between text-sm"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></p>
        <p className="flex justify-between text-sm"><span>Shipping</span><span>{formatCurrency(shipping)}</span></p>
        <p className="flex justify-between text-sm"><span>GST (18%)</span><span>{formatCurrency(gst)}</span></p>
        <p className="flex justify-between font-semibold"><span>Total</span><span>{formatCurrency(total)}</span></p>
        <Link href="/checkout" className="mt-3 block rounded bg-primary-container px-4 py-2 text-center font-semibold text-on-primary-fixed">
          Continue to Checkout
        </Link>
      </aside>
    </section>
  );
}
