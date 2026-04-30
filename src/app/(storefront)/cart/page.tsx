"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/pricing/calculatePrice";
import { useCartStore } from "@/stores/cartStore";
import { useState, useEffect } from "react";
import { X, User, ShoppingCart, ImageIcon, ZoomIn, Trash2, Package, ArrowRight, ShoppingBag } from "lucide-react";

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
    <section className="min-h-screen bg-gradient-to-b from-surface to-surface-container/30">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-on-surface flex items-center gap-3">
            <ShoppingBag className="h-8 w-8 text-primary" />
            Shopping Cart
          </h1>
          <p className="text-sm text-on-surface/60 mt-2">
            {items.length === 0 ? "Your cart is empty" : `${items.length} ${items.length === 1 ? 'item' : 'items'} in your cart`}
          </p>
        </div>

        {items.length === 0 ? (
          /* Empty Cart State */
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="rounded-full bg-surface-container p-8 mb-6">
              <ShoppingCart className="h-16 w-16 text-on-surface/30" />
            </div>
            <h2 className="text-2xl font-semibold text-on-surface mb-2">Your cart is empty</h2>
            <p className="text-on-surface/60 mb-8 text-center max-w-md">
              Looks like you haven't added anything to your cart yet. Start shopping to find amazing products!
            </p>
            <Link 
              href="/products/photo-prints" 
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-semibold text-on-primary hover:bg-primary/90 transition-colors"
            >
              Start Shopping
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
            {/* Cart Items */}
            <div className="space-y-4">
              {items.map((item) => (
                <article 
                  key={item.id} 
                  className="group relative rounded-2xl bg-surface-container border border-outline-variant/20 p-6 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  {/* Remove Button */}
                  <button 
                    type="button" 
                    onClick={() => removeItem(item.id)} 
                    className="absolute top-4 right-4 rounded-full p-2 text-on-surface/40 hover:bg-error/10 hover:text-error transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  {/* Product Info */}
                  <div className="mb-4 pr-12">
                    <h3 className="text-lg font-semibold text-on-surface mb-2">
                      {item.productName ?? "Custom Product"}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 text-on-surface/70">
                        <Package className="h-4 w-4" />
                        <span>Qty: {item.quantity}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-on-surface/70">Price:</span>
                        <span className="font-semibold text-primary">{formatCurrency(item.unitPrice)}</span>
                        <span className="text-on-surface/50 text-xs">each</span>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {item.selectedTemplate && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                          <span className="h-1.5 w-1.5 rounded-full bg-success"></span>
                          Template Selected
                        </span>
                      )}
                      {item.selectedTemplate === "canva-edit" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                          <ImageIcon className="h-3 w-3" />
                          Edited with Canva
                        </span>
                      )}
                    </div>

                    {item.designInstruction && (
                      <div className="mt-3 rounded-lg bg-surface-container-high/50 p-3 border-l-2 border-primary/30">
                        <p className="text-xs font-medium text-on-surface/60 mb-1">Design Note:</p>
                        <p className="text-sm text-on-surface/80 italic">{item.designInstruction}</p>
                      </div>
                    )}
                  </div>

                  {/* Custom Design Preview */}
                  {item.thumbnailDataUrl && item.selectedTemplate === "canva-edit" && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-on-surface/60 mb-3 flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Your Custom Design
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedImage(item.thumbnailDataUrl!)}
                        className="relative group/img cursor-pointer"
                      >
                        <img 
                          src={item.thumbnailDataUrl}
                          alt="Your custom design"
                          className="w-20 h-20 object-cover rounded-xl border-2 border-outline-variant/30 hover:border-primary transition-colors shadow-sm"
                        />
                        <div className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                          <ZoomIn className="h-5 w-5 text-white" />
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Uploaded Images */}
                  {item.printTransforms && item.printTransforms.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-on-surface/60 mb-3 flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Uploaded Images ({item.printTransforms.length})
                      </p>
                      <div className="flex gap-3 flex-wrap">
                        {item.printTransforms.map((img, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedImage(img.imageUrl)}
                            className="relative group/img cursor-pointer"
                          >
                            <img 
                              src={img.imageUrl}
                              alt={`Image ${idx + 1}`}
                              className="w-20 h-20 object-cover rounded-xl border-2 border-outline-variant/30 hover:border-primary transition-colors shadow-sm"
                            />
                            <span className="absolute -bottom-1 -right-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-on-primary shadow-md">
                              #{idx + 1}
                            </span>
                            <div className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                              <ZoomIn className="h-5 w-5 text-white" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Item Total */}
                  <div className="mt-4 pt-4 border-t border-outline-variant/20 flex justify-between items-center">
                    <span className="text-sm text-on-surface/60">Item Total</span>
                    <span className="text-lg font-bold text-on-surface">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                </article>
              ))}
            </div>

            {/* Order Summary Sidebar */}
            <aside className="lg:sticky lg:top-8 h-fit">
              <div className="rounded-2xl bg-surface-container border border-outline-variant/20 p-6 shadow-lg">
                <h2 className="text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  Order Summary
                </h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface/70">Subtotal</span>
                    <span className="font-medium text-on-surface">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface/70">Shipping</span>
                    <span className="font-medium text-on-surface">{formatCurrency(shipping)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface/70">GST (18%)</span>
                    <span className="font-medium text-on-surface">{formatCurrency(gst)}</span>
                  </div>
                  
                  <div className="pt-4 border-t-2 border-primary/20">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-on-surface">Total</span>
                      <span className="text-2xl font-bold text-primary">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>

                {!isLoggedIn ? (
                  <Link 
                    href="/my-account?redirect=/cart" 
                    className="flex items-center justify-center gap-2 rounded-full bg-yellow-400 px-6 py-4 font-semibold text-gray-900 hover:bg-yellow-500 transition-colors shadow-md hover:shadow-lg w-full"
                  >
                    <User className="h-5 w-5" />
                    Login to Continue
                  </Link>
                ) : (
                  <button 
                    onClick={handleBuyNow}
                    className="flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 font-semibold text-on-primary hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg w-full"
                  >
                    Proceed to Checkout
                    <ArrowRight className="h-5 w-5" />
                  </button>
                )}

                <p className="text-xs text-on-surface/50 text-center mt-4">
                  Secure checkout powered by Razorpay
                </p>
              </div>
            </aside>
          </div>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && items.length > 0 && (
          <section className="mt-1">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-on-surface mb-2">You Might Also Like</h2>
              <p className="text-sm text-on-surface/60">Complete your order with these popular items</p>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {relatedProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/photo-prints/${product.slug}`}
                  className="group rounded-2xl bg-surface-container border border-outline-variant/20 p-4 transition-all duration-300 hover:shadow-lg hover:border-primary/30"
                >
                  {product.thumbnail_url ? (
                    <div className="relative overflow-hidden rounded-xl mb-3">
                      <img 
                        src={product.thumbnail_url} 
                        alt={product.name}
                        className="w-full aspect-square object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-square rounded-xl bg-surface-container-low flex items-center justify-center mb-3">
                      <ImageIcon className="h-12 w-12 text-on-surface/20" />
                    </div>
                  )}
                  <h3 className="font-semibold text-sm text-on-surface line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-xs text-on-surface/50">
                    From <span className="font-semibold text-primary">{formatCurrency(Number(product.base_price))}</span>
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Image Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
          <img 
            src={selectedImage} 
            alt="Full size preview" 
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
}
