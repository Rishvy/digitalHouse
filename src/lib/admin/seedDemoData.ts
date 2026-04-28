import crypto from "node:crypto";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";

const DEMO_CATEGORIES = [
  { id: "a0000000-0000-0000-0000-000000000001", name: "Photo Prints & Memories", slug: "photo-prints", description: "Polaroids, passport photos, albums, and standard prints" },
  { id: "a0000000-0000-0000-0000-000000000002", name: "Wall Art & Decor", slug: "wall-art", description: "Framed prints, posters, and large format wall art" },
  { id: "a0000000-0000-0000-0000-000000000003", name: "Signage & Large Format", slug: "signage", description: "Flex prints, banners, and roll-up standees" },
  { id: "a0000000-0000-0000-0000-000000000004", name: "Custom Merchandise", slug: "custom-merchandise", description: "Ceramic mugs and button pins" },
  { id: "a0000000-0000-0000-0000-000000000005", name: "Stationery & Packaging", slug: "stationery-packaging", description: "Stickers, letterheads, paper bags, and business cards" },
];

const TEMPLATES = [
  { id: "b0000000-0000-0000-0000-000000000001", name: "Standard Square Template", width: 4, height: 4 },
  { id: "b0000000-0000-0000-0000-000000000002", name: "Standard Portrait Template", width: 4, height: 6 },
  { id: "b0000000-0000-0000-0000-000000000003", name: "Standard Landscape Template", width: 6, height: 4 },
];

const PRODUCTS = [
  // ── Photo Prints & Memories ─────────────────────────────────────────────
  { id: "c0000000-0000-0000-0000-000000000001", categoryId: "a0000000-0000-0000-0000-000000000001", name: "Polaroid Prints", slug: "polaroid-prints", base: 99, desc: "Classic white border polaroid-style prints", img: "https://placehold.co/600x400/f8f9fa/333333?text=Polaroid+Prints" },
  { id: "c0000000-0000-0000-0000-000000000002", categoryId: "a0000000-0000-0000-0000-000000000001", name: "Passport Size Photos", slug: "passport-photos", base: 49, desc: "Sets of 8 or 16 passport size photos", img: "https://placehold.co/600x400/f8f9fa/333333?text=Passport+Photos" },
  { id: "c0000000-0000-0000-0000-000000000003", categoryId: "a0000000-0000-0000-0000-000000000001", name: "Photo Albums", slug: "photo-albums", base: 399, desc: "Softcover and hardcover photo albums", img: "https://placehold.co/600x400/1a1a2e/ffffff?text=Photo+Albums" },
  { id: "c0000000-0000-0000-0000-000000000004", categoryId: "a0000000-0000-0000-0000-000000000001", name: "Standard Photos", slug: "standard-photos", base: 5, desc: "Standard 4x6 and 5x7 photo prints", img: "https://placehold.co/600x400/f8f9fa/333333?text=Standard+Photos" },

  // ── Wall Art & Decor ────────────────────────────────────────────────────
  { id: "c0000000-0000-0000-0000-000000000005", categoryId: "a0000000-0000-0000-0000-000000000002", name: "Framed Prints", slug: "framed-prints", base: 499, desc: "Framed prints in A5, A4, A3 sizes with black or white frame", img: "https://placehold.co/600x400/6c5ce7/ffffff?text=Framed+Prints" },
  { id: "c0000000-0000-0000-0000-000000000006", categoryId: "a0000000-0000-0000-0000-000000000002", name: "Posters", slug: "posters", base: 199, desc: "Posters in A5, A4, A3 sizes", img: "https://placehold.co/600x400/6c5ce7/ffffff?text=Posters" },
  { id: "c0000000-0000-0000-0000-000000000007", categoryId: "a0000000-0000-0000-0000-000000000002", name: "Large Format Prints", slug: "large-format-prints", base: 999, desc: "Large format prints in A2, A1, A0 sizes", img: "https://placehold.co/600x400/6c5ce7/ffffff?text=Large+Format" },

  // ── Signage & Large Format ──────────────────────────────────────────────
  { id: "c0000000-0000-0000-0000-000000000008", categoryId: "a0000000-0000-0000-0000-000000000003", name: "Flex Prints", slug: "flex-prints", base: 1499, desc: "Custom dimension flex prints for signage", img: "https://placehold.co/600x400/00b894/ffffff?text=Flex+Prints" },
  { id: "c0000000-0000-0000-0000-000000000009", categoryId: "a0000000-0000-0000-0000-000000000003", name: "Banners", slug: "banners", base: 899, desc: "Standard size and custom banners", img: "https://placehold.co/600x400/00b894/ffffff?text=Banners" },
  { id: "c0000000-0000-0000-0000-000000000010", categoryId: "a0000000-0000-0000-0000-000000000003", name: "Standee / Roll-up Banners", slug: "standee-banners", base: 2499, desc: "Portable roll-up standee banners", img: "https://placehold.co/600x400/00b894/ffffff?text=Standee+Banners" },

  // ── Custom Merchandise ──────────────────────────────────────────────────
  { id: "c0000000-0000-0000-0000-000000000011", categoryId: "a0000000-0000-0000-0000-000000000004", name: "Ceramic Mugs", slug: "ceramic-mugs", base: 249, desc: "Standard 11oz ceramic mugs with inner-color variants", img: "https://placehold.co/600x400/ffffff/333333?text=Ceramic+Mugs" },
  { id: "c0000000-0000-0000-0000-000000000012", categoryId: "a0000000-0000-0000-0000-000000000004", name: "Button Pins", slug: "button-pins", base: 49, desc: "Assorted button pins in 44mm and 58mm diameters", img: "https://placehold.co/600x400/fd79a8/ffffff?text=Button+Pins" },

  // ── Stationery & Packaging ──────────────────────────────────────────────
  { id: "c0000000-0000-0000-0000-000000000013", categoryId: "a0000000-0000-0000-0000-000000000005", name: "Stickers", slug: "stickers", base: 79, desc: "Die-cut, standard, and transparent vinyl stickers", img: "https://placehold.co/600x400/fd79a8/ffffff?text=Stickers" },
  { id: "c0000000-0000-0000-0000-000000000014", categoryId: "a0000000-0000-0000-0000-000000000005", name: "Letterheads", slug: "letterheads", base: 99, desc: "A4 letterheads on bond paper", img: "https://placehold.co/600x400/f8f9fa/333333?text=Letterheads" },
  { id: "c0000000-0000-0000-0000-000000000015", categoryId: "a0000000-0000-0000-0000-000000000005", name: "Paper Bags", slug: "paper-bags", base: 199, desc: "Custom paper bags in small, medium, large", img: "https://placehold.co/600x400/f8f9fa/333333?text=Paper+Bags" },
  { id: "c0000000-0000-0000-0000-000000000016", categoryId: "a0000000-0000-0000-0000-000000000005", name: "Business Cards", slug: "business-cards", base: 299, desc: "Premium business cards for bulk orders", img: "https://placehold.co/600x400/1a1a2e/ffffff?text=Business+Cards" },
];

function randomOrderStatus() {
  const statuses = ["paid", "in_production", "shipped", "delivered"] as const;
  return statuses[Math.floor(Math.random() * statuses.length)];
}

export async function seedAdminDemoData() {
  const supabase = createSupabaseServiceRoleClient() as any;
  
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) throw new Error(usersError.message);
  const authUser = usersData?.users?.[0];
  if (!authUser) {
    throw new Error("No auth user found. Create at least one user first.");
  }

  console.log("Clearing existing data...");
  await supabase.from("pricing_tiers").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("product_variations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("product_images").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("product_categories").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("Seeding categories...");
  await supabase.from("product_categories").insert(DEMO_CATEGORIES);

  console.log("Seeding templates...");

  const templateRecords = TEMPLATES.map(t => ({
    id: t.id,
    name: t.name,
    konva_json: "{}",
    width_inches: t.width,
    height_inches: t.height,
    bleed_inches: 0.125,
    color_options: "[]",
  }));

  await supabase.from("templates").upsert(templateRecords);

  console.log("Seeding products...");
  await supabase.from("products").upsert(
    PRODUCTS.map(p => ({
      id: p.id,
      category_id: p.categoryId,
      name: p.name,
      slug: p.slug,
      base_price: p.base,
      description: p.desc,
      template_id: TEMPLATES[0].id,
      thumbnail_url: p.img,
    }))
  );

  console.log("Seeding variations...");
  const variations = PRODUCTS.flatMap(p => [
    { id: crypto.randomUUID(), product_id: p.id, sku: p.slug.toUpperCase().replace(/-/g, "") + "-100", attributes: { quantity: 100, paper_stock: "Standard", lamination: "None" }, price_modifier: 0 },
    { id: crypto.randomUUID(), product_id: p.id, sku: p.slug.toUpperCase().replace(/-/g, "") + "-500", attributes: { quantity: 500, paper_stock: "Standard", lamination: "None" }, price_modifier: -50 },
    { id: crypto.randomUUID(), product_id: p.id, sku: p.slug.toUpperCase().replace(/-/g, "") + "-1000", attributes: { quantity: 1000, paper_stock: "Standard", lamination: "None" }, price_modifier: -150 },
  ]);
  await supabase.from("product_variations").upsert(variations);

  console.log("Seeding pricing tiers...");
  const pricingTiers = PRODUCTS.flatMap(p => [
    { id: crypto.randomUUID(), product_id: p.id, variation_id: null, min_quantity: 1, max_quantity: 99, unit_price: p.base * 1.0 },
    { id: crypto.randomUUID(), product_id: p.id, variation_id: null, min_quantity: 100, max_quantity: 499, unit_price: p.base * 0.85 },
    { id: crypto.randomUUID(), product_id: p.id, variation_id: null, min_quantity: 500, max_quantity: 999, unit_price: p.base * 0.70 },
    { id: crypto.randomUUID(), product_id: p.id, variation_id: null, min_quantity: 1000, max_quantity: null, unit_price: p.base * 0.55 },
  ]);
  await supabase.from("pricing_tiers").upsert(pricingTiers);

  console.log("Creating demo orders...");
  const ordersToCreate = Array.from({ length: 5 }).map((_, i) => ({
    id: crypto.randomUUID(),
    user_id: authUser.id,
    status: randomOrderStatus(),
    total_amount: (2000 + i * 500) * 1.18,
    tax_amount: (2000 + i * 500) * 0.18,
    payment_id: `demo_pay_${i + 1}`,
    payment_method: i % 2 === 0 ? "cashfree" : "razorpay",
    shipping_address: { line1: "123 Main St", city: "Mumbai", state: "Maharashtra", postal_code: "400001", country: "IN" },
    billing_address: { line1: "123 Main St", city: "Mumbai", state: "Maharashtra", postal_code: "400001", country: "IN" },
  }));
  const { error: orderError } = await supabase.from("orders").insert(ordersToCreate);
  if (orderError) console.log("Orders error (may already exist):", orderError.message);

  return {
    categories: DEMO_CATEGORIES.length,
    products: PRODUCTS.length,
  };
}

seedAdminDemoData()
  .then(result => {
    console.log("Seed complete:", JSON.stringify(result, null, 2));
  })
  .catch(err => {
    console.error("Seed failed:", err.message);
    process.exit(1);
  });
