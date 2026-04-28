"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  ArrowLeft, Download, CheckCircle, RefreshCw, 
  Layers, Ruler, ChevronRight
} from "lucide-react";
import dynamic from "next/dynamic";

const CanvaEditor = dynamic(
  () => import("canva-editor").then((mod) => {
    const CanvaEditorComponent = mod.CanvaEditor;
    return (props: any) => <CanvaEditorComponent {...props} />;
  }),
  { 
    ssr: false, 
    loading: () => <EditorLoader /> 
  }
);

function EditorLoader() {
  return (
    <div className="flex items-center justify-center h-full bg-[#e5e5e5]">
      <div className="text-center">
        <RefreshCw className="h-8 w-8 mx-auto animate-spin text-accent mb-4" />
        <p className="text-foreground/60">Loading editor...</p>
      </div>
    </div>
  );
}

interface CanvaEditorDesignPageProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    base_price: number;
    thumbnail_url: string | null;
  };
  categorySlug: string | null;
  templates: Array<{ id: string; name: string; thumbnail_url: string | null }>;
}

const PRODUCT_SPECS: Record<string, { width: number; height: number; widthIn: number; heightIn: number }> = {
  "standard-business-card": { width: 1050, height: 600, widthIn: 3.5, heightIn: 2 },
  "premium-glossy-card": { width: 1050, height: 600, widthIn: 3.5, heightIn: 2 },
  "matte-soft-touch": { width: 1050, height: 600, widthIn: 3.5, heightIn: 2 },
  "spot-uv-business-card": { width: 1050, height: 600, widthIn: 3.5, heightIn: 2 },
  "gold-foil-card": { width: 1050, height: 600, widthIn: 3.5, heightIn: 2 },
  "a5-flyer": { width: 1748, height: 2480, widthIn: 5.8, heightIn: 8.3 },
  "a4-flyer": { width: 2480, height: 3508, widthIn: 8.3, heightIn: 11.7 },
  "tri-fold-brochure": { width: 2480, height: 3508, widthIn: 8.3, heightIn: 11.7 },
  "a2-poster": { width: 4950, height: 7016, widthIn: 16.5, heightIn: 23.4 },
  "a1-poster": { width: 7016, height: 9933, widthIn: 23.4, heightIn: 33.1 },
};

type DesignState = "loading" | "ready" | "saving" | "saved" | "error";

export function CanvaEditorDesignPage({ product, categorySlug, templates }: CanvaEditorDesignPageProps) {
  const searchParams = useSearchParams();
  const variationId = searchParams.get("variationId") ?? "";
  const quantity = searchParams.get("qty") ?? "100";
  
  const [designState, setDesignState] = useState<DesignState>("loading");
  const [showEditor, setShowEditor] = useState(false);

  const spec = PRODUCT_SPECS[product.slug] ?? PRODUCT_SPECS["a4-flyer"];

  const editorConfig = {
    logoUrl: "/logo.svg",
    editorAssetsUrl: "/editor-assets",
    apis: {
      url: "",
      userToken: "",
      searchFonts: "/api/editor/fonts",
      searchTemplates: "/api/editor/templates",
      searchTexts: "/api/editor/texts",
      searchImages: "/api/editor/images",
      searchShapes: "/api/editor/shapes",
      searchFrames: "/api/editor/frames",
      fetchUserImages: "/api/editor/images",
      uploadUserImage: "/api/editor/images",
      removeUserImage: "/api/editor/images",
      templateKeywordSuggestion: "/api/editor/templates",
      textKeywordSuggestion: "/api/editor/texts",
      imageKeywordSuggestion: "/api/editor/images",
      shapeKeywordSuggestion: "/api/editor/shapes",
      frameKeywordSuggestion: "/api/editor/frames",
    },
    unsplash: {
      accessKey: "",
    },
  };

  const handleExportPNG = useCallback(async () => {
    setDesignState("saving");
    setTimeout(() => {
      setDesignState("saved");
      setTimeout(() => setDesignState("ready"), 2000);
    }, 1000);
  }, []);

  const handleProceedToCheckout = useCallback(() => {
    window.location.href = `/checkout?product=${product.slug}&variationId=${variationId}&qty=${quantity}`;
  }, [product.slug, variationId, quantity]);

  const handleStartEditing = useCallback(() => {
    setShowEditor(true);
  }, []);

  if (!showEditor) {
    return (
      <div className="flex h-[calc(100vh-64px)]">
        <aside className="w-80 shrink-0 flex flex-col border-r border-foreground/10 bg-surface-container">
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            <Link
              href={`/products/${categorySlug}/${product.slug}`}
              className="group inline-flex items-center gap-2 text-sm font-medium text-foreground/50 transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Product
            </Link>

            <div className="space-y-3">
              <h1 className="font-heading text-xl font-bold">{product.name}</h1>
              {product.description && (
                <p className="text-sm text-foreground/60">{product.description}</p>
              )}
              <p className="text-sm text-foreground/50">Quantity: {quantity}</p>
            </div>

            <div className="rounded-xl border border-foreground/10 bg-background p-4 space-y-3">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground/40">
                <Ruler className="h-3.5 w-3.5" />
                Print Specifications
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-foreground/50">Size</p>
                  <p className="font-medium">{spec.widthIn}" × {spec.heightIn}"</p>
                </div>
                <div>
                  <p className="text-foreground/50">Bleed</p>
                  <p className="font-medium">0.125"</p>
                </div>
                <div>
                  <p className="text-foreground/50">Resolution</p>
                  <p className="font-medium">300 DPI</p>
                </div>
                <div>
                  <p className="text-foreground/50">Format</p>
                  <p className="font-medium">CMYK</p>
                </div>
              </div>
            </div>

            {templates.length > 0 && (
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground/40">
                  <Layers className="h-3.5 w-3.5" />
                  Templates
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {templates.slice(0, 6).map(t => (
                    <div
                      key={t.id}
                      className="aspect-square rounded-lg bg-foreground/5 overflow-hidden cursor-pointer hover:ring-2 hover:ring-accent transition-all"
                      title={t.name}
                    >
                      {t.thumbnail_url ? (
                        <img src={t.thumbnail_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-2xl">🎨</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-5 border-t border-foreground/10 space-y-3">
            <button
              onClick={handleStartEditing}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-sm font-bold text-accent-foreground transition-all hover:bg-accent/90"
            >
              Start Designing
            </button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col bg-foreground/5">
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center space-y-6 max-w-lg">
              <div className="w-32 h-32 mx-auto rounded-2xl bg-accent/10 flex items-center justify-center">
                <span className="text-6xl">✏️</span>
              </div>
              <div>
                <h3 className="font-heading text-2xl font-bold">Ready to Design?</h3>
                <p className="mt-2 text-foreground/60">
                  Click "Start Designing" to launch the editor and create your {product.name} design.
                </p>
              </div>
              <button
                onClick={handleStartEditing}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-3.5 text-base font-bold text-accent-foreground transition-all hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/25"
              >
                Start Designing
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="flex items-center justify-between px-4 py-2 bg-surface-container border-b border-foreground/10">
        <div className="flex items-center gap-4">
          <Link
            href={`/products/${categorySlug}/${product.slug}`}
            className="flex items-center gap-2 text-sm font-medium text-foreground/50 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="h-6 w-px bg-foreground/10" />
          <h2 className="font-heading text-lg font-bold">{product.name}</h2>
          <span className="text-xs text-foreground/50">{spec.widthIn}" × {spec.heightIn}"</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPNG}
            disabled={designState === "saving"}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
          >
            {designState === "saving" ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export PNG
          </button>
          <button
            onClick={handleProceedToCheckout}
            className="flex items-center gap-2 rounded-lg border border-foreground/10 px-4 py-2 text-sm font-semibold hover:bg-foreground/5"
          >
            <ChevronRight className="h-4 w-4" />
            Checkout
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <CanvaEditor config={editorConfig} />
      </div>

      {designState === "saved" && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg">
          <CheckCircle className="h-4 w-4" />
          Design exported!
        </div>
      )}
    </div>
  );
}