"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/pricing/calculatePrice";
import { useCartStore } from "@/stores/cartStore";
import { useState, useEffect } from "react";
import { X, User, ShoppingCart, ImageIcon, ZoomIn } from "lucide-react";

interface RelatedProduct {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  thumbnail_url: string | null;
}

export default function CartPage() {
  const { items, removeItem, clear } = useCartStore();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const cookie = document.cookie;
    setIsLoggedIn(cookie.includes("auth-token") || cookie.includes("session"));
  }, []);

  useEffect(() => {
    if (items.length > 0 && items[0].productId) {
      fetch(`/api/products/related?productId=${items[0].productId}&limit=4`)
        .then(res => res.json())
        .then(data => setRelatedProducts(data.products || []))
        .catch(console.error);
    }
  }, [items]);

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
                <button
                  type="button"
                  onClick={() => setSelectedImage(item.thumbnailDataUrl!)}
                  className="relative group cursor-pointer flex-shrink-0"
                >
                  <img 
                    src={item.thumbnailDataUrl} 
                    alt="Your custom design" 
                    className="w-20 h-20 object-cover rounded-lg border-2 border-primary/30 hover:border-primary transition-colors"
                  />
                  <div className="absolute inset-0 rounded-lg bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn className="h-5 w-5 text-white" />
                  </div>
                  <span className="absolute -top-1 -right-1 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-semibold text-white">
                    Custom
                  </span>
                </button>
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
                {item.selectedTemplate === "canva-edit" && (
                  <p className="text-xs text-primary mt-1 flex items-center gap-1">
                    <ImageIcon className="h-3 w-3" />
                    Edited with Canva
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

            {/* Custom Design Preview Section */}
            {item.thumbnailDataUrl && item.selectedTemplate === "canva-edit" && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-on-surface/60 mb-2 flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" />
                  Your Custom Design
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedImage(item.thumbnailDataUrl!)}
                  className="relative group cursor-pointer"
                >
                  <img 
                    src={item.thumbnailDataUrl}
                    alt="Your custom design"
                    className="w-14 h-14 object-cover rounded border border-foreground/20 hover:border-accent"
                  />
                  <div className="absolute inset-0 rounded bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn className="h-4 w-4 text-white" />
                  </div>
                </button>
              </div>
            )}

            {item.printTransforms && item.printTransforms.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-on-surface/60 mb-2 flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" />
                  Uploaded Images ({item.printTransforms.length})
                </p>
                <div className="flex gap-2 flex-wrap">
                  {item.printTransforms.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImage(img.imageUrl)}
                      className="relative group cursor-pointer"
                    >
                      <img 
                        src={img.imageUrl}
                        alt={`Image ${idx + 1}`}
                        className="w-14 h-14 object-cover rounded border border-foreground/20 hover:border-accent"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 rounded bg-black/70 px-1 text-[9px] text-white">
                        #{idx + 1}
                      </span>
                      <div className="absolute inset-0 rounded bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ZoomIn className="h-4 w-4 text-white" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {item.selectedTemplate && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-on-surface/60 mb-1">Selected Template:</p>
                <img 
                  src={item.selectedTemplate}
                  alt="Selected template"
                  className="w-20 h-20 object-contain rounded border border-foreground/10"
                />
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

      {relatedProducts.length > 0 && items.length > 0 && (
        <section className="col-span-full mt-6">
          <h2 className="text-xl font-bold border-t border-foreground/10 pt-6">You Might Also Like</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            {relatedProducts.map((product) => (
              <Link
                key={product.id}
                href={`/products/photo-prints/${product.slug}`}
                className="group rounded-xl bg-surface-container p-3 transition-colors hover:bg-surface-container-high"
              >
                {product.thumbnail_url ? (
                  <img 
                    src={product.thumbnail_url} 
                    alt={product.name}
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full aspect-square rounded-lg bg-surface-container-low flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-foreground/20" />
                  </div>
                )}
                <h3 className="mt-2 text-sm font-semibold line-clamp-1">{product.name}</h3>
                <p className="text-xs text-foreground/50">Starting from {formatCurrency(Number(product.base_price))}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>
          <img 
            src={selectedImage} 
            alt="Full size" 
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
}