"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useWishlistStore } from "@/stores/wishlistStore";
import { Package, Heart, MapPin, User, LogOut } from "lucide-react";

export default function UserDashboard() {
  var router = useRouter();
  var [user, setUser] = useState<any>(null);
  var [profile, setProfile] = useState<any>(null);
  var [orders, setOrders] = useState<any[]>([]);
  var [loading, setLoading] = useState(true);
  var [activeTab, setActiveTab] = useState("orders");
  var wishlistItems = useWishlistStore(function(state) { return state.items; });
  var removeFromWishlist = useWishlistStore(function(state) { return state.removeItem; });

  useEffect(function() {
    var checkAuth = async function() {
      var supabase = createSupabaseBrowserClient();
      var sb = supabase as any;
      var { data: authData } = await sb.auth.getUser();
      if (!authData.user) {
        router.replace("/auth/login?redirectTo=/my-account");
        return;
      }
      setUser(authData.user);

      var [profileRes, ordersRes] = await Promise.all([
        sb.from("users").select("*").eq("id", authData.user.id).maybeSingle(),
        sb.from("orders").select("*, order_items(*, products(*))").eq("user_id", authData.user.id).order("created_at", { ascending: false }).limit(10),
      ]);

      setProfile(profileRes.data);
      setOrders(ordersRes.data ?? []);
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  var handleLogout = async function() {
    var supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return <div className="mx-auto max-w-4xl px-4 py-12">Loading...</div>;
  }

  var menuItems = [
    { id: "orders", label: "My Orders", icon: Package },
    { id: "wishlist", label: "Wishlist", icon: Heart },
    { id: "addresses", label: "Addresses", icon: MapPin },
    { id: "profile", label: "Profile", icon: User },
  ];

  if (!user) return null;

  var statusColors: Record<string, string> = {
    paid: "bg-blue-100 text-blue-700",
    in_production: "bg-yellow-100 text-yellow-700",
    shipped: "bg-orange-100 text-orange-700",
    delivered: "bg-green-100 text-green-700",
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Account</h1>
        <button onClick={handleLogout} className="flex items-center gap-2 rounded bg-surface-container px-3 py-2 text-sm hover:bg-surface-container-high">
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-[200px_1fr]">
        <aside className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 md:mx-0 md:px-0 md:overflow-visible md:pb-0 md:block md:space-y-1">
          {menuItems.map(function(item) {
            var Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={function() { setActiveTab(item.id); }}
                className={"flex shrink-0 md:w-full items-center gap-2 md:gap-3 rounded px-3 py-2 text-sm text-left whitespace-nowrap " + (activeTab === item.id ? "bg-primary-container font-semibold text-on-primary-fixed" : "hover:bg-surface-container-high")}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {item.id === "wishlist" && wishlistItems.length > 0 && (
                  <span className="ml-1 md:ml-auto rounded-full bg-red-500 px-2 text-xs text-white">
                    {wishlistItems.length}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        <main className="space-y-6">
          {activeTab === "orders" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">My Orders</h2>
              {orders.length === 0 ? (
                <p className="rounded bg-surface-container p-4 text-center text-on-surface/70">No orders yet.</p>
              ) : (
                <div className="space-y-3">
                  {orders.map(function(order: any) {
                    return (
                      <div key={order.id} className="rounded-xl bg-surface-container p-4">
                        <div className="flex items-center justify-between border-b border-on-surface/10 pb-3">
                          <div>
                            <p className="font-mono text-sm">Order #{order.id.slice(0, 8)}</p>
                            <p className="text-xs text-on-surface/60">{new Date(order.created_at).toLocaleDateString()}</p>
                          </div>
                          <span className={"rounded-full px-2 py-0.5 text-xs " + (statusColors[order.status] ?? "bg-gray-100")}>
                            {order.status?.replace("_", " ")}
                          </span>
                        </div>
                        <div className="mt-3 space-y-2">
                          {(order.order_items ?? []).map(function(item: any) {
                            return (
                              <div key={item.id} className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded bg-surface-container-low">
                                  {item.products?.thumbnail_url ? (
                                    <img src={item.products.thumbnail_url} className="h-full w-full object-cover rounded" />
                                  ) : null}
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium">{item.products?.name ?? "Product"}</p>
                                  <p className="text-xs text-on-surface/60">Qty: {item.quantity}</p>
                                </div>
                                <p className="font-semibold">${item.unit_price * item.quantity}</p>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-3 border-t border-on-surface/10 pt-3 flex justify-between">
                          <p className="text-sm text-on-surface/70">{order.shipping_address?.city}, {order.shipping_address?.state}</p>
                          <p className="font-semibold">Total: ${order.total_amount}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "wishlist" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">My Wishlist ({wishlistItems.length})</h2>
              {wishlistItems.length === 0 ? (
                <p className="rounded bg-surface-container p-4 text-center text-on-surface/70">Your wishlist is empty.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {wishlistItems.map(function(item) {
                    return (
                      <div key={item.productId} className="relative rounded-xl bg-surface-container p-4">
                        <button
                          onClick={function() { removeFromWishlist(item.productId); }}
                          className="absolute right-2 top-2 rounded-full p-1 text-red-500 hover:bg-red-50"
                        >
                          <Heart className="h-4 w-4 fill-current" />
                        </button>
                        <Link href={"/products/" + item.categorySlug + "/" + item.productId} className="block">
                          <div className="h-24 w-full rounded bg-surface-container-low">
                            {item.thumbnailUrl ? (
                              <img src={item.thumbnailUrl} className="h-full w-full object-cover rounded" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-on-surface/40">No image</div>
                            )}
                          </div>
                          <p className="mt-2 font-medium">{item.productName}</p>
                          <p className="text-sm font-semibold">${item.basePrice}</p>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "addresses" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Saved Addresses</h2>
              <p className="rounded bg-surface-container p-4 text-center text-on-surface/70">
                No saved addresses. Add one during checkout.
              </p>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Profile</h2>
              <div className="rounded-xl bg-surface-container p-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-on-surface/60">Email</label>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface/60">Phone</label>
                  <p className="font-medium">{profile?.phone ?? "Not set"}</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}