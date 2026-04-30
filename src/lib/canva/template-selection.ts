/**
 * Template Selection Flow Module
 * 
 * A deep module that handles the complete template selection flow.
 * Hides template fetching, OAuth URL construction, and error handling.
 * 
 * Interface (what callers must know):
 * - useTemplateSelection(category, context) → { templates, loading, error, startWithTemplate }
 * - getTemplatesForCategory(category) → Promise<Template[]>
 * 
 * Implementation (what's hidden):
 * - API endpoint structure
 * - Response shape extraction
 * - OAuth URL construction
 * - Error handling and fallback
 * - Loading state management
 */

import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// Types (part of the interface)
// ============================================================================

export interface CanvaTemplate {
  id: string;
  canva_template_id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  product_category: string;
}

export interface TemplateSelectionContext {
  userId?: string;
  productId?: string;
  variationId?: string;
}

export interface TemplateSelectionResult {
  templates: CanvaTemplate[];
  loading: boolean;
  error: string | null;
  startWithTemplate: (templateId: string | null) => string;
}

// ============================================================================
// API Functions (internal)
// ============================================================================

/**
 * Fetches templates for a given category.
 * 
 * @param category - Product category
 * @returns Promise resolving to templates array
 */
export async function getTemplatesForCategory(
  category: string
): Promise<CanvaTemplate[]> {
  const response = await fetch(
    `/api/canva/templates?category=${encodeURIComponent(category)}`
  );

  if (!response.ok) {
    throw new Error('Failed to load templates');
  }

  const data = await response.json();
  return data.templates || [];
}

/**
 * Constructs OAuth authorization URL with template selection.
 * 
 * @param templateId - Selected template ID (null for blank canvas)
 * @param context - OAuth context (userId, productId, variationId)
 * @returns OAuth authorization URL
 */
export function buildOAuthUrl(
  templateId: string | null,
  context: TemplateSelectionContext
): string {
  const params = new URLSearchParams();
  
  if (context.userId) params.set('userId', context.userId);
  if (context.productId) params.set('productId', context.productId);
  if (context.variationId) params.set('variationId', context.variationId);
  if (templateId) params.set('templateId', templateId);

  return `/api/canva/auth?${params.toString()}`;
}

// ============================================================================
// Public Interface
// ============================================================================

/**
 * Hook for managing template selection flow.
 * 
 * Automatically handles:
 * - Template fetching
 * - Loading states
 * - Error handling
 * - OAuth URL construction
 * 
 * @param category - Product category
 * @param context - OAuth context
 * @returns Template selection state and actions
 */
export function useTemplateSelection(
  category: string,
  context: TemplateSelectionContext
): TemplateSelectionResult {
  const [templates, setTemplates] = useState<CanvaTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchTemplates() {
      try {
        setLoading(true);
        setError(null);

        const fetchedTemplates = await getTemplatesForCategory(category);
        
        if (!cancelled) {
          setTemplates(fetchedTemplates);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error fetching templates:', err);
          setError('Unable to load templates. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchTemplates();

    return () => {
      cancelled = true;
    };
  }, [category]);

  const startWithTemplate = useCallback(
    (templateId: string | null): string => {
      return buildOAuthUrl(templateId, context);
    },
    [context]
  );

  return {
    templates,
    loading,
    error,
    startWithTemplate,
  };
}

/**
 * Validates template selection context.
 * 
 * @param context - Template selection context
 * @returns True if context is valid
 */
export function isValidContext(context: TemplateSelectionContext): boolean {
  // userId is required for OAuth
  return !!context.userId;
}

/**
 * Gets fallback OAuth URL (blank canvas).
 * 
 * @param context - OAuth context
 * @returns OAuth URL for blank canvas
 */
export function getBlankCanvasUrl(context: TemplateSelectionContext): string {
  return buildOAuthUrl(null, context);
}
