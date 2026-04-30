# Template Selection Integration Example

This document shows how to integrate the template selection feature into your product pages.

## Basic Integration

### Option 1: Direct Link to Template Selection

Replace your existing "Edit in Canva" button with a link to the template selection page:

```tsx
// Before (direct to OAuth)
<button
  onClick={() => {
    window.location.href = `/api/canva/auth?userId=${userId}&productId=${productId}`;
  }}
>
  Edit in Canva
</button>

// After (via template selection)
<button
  onClick={() => {
    window.location.href = `/canva/select-template?category=${category}&productId=${productId}&userId=${userId}`;
  }}
>
  Edit in Canva
</button>
```

### Option 2: Component-Based Integration

```tsx
import { useRouter } from 'next/navigation';

interface EditInCanvaButtonProps {
  productId: string;
  variationId?: string;
  category: string;
  userId: string;
}

export function EditInCanvaButton({ 
  productId, 
  variationId, 
  category,
  userId 
}: EditInCanvaButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    const params = new URLSearchParams({
      category,
      productId,
      userId,
    });
    
    if (variationId) {
      params.set('variationId', variationId);
    }

    router.push(`/canva/select-template?${params.toString()}`);
  };

  return (
    <button
      onClick={handleClick}
      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      Edit in Canva
    </button>
  );
}
```

## Category Mapping

Map your product types to template categories:

```tsx
const PRODUCT_CATEGORY_MAP: Record<string, string> = {
  'business-cards': 'business_cards',
  'flyers': 'flyers',
  'posters': 'posters',
  'brochures': 'brochures',
  'banners': 'banners',
  'invitations': 'invitations',
  'postcards': 'postcards',
  // Add more mappings as needed
};

function getTemplateCategory(productType: string): string {
  return PRODUCT_CATEGORY_MAP[productType] || 'other';
}
```

## Complete Example: Product Page

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  type: string;
  variations: Array<{
    id: string;
    name: string;
  }>;
}

interface ProductPageProps {
  product: Product;
  userId: string;
}

export default function ProductPage({ product, userId }: ProductPageProps) {
  const router = useRouter();
  const [selectedVariation, setSelectedVariation] = useState(
    product.variations[0]?.id
  );

  const handleEditInCanva = () => {
    // Map product type to template category
    const categoryMap: Record<string, string> = {
      'business-cards': 'business_cards',
      'flyers': 'flyers',
      'posters': 'posters',
    };
    
    const category = categoryMap[product.type] || 'other';

    // Build URL with parameters
    const params = new URLSearchParams({
      category,
      productId: product.id,
      userId,
    });

    if (selectedVariation) {
      params.set('variationId', selectedVariation);
    }

    // Navigate to template selection
    router.push(`/canva/select-template?${params.toString()}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
      
      {/* Variation selector */}
      {product.variations.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Select Variation
          </label>
          <select
            value={selectedVariation}
            onChange={(e) => setSelectedVariation(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            {product.variations.map((variation) => (
              <option key={variation.id} value={variation.id}>
                {variation.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Edit in Canva button */}
      <button
        onClick={handleEditInCanva}
        className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
      >
        Edit in Canva
      </button>
    </div>
  );
}
```

## Skip Template Selection (Direct to Blank Canvas)

If you want to offer both options:

```tsx
export function CanvaEditOptions({ productId, userId, category }: Props) {
  const router = useRouter();

  const handleWithTemplates = () => {
    router.push(
      `/canva/select-template?category=${category}&productId=${productId}&userId=${userId}`
    );
  };

  const handleBlankCanvas = () => {
    // Direct to OAuth without template selection
    router.push(
      `/api/canva/auth?productId=${productId}&userId=${userId}`
    );
  };

  return (
    <div className="flex gap-4">
      <button
        onClick={handleWithTemplates}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Choose Template
      </button>
      <button
        onClick={handleBlankCanvas}
        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
      >
        Blank Canvas
      </button>
    </div>
  );
}
```

## Authentication Check

Ensure user is authenticated before allowing Canva edit:

```tsx
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export function EditInCanvaButton({ productId, category }: Props) {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const handleClick = async () => {
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // Redirect to login
      router.push('/login?redirect=/canva/select-template');
      return;
    }

    // Navigate to template selection
    const params = new URLSearchParams({
      category,
      productId,
      userId: session.user.id,
    });

    router.push(`/canva/select-template?${params.toString()}`);
  };

  return (
    <button onClick={handleClick}>
      Edit in Canva
    </button>
  );
}
```

## Error Handling

Handle errors gracefully:

```tsx
export function EditInCanvaButton({ productId, category, userId }: Props) {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleClick = async () => {
    try {
      setError(null);

      // Validate required parameters
      if (!userId) {
        throw new Error('Please log in to use Canva editor');
      }

      if (!productId) {
        throw new Error('Product information is missing');
      }

      // Navigate to template selection
      const params = new URLSearchParams({
        category: category || 'other',
        productId,
        userId,
      });

      router.push(`/canva/select-template?${params.toString()}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}
      <button onClick={handleClick}>
        Edit in Canva
      </button>
    </div>
  );
}
```

## Loading State

Show loading state during navigation:

```tsx
export function EditInCanvaButton({ productId, category, userId }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = () => {
    setLoading(true);
    
    const params = new URLSearchParams({
      category,
      productId,
      userId,
    });

    router.push(`/canva/select-template?${params.toString()}`);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
    >
      {loading ? (
        <>
          <span className="animate-spin mr-2">⏳</span>
          Loading...
        </>
      ) : (
        'Edit in Canva'
      )}
    </button>
  );
}
```

## Analytics Tracking

Track template selection usage:

```tsx
export function EditInCanvaButton({ productId, category, userId }: Props) {
  const router = useRouter();

  const handleClick = () => {
    // Track analytics event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'canva_edit_start', {
        product_id: productId,
        category: category,
        user_id: userId,
      });
    }

    // Navigate to template selection
    const params = new URLSearchParams({
      category,
      productId,
      userId,
    });

    router.push(`/canva/select-template?${params.toString()}`);
  };

  return (
    <button onClick={handleClick}>
      Edit in Canva
    </button>
  );
}
```

## Summary

To integrate the template selection feature:

1. **Replace direct OAuth links** with links to `/canva/select-template`
2. **Pass required parameters**: category, productId, userId
3. **Map product types** to template categories
4. **Add authentication checks** before navigation
5. **Handle errors** gracefully
6. **Show loading states** for better UX
7. **Track analytics** for usage insights

The template selection page will handle the rest of the flow, including OAuth and design creation.
