/**
 * Utility functions for working with Canva templates
 */

/**
 * Extracts the template ID from a Canva template URL
 * Expected format: https://www.canva.com/templates/{templateId}/
 * 
 * @param url - The Canva template URL
 * @returns The extracted template ID or null if invalid
 */
export function extractCanvaTemplateId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    // Check if it's a Canva domain
    if (!urlObj.hostname.includes('canva.com')) {
      return null;
    }
    
    // Extract template ID from path
    // Pattern: /templates/{templateId}/ or /templates/{templateId}
    const match = urlObj.pathname.match(/\/templates\/([a-zA-Z0-9_-]+)/);
    
    if (match && match[1]) {
      return match[1];
    }
    
    return null;
  } catch (error) {
    // Invalid URL
    return null;
  }
}

/**
 * Validates if a string is a valid Canva template ID format
 * 
 * @param templateId - The template ID to validate
 * @returns True if valid format
 */
export function isValidCanvaTemplateId(templateId: string): boolean {
  // Canva template IDs are alphanumeric with hyphens and underscores
  return /^[a-zA-Z0-9_-]+$/.test(templateId);
}

/**
 * Constructs a Canva template URL from a template ID
 * 
 * @param templateId - The Canva template ID
 * @returns The full Canva template URL
 */
export function buildCanvaTemplateUrl(templateId: string): string {
  return `https://www.canva.com/templates/${templateId}/`;
}
