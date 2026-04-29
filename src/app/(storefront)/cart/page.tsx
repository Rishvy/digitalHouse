"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/pricing/calculatePrice";
import { useCartStore } from "@/stores/cartStore";
import { useState, useEffect } from "react";
import { X, User, ShoppingCart } from "lucide-react";

export default function CartPage() {
  const { items, removeItem, clear } = useCartStore();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check auth via cookie/session - simplified for now
    const cookie = document.cookie;
    setIsLoggedIn(cookie.includes("auth-token") || cookie.includes("session"));
  }, []);

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const shipping = subtotal > 0 ? 120 : 0;
  const gst = subtotal * 0.18;
  const total = subtotal + shipping + gst;

  const handleBuyNow = () => {
    window.location.href = "/checkout";
  };

  return (
    <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 md:grid-cols-[1fr_340px] md:px-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Your Cart</h1>
        {items.length === 0 && (
          <div className="rounded bg-surface-container p-4 text-sm">
            <p className="mb-4">Your cart is empty.</p>
            <Link href="/products/photo-prints" className="text-primary-container hover:underline">
              Browse products
            </Link>
          </div>
        )}
        {items.map((item) => (
          <article key={item.id} className="rounded-xl bg-surface-container p-4">
            <div className="flex gap-4">
              {item.thumbnailDataUrl && (
                <img 
                  src={item.thumbnailDataUrl} 
                  alt="" 
                  className="w-20 h-20 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold">{item.productName ?? "Custom Product"}</h3>
                <p className="text-sm text-on-surface/70">Quantity: {item.quantity}</p>
                <p className="text-sm">{formatCurrency(item.unitPrice)} each</p>
                {item.selectedTemplate && (
                  <p className="text-xs text-on-surface/50 mt-1">
                    Template: <span className="text-green-600">Selected</span>
                  </p>
                )}
                {item.designInstruction && (
                  <p className="text-xs text-on-surface/50 mt-1 italic">
                    Note: {item.designInstruction}
                  </p>
                )}
              </div>
              <button 
                type="button" 
                onClick={() => removeItem(item.id)} 
                className="self-start rounded bg-on-surface px-3 py-1 text-xs text-surface hover:bg-on-surface/80"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            {item.printTransforms && item.printTransforms.length > 1 && (
              <div className="mt-3 flex gap-1 flex-wrap">
                {item.printTransforms.map((img, idx) => (
                  <img 
                    key={idx}
                    src={img.imageUrl}
                    alt={`Image ${idx + 1}`}
                    className="w-10 h-10 object-cover rounded border border-foreground/20"
                  />
                ))}
              </div>
            )}
          </article>
        ))}
      </div>

      <aside className="h-fit space-y-2 rounded-xl bg-surface-container-high p-4">
        <h2 className="font-heading text-lg font-semibold">Order Summary</h2>
        <p className="flex justify-between text-sm"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></p>
        <p className="flex justify-between text-sm"><span>Shipping</span><span>{formatCurrency(shipping)}</span></p>
        <p className="flex justify-between text-sm"><span>GST (18%)</span><span>{formatCurrency(gst)}</span></p>
        <p className="flex justify-between font-semibold"><span>Total</span><span>{formatCurrency(total)}</span></p>
        
        {!isLoggedIn ? (
          <Link href="/my-account?redirect=/cart" className="mt-3 flex items-center justify-center gap-2 rounded bg-primary-container px-4 py-2 text-center font-semibold text-on-primary-fixed">
            <User className="h-4 w-4" />
            Login to Continue
          </Link>
        ) : (
          <button 
            onClick={handleBuyNow}
            className="mt-3 flex items-center justify-center gap-2 rounded bg-primary-container px-4 py-2 text-center font-semibold text-on-primary-fixed w-full"
          >
            <ShoppingCart className="h-4 w-4" />
            Buy Now
          </button>
        )}
      </aside>
    </section>
  );
}