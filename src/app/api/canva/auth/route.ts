import { NextResponse } from "next/server";
import { initiateOAuthFlow } from "@/lib/canva/oauth-flow";

/**
 * Thin adapter: translates HTTP request to OAuth module interface
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const productId = searchParams.get("productId") || undefined;
  const variationId = searchParams.get("variationId") || undefined;
  const templateId = searchParams.get("templateId") || undefined;

  // Verify user ID is present
  if (!userId) {
    return NextResponse.json(
      { error: "Please log in to use Canva Edit" },
      { status: 401 }
    );
  }

  try {
    // Delegate to deep module
    const authUrl = await initiateOAuthFlow({
      userId,
      productId,
      variationId,
      templateId,
    });

    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error("OAuth initiation failed:", error);
    
    return NextResponse.json(
      { 
        error: error.message || "Failed to initialize OAuth flow",
        code: error.code,
      },
      { status: error.code === 'CONFIG_MISSING' ? 500 : 400 }
    );
  }
}
