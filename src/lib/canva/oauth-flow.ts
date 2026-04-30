/**
 * Canva OAuth Flow Module
 * 
 * A deep module that handles the complete OAuth flow with Canva, including:
 * - PKCE code generation and validation
 * - State management for CSRF protection
 * - Token exchange and encryption
 * - Design creation from templates with fallback
 * - Return navigation setup
 * 
 * This module provides high leverage: callers get "complete an OAuth flow"
 * instead of managing state, PKCE, tokens, encryption, and API calls.
 * 
 * Interface (what callers must know):
 * - initiateOAuthFlow({ userId, productId?, variationId?, templateId? })
 * - completeOAuthFlow({ code, state })
 * 
 * Implementation (what's hidden):
 * - PKCE generation/validation
 * - State storage/retrieval
 * - Token exchange with Canva
 * - Token encryption/storage
 * - Design creation with template fallback
 * - Error handling and recovery
 */

import crypto from "crypto";
import { encrypt } from "./crypto";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";

// ============================================================================
// Types (part of the interface)
// ============================================================================

export interface OAuthFlowContext {
  userId: string;
  productId?: string;
  variationId?: string;
  templateId?: string;
}

export interface OAuthFlowResult {
  canvaEditorUrl: string;
  correlationState: string;
}

export interface OAuthCallbackParams {
  code: string;
  state: string;
}

export interface OAuthError extends Error {
  code: 'INVALID_STATE' | 'EXPIRED_STATE' | 'TOKEN_EXCHANGE_FAILED' | 'DESIGN_CREATION_FAILED' | 'CONFIG_MISSING';
  details?: any;
}

// ============================================================================
// Configuration (internal)
// ============================================================================

interface CanvaConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

function getCanvaConfig(): CanvaConfig {
  const clientId = process.env.CANVA_CLIENT_ID;
  const clientSecret = process.env.CANVA_CLIENT_SECRET;
  const redirectUri = process.env.CANVA_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    const error = new Error("Canva configuration missing") as OAuthError;
    error.code = 'CONFIG_MISSING';
    error.details = { 
      hasClientId: !!clientId, 
      hasClientSecret: !!clientSecret, 
      hasRedirectUri: !!redirectUri 
    };
    throw error;
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
    scopes: [
      "asset:read",
      "asset:write",
      "design:content:read",
      "design:content:write",
      "design:meta:read",
      "profile:read"
    ],
  };
}

// ============================================================================
// PKCE Utilities (internal)
// ============================================================================

interface PKCEPair {
  verifier: string;
  challenge: string;
}

function generatePKCE(): PKCEPair {
  const verifier = crypto.randomBytes(96).toString("base64url");
  const challenge = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");
  
  return { verifier, challenge };
}

// ============================================================================
// State Management (internal)
// ============================================================================

interface StoredOAuthState {
  state: string;
  codeVerifier: string;
  userId: string;
  productId?: string;
  variationId?: string;
  templateId?: string;
  expiresAt: Date;
}

async function storeOAuthState(
  context: OAuthFlowContext,
  state: string,
  codeVerifier: string
): Promise<void> {
  const supabase = createSupabaseServiceRoleClient() as any;
  
  const insertData: any = {
    state,
    code_verifier: codeVerifier,
    user_id: context.userId,
    product_id: context.productId,
    variation_id: context.variationId,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
  };
  
  if (context.templateId) {
    insertData.template_id = context.templateId;
  }
  
  const { error } = await supabase
    .from("canva_oauth_states")
    .insert(insertData);
  
  if (error) {
    throw new Error(`Failed to store OAuth state: ${error.message}`);
  }
}

async function retrieveOAuthState(state: string): Promise<StoredOAuthState> {
  const supabase = createSupabaseServiceRoleClient() as any;
  
  const { data, error } = await supabase
    .from("canva_oauth_states")
    .select("*")
    .eq("state", state)
    .single();
  
  if (error || !data) {
    const err = new Error("Invalid or expired state parameter") as OAuthError;
    err.code = 'INVALID_STATE';
    err.details = { error: error?.message };
    throw err;
  }
  
  // Check expiration
  if (new Date(data.expires_at) < new Date()) {
    // Clean up expired state
    await supabase.from("canva_oauth_states").delete().eq("state", state);
    
    const err = new Error("State parameter has expired. Please try again.") as OAuthError;
    err.code = 'EXPIRED_STATE';
    throw err;
  }
  
  return {
    state: data.state,
    codeVerifier: data.code_verifier,
    userId: data.user_id,
    productId: data.product_id,
    variationId: data.variation_id,
    templateId: data.template_id,
    expiresAt: new Date(data.expires_at),
  };
}

async function extendStateExpiration(state: string, hours: number = 48): Promise<void> {
  const supabase = createSupabaseServiceRoleClient() as any;
  
  await supabase
    .from("canva_oauth_states")
    .update({
      expires_at: new Date(Date.now() + hours * 60 * 60 * 1000).toISOString(),
    })
    .eq("state", state);
}

// ============================================================================
// Token Management (internal)
// ============================================================================

interface CanvaTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<CanvaTokens> {
  const config = getCanvaConfig();
  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
  
  const response = await fetch("https://api.canva.com/rest/v1/oauth/token", {
    method: "POST",
    headers: { 
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${credentials}`
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      code_verifier: codeVerifier,
      redirect_uri: config.redirectUri,
    }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    const err = new Error(`Token exchange failed: ${data.error || data.error_description || JSON.stringify(data)}`) as OAuthError;
    err.code = 'TOKEN_EXCHANGE_FAILED';
    err.details = data;
    throw err;
  }
  
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

async function storeTokens(userId: string, tokens: CanvaTokens): Promise<void> {
  const supabase = createSupabaseServiceRoleClient() as any;
  
  const encryptedAccess = encrypt(tokens.accessToken);
  const encryptedRefresh = encrypt(tokens.refreshToken);
  const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000).toISOString();
  
  await supabase
    .from("canva_user_tokens")
    .upsert({
      user_id: userId,
      encrypted_access_token: encryptedAccess,
      encrypted_refresh_token: encryptedRefresh,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
}

// ============================================================================
// Design Creation (internal)
// ============================================================================

interface DesignCreationResult {
  designId: string;
  editUrl: string;
}

async function createDesignFromTemplate(
  accessToken: string,
  canvaTemplateId: string
): Promise<DesignCreationResult> {
  const response = await fetch("https://api.canva.com/rest/v1/designs", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: "Custom Design from Template",
      design_type: {
        type: "from_template",
        template_id: canvaTemplateId,
      },
    }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Template design creation failed: ${JSON.stringify(data)}`);
  }
  
  return {
    designId: data.design.id,
    editUrl: data.design.urls.edit_url,
  };
}

async function createBlankDesign(accessToken: string): Promise<DesignCreationResult> {
  const response = await fetch("https://api.canva.com/rest/v1/designs", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: "Custom Design - A4",
      design_type: {
        type: "custom",
        width: 2480,  // A4 width at 300 DPI (210mm)
        height: 3508  // A4 height at 300 DPI (297mm)
      },
    }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    const err = new Error(`Blank design creation failed: ${JSON.stringify(data)}`) as OAuthError;
    err.code = 'DESIGN_CREATION_FAILED';
    err.details = data;
    throw err;
  }
  
  return {
    designId: data.design.id,
    editUrl: data.design.urls.edit_url,
  };
}

async function createDesignWithFallback(
  accessToken: string,
  templateId?: string
): Promise<DesignCreationResult> {
  // If no template, create blank design
  if (!templateId) {
    console.log("No template selected, creating blank design");
    return createBlankDesign(accessToken);
  }
  
  // Try to retrieve template details
  const supabase = createSupabaseServiceRoleClient() as any;
  const { data: templateData, error: templateError } = await supabase
    .from("canva_templates")
    .select("canva_template_id")
    .eq("id", templateId)
    .single();
  
  if (templateError || !templateData) {
    console.warn("Template not found, falling back to blank design:", templateError);
    return createBlankDesign(accessToken);
  }
  
  const canvaTemplateId = templateData.canva_template_id;
  console.log("Using template:", canvaTemplateId);
  
  // Try to create from template, fall back to blank on failure
  try {
    return await createDesignFromTemplate(accessToken, canvaTemplateId);
  } catch (error) {
    console.warn("Template creation failed, falling back to blank design:", error);
    return createBlankDesign(accessToken);
  }
}

// ============================================================================
// Public Interface
// ============================================================================

/**
 * Initiates the OAuth flow with Canva.
 * 
 * Returns the authorization URL that the user should be redirected to.
 * The URL includes PKCE parameters and state for CSRF protection.
 * 
 * @param context - OAuth flow context (userId, optional productId, variationId, templateId)
 * @returns Authorization URL to redirect the user to
 */
export async function initiateOAuthFlow(context: OAuthFlowContext): Promise<string> {
  const config = getCanvaConfig();
  const state = crypto.randomUUID();
  const pkce = generatePKCE();
  
  // Store state and code verifier for callback validation
  await storeOAuthState(context, state, pkce.verifier);
  
  // Build authorization URL
  const authUrl = 
    `https://www.canva.com/api/oauth/authorize?` +
    `code_challenge=${pkce.challenge}&` +
    `code_challenge_method=S256&` +
    `client_id=${config.clientId}&` +
    `redirect_uri=${encodeURIComponent(config.redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(config.scopes.join(" "))}&` +
    `state=${encodeURIComponent(state)}`;
  
  return authUrl;
}

/**
 * Completes the OAuth flow after the user authorizes the app.
 * 
 * Validates the state, exchanges the authorization code for tokens,
 * encrypts and stores the tokens, creates a design (from template or blank),
 * and returns the Canva editor URL with correlation state for return navigation.
 * 
 * @param params - OAuth callback parameters (code, state)
 * @returns Result containing Canva editor URL and correlation state
 */
export async function completeOAuthFlow(
  params: OAuthCallbackParams
): Promise<OAuthFlowResult> {
  // Retrieve and validate state
  const storedState = await retrieveOAuthState(params.state);
  
  // Exchange authorization code for tokens
  const tokens = await exchangeCodeForTokens(params.code, storedState.codeVerifier);
  
  // Store encrypted tokens
  await storeTokens(storedState.userId, tokens);
  
  // Create design from template or blank canvas
  const design = await createDesignWithFallback(
    tokens.accessToken,
    storedState.templateId
  );
  
  // Extend state expiration for return navigation lookup
  // Canva limits correlation_state to 50 chars, so we reuse the state key
  await extendStateExpiration(params.state, 48);
  
  // Construct Canva editor URL with correlation state
  const separator = design.editUrl.includes('?') ? '&' : '?';
  const canvaEditorUrl = `${design.editUrl}${separator}correlation_state=${params.state}`;
  
  console.log("OAuth flow completed successfully:", {
    userId: storedState.userId,
    designId: design.designId,
    hasTemplate: !!storedState.templateId,
  });
  
  return {
    canvaEditorUrl,
    correlationState: params.state,
  };
}
