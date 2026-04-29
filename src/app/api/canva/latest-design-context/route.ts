import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type UserDesign = {
  product_id: string | null;
  variation_id: string | null;
  export_url: string | null;
  created_at: string;
};

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("user_designs")
      .select("product_id, variation_id, export_url, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const design = data as UserDesign | null;

    return NextResponse.json({
      productId: design?.product_id ?? null,
      variationId: design?.variation_id ?? null,
      imageUrl: design?.export_url ?? null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
