import { NextResponse } from "next/server";
import { completeOAuthFlow, type OAuthError } from "@/lib/canva/oauth-flow";

/**
 * Thin adapter: translates HTTP callback to OAuth module interface
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Check for errors from Canva
  if (error) {
    return NextResponse.json(
      { error: `Canva auth error: ${error}` },
      { status: 400 }
    );
  }

  // Validate required parameters
  if (!state) {
    return NextResponse.json(
      { error: "No state parameter provided" },
      { status: 400 }
    );
  }

  if (!code) {
    return NextResponse.json(
      { error: "No authorization code provided" },
      { status: 400 }
    );
  }

  try {
    // Delegate to deep module
    const result = await completeOAuthFlow({ code, state });

    console.log("Redirecting to Canva editor:", result.canvaEditorUrl);
    return NextResponse.redirect(result.canvaEditorUrl);

  } catch (err: any) {
    console.error("OAuth callback error:", err);
    
    const oauthError = err as OAuthError;
    const statusCode = 
      oauthError.code === 'INVALID_STATE' || oauthError.code === 'EXPIRED_STATE' ? 400 :
      oauthError.code === 'CONFIG_MISSING' ? 500 :
      oauthError.code === 'TOKEN_EXCHANGE_FAILED' ? 500 :
      oauthError.code === 'DESIGN_CREATION_FAILED' ? 500 :
      500;

    return NextResponse.json(
      { 
        error: err.message || "OAuth flow failed",
        code: oauthError.code,
        details: oauthError.details,
      },
      { status: statusCode }
    );
  }
}
