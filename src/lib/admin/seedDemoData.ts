import crypto from "node:crypto";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";

const DEMO_CATEGORIES = [
  { id: "a0000000-0000-0000-0000-000000000001", name: "Business Cards", slug: "business-cards", description: "Professional business cards" },
  { id: "a0000000-0000-0000-0000-000000000002", name: "Flyers & Brochures", slug: "flyers", description: "Marketing flyers and brochures" },
  { id: "a0000000-0000-0000-0000-000000000003", name: "Posters", slug: "posters", description: "Large format posters" },
  { id: "a0000000-0000-0000-0000-000000000004", name: "Banners", slug: "banners", description: "Vinyl banners and signage" },
  { id: "a0000000-0000-0000-0000-000000000005", name: "Stationery", slug: "stationery", description: "Letterheads and envelopes" },
  { id: "a0000000-0000-0000-0000-000000000006", name: "Labels & Stickers", slug: "labels", description: "Custom labels and stickers" },
  { id: "a0000000-0000-0000-0000-000000000007", name: "Invitations", slug: "invitations", description: "Wedding and event invitations" },
  { id: "a0000000-0000-0000-0000-000000000008", name: "Mugs & Gifts", slug: "mugs", description: "Custom mugs and gifts" },
];

const TEMPLATES = [
  { id: "b0000000-0000-0000-0000-000000000001", name: "Minimal Business Card", width: 3.5, height: 2 },
  { id: "b0000000-0000-0000-0000-000000000002", name: "Modern Business Card", width: 3.5, height: 2 },
  { id: "b0000000-0000-0000-0000-000000000003", name: "Creative Business Card", width: 3.5, height: 2 },
];

// Stylish template JSONs with color options
const TEMPLATE_DESIGNS: Record<string, { json: string; colors: string[] }> = {
  "minimal-business-card": {
    json: JSON.stringify({
      attrs: { width: 1050, height: 600 },
      children: [
        { className: "Rect", attrs: { fill: "#FFFFFF" } },
        { className: "Rect", attrs: { x: 30, y: 30, width: 6, height: 540, fill: "#1a1a2e" } },
        { className: "Text", attrs: { x: 60, y: 120, text: "COMPANY NAME", fontSize: 28, fontFamily: "Inter", fill: "#1a1a2e", fontStyle: "bold" } },
        { className: "Text", attrs: { x: 60, y: 170, text: "John Doe", fontSize: 22, fill: "#333333" } },
        { className: "Text", attrs: { x: 60, y: 200, text: "Job Title", fontSize: 14, fill: "#666666" } },
        { className: "Text", attrs: { x: 60, y: 280, text: "+1 234 567 8900", fontSize: 12, fill: "#666666" } },
        { className: "Text", attrs: { x: 60, y: 310, text: "email@company.com", fontSize: 12, fill: "#666666" } },
        { className: "Text", attrs: { x: 60, y: 340, text: "www.company.com", fontSize: 12, fill: "#666666" } },
        { className: "Text", attrs: { x: 60, y: 370, text: "123 Business St, City", fontSize: 12, fill: "#666666" } },
      ],
    }),
    colors: ["#1a1a2e", "#2d3436", "#6c5ce7", "#00b894", "#e17055"],
  },
  "modern-business-card": {
    json: JSON.stringify({
      attrs: { width: 1050, height: 600 },
      children: [
        { className: "Rect", attrs: { fill: "#f8f9fa" } },
        { className: "Rect", attrs: { x: 0, y: 0, width: 350, height: 600, fill: "#007BFF" } },
        { className: "Text", attrs: { x: 40, y: 100, text: "COMPANY", fontSize: 24, fontFamily: "Arial", fill: "#FFFFFF", fontStyle: "bold" } },
        { className: "Text", attrs: { x: 40, y: 135, text: "John Doe", fontSize: 32, fontFamily: "Arial", fill: "#FFFFFF" } },
        { className: "Text", attrs: { x: 40, y: 180, text: "MANAGER", fontSize: 14, fontFamily: "Arial", fill: "#FFFFFF", letterSpacing: 3 } },
        { className: "Text", attrs: { x: 40, y: 350, text: "+1 234 567 8900", fontSize: 12, fill: "#333333" } },
        { className: "Text", attrs: { x: 40, y: 380, text: "john@company.com", fontSize: 12, fill: "#333333" } },
        { className: "Text", attrs: { x: 40, y: 410, text: "www.company.com", fontSize: 12, fill: "#333333" } },
      ],
    }),
    colors: ["#007BFF", "#e17055", "#00b894", "#6c5ce7", "#fd79a8"],
  },
  "creative-business-card": {
    json: JSON.stringify({
      attrs: { width: 1050, height: 600 },
      children: [
        { className: "Rect", attrs: { fill: "#1a1a2e" } },
        { className: "Circle", attrs: { x: 525, y: 300, radius: 200, fill: "#2d3436" } },
        { className: "Text", attrs: { x: 525, y: 280, text: "JD", fontSize: 80, fontFamily: "Arial", fill: "#FFFFFF", textAlign: "center" } },
        { className: "Text", attrs: { x: 60, y: 100, text: "John Doe", fontSize: 28, fontFamily: "Arial", fill: "#FFFFFF" } },
        { className: "Text", attrs: { x: 60, y: 145, text: "CREATIVE DIRECTOR", fontSize: 12, fill: "#fdcb6e", letterSpacing: 2 } },
        { className: "Text", attrs: { x: 60, y: 450, text: "+1 234 567 8900", fontSize: 12, fill: "#adb5bd" } },
        { className: "Text", attrs: { x: 60, y: 480, text: "john@company.com", fontSize: 12, fill: "#adb5bd" } },
      ],
    }),
    colors: ["#1a1a2e", "#2d3436", "#6c5ce7", "#e17055", "#00b894"],
  },
  "a5-flyer": {
    json: JSON.stringify({
      attrs: { width: 1748, height: 2480 },
      children: [
        { className: "Rect", attrs: { fill: "#FFFFFF" } },
        { className: "Rect", attrs: { x: 0, y: 0, width: 15, height: 2480, fill: "#007BFF" } },
        { className: "Text", attrs: { x: 50, y: 80, text: "COMPANY NAME", fontSize: 48, fontFamily: "Arial", fill: "#1a1a2e", fontStyle: "bold" } },
        { className: "Text", attrs: { x: 50, y: 150, text: "Your Tagline Here", fontSize: 24, fill: "#666666" } },
        { className: "Rect", attrs: { x: 50, y: 220, width: 200, height: 8, fill: "#007BFF" } },
        { className: "Text", attrs: { x: 50, y: 400, text: "SUMMER SALE", fontSize: 64, fontFamily: "Arial", fill: "#1a1a2e", fontStyle: "bold" } },
        { className: "Text", attrs: { x: 50, y: 500, text: "UP TO 50% OFF", fontSize: 48, fill: "#007BFF" } },
        { className: "Text", attrs: { x: 50, y: 700, text: "Valid until August 31, 2025", fontSize: 18, fill: "#999999" } },
        { className: "Text", attrs: { x: 50, y: 2200, text: "123 Business Street, City | +1 234 567 8900", fontSize: 14, fill: "#666666" } },
      ],
    }),
    colors: ["#007BFF", "#e17055", "#00b894", "#6c5ce7", "#fd79a8"],
  },
  "a4-flyer": {
    json: JSON.stringify({
      attrs: { width: 2480, height: 3508 },
      children: [
        { className: "Rect", attrs: { fill: "#FFFFFF" } },
        { className: "Rect", attrs: { x: 0, y: 0, width: 2480, height: 20, fill: "#1a1a2e" } },
        { className: "Rect", attrs: { x: 0, y: 3388, width: 2480, height: 120, fill: "#f8f9fa" } },
        { className: "Text", attrs: { x: 80, y: 100, text: "COMPANY NAME", fontSize: 64, fontFamily: "Arial", fill: "#1a1a2e", fontStyle: "bold" } },
        { className: "Text", attrs: { x: 80, y: 200, text: "Your Tagline Here", fontSize: 32, fill: "#666666" } },
        { className: "Text", attrs: { x: 80, y: 800, text: "BIG SALE", fontSize: 120, fontFamily: "Arial", fill: "#1a1a2e", fontStyle: "bold" } },
        { className: "Text", attrs: { x: 80, y: 1000, text: "FLAT 30% OFF", fontSize: 80, fill: "#007BFF" } },
        { className: "Text", attrs: { x: 80, y: 1500, text: "Offer valid until Dec 31, 2025", fontSize: 24, fill: "#999999" } },
        { className: "Text", attrs: { x: 80, y: 3450, text: "www.company.com | contact@company.com | +1 234 567 8900", fontSize: 20, fill: "#666666" } },
      ],
    }),
    colors: ["#1a1a2e", "#007BFF", "#e17055", "#00b894", "#6c5ce7"],
  },
  "poster": {
    json: JSON.stringify({
      attrs: { width: 1654, height: 2339 },
      children: [
        { className: "Rect", attrs: { fill: "#f8f9fa" } },
        { className: "Text", attrs: { x: 827, y: 400, text: "LIVE", fontSize: 180, fontFamily: "Arial", fill: "#1a1a2e", textAlign: "center", fontStyle: "bold" } },
        { className: "Text", attrs: { x: 827, y: 600, text: "EVENT", fontSize: 180, fontFamily: "Arial", fill: "#1a1a2e", textAlign: "center", fontStyle: "bold" } },
        { className: "Text", attrs: { x: 827, y: 900, text: "MARCH 15, 2025", fontSize: 64, fill: "#007BFF", textAlign: "center" } },
        { className: "Text", attrs: { x: 827, y: 1000, text: "Convention Center", fontSize: 36, fill: "#666666", textAlign: "center" } },
        { className: "Text", attrs: { x: 827, y: 1800, text: "BOOK NOW", fontSize: 48, fill: "#1a1a2e", textAlign: "center" } },
      ],
    }),
    colors: ["#1a1a2e", "#007BFF", "#e17055", "#6c5ce7", "#00b894"],
  },
};

const PRODUCTS = [
  { id: "c0000000-0000-0000-0000-000000000001", categoryId: "a0000000-0000-0000-0000-000000000001", name: "Standard Business Card", slug: "standard-business-card", base: 299, desc: "Professional matte finish business cards", img: "https://placehold.co/600x400/1a1a2e/ffffff?text=Standard+Business+Card" },
  { id: "c0000000-0000-0000-0000-000000000002", categoryId: "a0000000-0000-0000-0000-000000000001", name: "Premium Glossy Card", slug: "premium-glossy-card", base: 399, desc: "Glossy finish with vibrant colors", img: "https://placehold.co/600x400/1a1a2e/ffffff?text=Premium+Glossy+Card" },
  { id: "c0000000-0000-0000-0000-000000000003", categoryId: "a0000000-0000-0000-0000-000000000001", name: "Matte Soft Touch", slug: "matte-soft-touch", base: 449, desc: "Luxurious matte with soft velvet feel", img: "https://placehold.co/600x400/1a1a2e/ffffff?text=Matte+Soft+Touch" },
  { id: "c0000000-0000-0000-0000-000000000004", categoryId: "a0000000-0000-0000-0000-000000000001", name: "Spot UV Business Card", slug: "spot-uv-business-card", base: 599, desc: "Spot UV finish for impact", img: "https://placehold.co/600x400/1a1a2e/ffffff?text=Spot+UV+Card" },
  { id: "c0000000-0000-0000-0000-000000000005", categoryId: "a0000000-0000-0000-0000-000000000001", name: "Gold Foil Card", slug: "gold-foil-card", base: 799, desc: "Premium gold foil stamping", img: "https://placehold.co/600x400/1a1a2e/ffffff?text=Gold+Foil+Card" },
  { id: "c0000000-0000-0000-0000-000000000010", categoryId: "a0000000-0000-0000-0000-000000000002", name: "A5 Flyer", slug: "a5-flyer", base: 149, desc: "Standard A5 marketing flyer", img: "https://placehold.co/600x400/2d3436/ffffff?text=A5+Flyer" },
  { id: "c0000000-0000-0000-0000-000000000011", categoryId: "a0000000-0000-0000-0000-000000000002", name: "A4 Flyer", slug: "a4-flyer", base: 249, desc: "Full size A4 flyer", img: "https://placehold.co/600x400/2d3436/ffffff?text=A4+Flyer" },
  { id: "c0000000-0000-0000-0000-000000000012", categoryId: "a0000000-0000-0000-0000-000000000002", name: "Tri-Fold Brochure", slug: "tri-fold-brochure", base: 399, desc: "Tri-fold marketing brochure", img: "https://placehold.co/600x400/2d3436/ffffff?text=Tri-Fold+Brochure" },
  { id: "c0000000-0000-0000-0000-000000000020", categoryId: "a0000000-0000-0000-0000-000000000003", name: "A2 Poster", slug: "a2-poster", base: 199, desc: "Standard A2 poster", img: "https://placehold.co/600x400/6c5ce7/ffffff?text=A2+Poster" },
  { id: "c0000000-0000-0000-0000-000000000021", categoryId: "a0000000-0000-0000-0000-000000000003", name: "A1 Poster", slug: "a1-poster", base: 349, desc: "Large A1 poster", img: "https://placehold.co/600x400/6c5ce7/ffffff?text=A1+Poster" },
  { id: "c0000000-0000-0000-0000-000000000022", categoryId: "a0000000-0000-0000-0000-000000000003", name: "24x36 Poster", slug: "24x36-poster", base: 599, desc: "Large format 24x36 poster", img: "https://placehold.co/600x400/6c5ce7/ffffff?text=24x36+Poster" },
  { id: "c0000000-0000-0000-0000-000000000030", categoryId: "a0000000-0000-0000-0000-000000000004", name: "Vinyl Banner 2x6", slug: "vinyl-banner-2x6", base: 899, desc: "Durable vinyl banner", img: "https://placehold.co/600x400/00b894/ffffff?text=Vinyl+Banner" },
  { id: "c0000000-0000-0000-0000-000000000031", categoryId: "a0000000-0000-0000-0000-000000000004", name: "Vinyl Banner 3x8", slug: "vinyl-banner-3x8", base: 1499, desc: "Large vinyl banner", img: "https://placehold.co/600x400/00b894/ffffff?text=Vinyl+Banner+3x8" },
  { id: "c0000000-0000-0000-0000-000000000032", categoryId: "a0000000-0000-0000-0000-000000000004", name: "Rollup Standee", slug: "rollup-standee", base: 2499, desc: "Portable rollup stand", img: "https://placehold.co/600x400/00b894/ffffff?text=Rollup+Standee" },
  { id: "c0000000-0000-0000-0000-000000000040", categoryId: "a0000000-0000-0000-0000-000000000005", name: "Letterhead A4", slug: "letterhead-a4", base: 99, desc: "Custom letterhead", img: "https://placehold.co/600x400/f8f9fa/333333?text=Letterhead" },
  { id: "c0000000-0000-0000-0000-000000000041", categoryId: "a0000000-0000-0000-0000-000000000005", name: "Envelope", slug: "envelope-printing", base: 49, desc: "Printed envelope", img: "https://placehold.co/600x400/f8f9fa/333333?text=Envelope" },
  { id: "c0000000-0000-0000-0000-000000000042", categoryId: "a0000000-0000-0000-0000-000000000005", name: "Invoice Book", slug: "invoice-book", base: 299, desc: "Custom invoice book", img: "https://placehold.co/600x400/f8f9fa/333333?text=Invoice+Book" },
  { id: "c0000000-0000-0000-0000-000000000050", categoryId: "a0000000-0000-0000-0000-000000000006", name: "Round Sticker", slug: "round-sticker", base: 99, desc: "Custom round stickers", img: "https://placehold.co/600x400/fd79a8/ffffff?text=Round+Sticker" },
  { id: "c0000000-0000-0000-0000-000000000051", categoryId: "a0000000-0000-0000-0000-000000000006", name: "Square Sticker", slug: "square-sticker", base: 79, desc: "Custom square stickers", img: "https://placehold.co/600x400/fd79a8/ffffff?text=Square+Sticker" },
  { id: "c0000000-0000-0000-0000-000000000052", categoryId: "a0000000-0000-0000-0000-000000000006", name: "Barcode Label", slug: "barcode-label", base: 49, desc: "Barcode labels roll", img: "https://placehold.co/600x400/fd79a8/ffffff?text=Barcode+Label" },
  { id: "c0000000-0000-0000-0000-000000000060", categoryId: "a0000000-0000-0000-0000-000000000007", name: "Wedding Card", slug: "wedding-card", base: 299, desc: "Traditional wedding invitation", img: "https://placehold.co/600x400/e17055/ffffff?text=Wedding+Card" },
  { id: "c0000000-0000-0000-0000-000000000061", categoryId: "a0000000-0000-0000-0000-000000000007", name: "Birthday Invite", slug: "birthday-invite", base: 149, desc: "Birthday party invitation", img: "https://placehold.co/600x400/e17055/ffffff?text=Birthday+Invite" },
  { id: "c0000000-0000-0000-0000-000000000062", categoryId: "a0000000-0000-0000-0000-000000000007", name: "Event Program", slug: "event-program", base: 199, desc: "Event program printable", img: "https://placehold.co/600x400/e17055/ffffff?text=Event+Program" },
  { id: "c0000000-0000-0000-0000-000000000070", categoryId: "a0000000-0000-0000-0000-000000000008", name: "White Mug", slug: "white-mug", base: 249, desc: "Single color print", img: "https://placehold.co/600x400/ffffff/333333?text=White+Mug" },
  { id: "c0000000-0000-0000-0000-000000000071", categoryId: "a0000000-0000-0000-0000-000000000008", name: "Magic Mug", slug: "magic-mug", base: 399, desc: "Heat-changing mug", img: "https://placehold.co/600x400/2d3436/ffffff?text=Magic+Mug" },
  { id: "c0000000-0000-0000-0000-000000000072", categoryId: "a0000000-0000-0000-0000-000000000008", name: "Travel Tumbler", slug: "travel-tumbler", base: 599, desc: "Custom travel tumbler", img: "https://placehold.co/600x400/636e72/ffffff?text=Travel+Tumbler" },
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

  console.log("Seeding categories...");
  await supabase.from("product_categories").upsert(DEMO_CATEGORIES);

  console.log("Seeding templates...");
  
  // Map product types to template designs
  const templateMap: Record<string, { json: string; colors: string[] }> = {
    "Standard Business Card": TEMPLATE_DESIGNS["minimal-business-card"],
    "Premium Glossy Card": TEMPLATE_DESIGNS["modern-business-card"],
    "Matte Soft Touch": TEMPLATE_DESIGNS["creative-business-card"],
    "Spot UV Business Card": TEMPLATE_DESIGNS["modern-business-card"],
    "Gold Foil Card": TEMPLATE_DESIGNS["creative-business-card"],
    "A5 Flyer": TEMPLATE_DESIGNS["a5-flyer"],
    "A4 Flyer": TEMPLATE_DESIGNS["a4-flyer"],
    "Tri-Fold Brochure": TEMPLATE_DESIGNS["a4-flyer"],
    "A2 Poster": TEMPLATE_DESIGNS["poster"],
    "A1 Poster": TEMPLATE_DESIGNS["poster"],
    "24x36 Poster": TEMPLATE_DESIGNS["poster"],
    // Default for others
    "default": TEMPLATE_DESIGNS["minimal-business-card"],
  };
  
  const templateRecords = TEMPLATES.map(t => {
    const design = templateMap[t.name] || templateMap["default"];
    return {
      id: t.id,
      name: t.name,
      konva_json: design?.json || "{}",
      width_inches: t.width,
      height_inches: t.height,
      bleed_inches: 0.125,
      color_options: design?.colors ? JSON.stringify(design.colors) : "[]",
    };
  });
  
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