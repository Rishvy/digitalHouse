"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fabric } from "fabric";
import { ImageUploader } from "@/components/upload/ImageUploader";
import { useCartStore } from "@/stores/cartStore";

type ActiveTool = "text" | "templates" | "elements" | "uploads" | "settings" | null;

type ActiveSummary = {
  type: string;
  fill?: string;
  opacity?: number;
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  textAlign?: string;
  fontWeight?: string | number;
  fontStyle?: string;
  src?: string;
};

function parseTemplateFrame(templateJson: string): {
  width: number;
  height: number;
  background: string;
} {
  try {
    const parsed = JSON.parse(templateJson) as {
      attrs?: { width?: number; height?: number };
      children?: Array<{
        children?: Array<{ className?: string; attrs?: { fill?: string } }>;
      }>;
    };
    const width = Number(parsed?.attrs?.width ?? 1000);
    const height = Number(parsed?.attrs?.height ?? 600);
    const firstRect = parsed?.children?.[0]?.children?.find(
      (child) => child.className === "Rect",
    );
    const background = firstRect?.attrs?.fill ?? "#ffffff";
    return { width, height, background };
  } catch {
    return { width: 1000, height: 600, background: "#ffffff" };
  }
}

export default function VistaEditor({
  productId,
  variationId,
  qty,
  templateJson,
}: {
  productId: string;
  variationId: string;
  qty: number;
  templateJson: string;
}) {
  const frame = useMemo(() => parseTemplateFrame(templateJson), [templateJson]);
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const [active, setActive] = useState<ActiveSummary | null>(null);
  const [zoom, setZoom] = useState(1);
  const [savedFlash, setSavedFlash] = useState(false);
  const [showRulers, setShowRulers] = useState(true);
  const [showSizeDialog, setShowSizeDialog] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState(frame.width);
  const [canvasHeight, setCanvasHeight] = useState(frame.height);
  const [unit, setUnit] = useState<"px" | "cm" | "in">("cm");
  const [measurementTool, setMeasurementTool] = useState(false);
  const [measureStart, setMeasureStart] = useState<{ x: number; y: number } | null>(null);
  const [measureEnd, setMeasureEnd] = useState<{ x: number; y: number } | null>(null);
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);

  const updateActive = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (!obj) {
      setActive(null);
      return;
    }
    const summary: ActiveSummary = {
      type: obj.type ?? "object",
      fill: typeof obj.fill === "string" ? obj.fill : undefined,
      opacity: obj.opacity,
    };
    if (obj.type === "textbox" || obj.type === "i-text") {
      const t = obj as fabric.IText | fabric.Textbox;
      summary.text = t.text;
      summary.fontFamily = t.fontFamily;
      summary.fontSize = t.fontSize;
      summary.textAlign = t.textAlign;
      summary.fontWeight = t.fontWeight;
      summary.fontStyle = t.fontStyle;
    }
    if (obj.type === "image") {
      summary.src = (obj as fabric.Image).getSrc?.();
    }
    setActive(summary);
  }, []);

  const fitCanvasToContainer = useCallback(() => {
    const canvas = fabricRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const padding = showRulers ? 120 : 80;
    const availableWidth = container.clientWidth - padding;
    const availableHeight = container.clientHeight - padding;
    if (availableWidth <= 0 || availableHeight <= 0) return;
    const scale = Math.min(availableWidth / canvasWidth, availableHeight / canvasHeight, 1);
    canvas.setZoom(scale);
    canvas.setWidth(canvasWidth * scale);
    canvas.setHeight(canvasHeight * scale);
    setZoom(scale);
    canvas.requestRenderAll();
  }, [canvasHeight, canvasWidth, showRulers]);

  const getCanvas = () => fabricRef.current;

  const removeSelected = useCallback(() => {
    const canvas = getCanvas();
    if (!canvas) return;
    canvas.getActiveObjects().forEach((obj) => canvas.remove(obj));
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    setActive(null);
  }, []);

  const duplicateSelected = useCallback(() => {
    const canvas = getCanvas();
    if (!canvas) return;
    const src = canvas.getActiveObject();
    if (!src) return;
    src.clone((cloned: fabric.Object) => {
      cloned.set({ left: (src.left ?? 0) + 20, top: (src.top ?? 0) + 20, evented: true });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.requestRenderAll();
      updateActive();
    });
  }, [updateActive]);

  useEffect(() => {
    if (!canvasElRef.current) return;
    const canvas = new fabric.Canvas(canvasElRef.current, {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: frame.background,
      preserveObjectStacking: true,
      selection: true,
    });
    fabricRef.current = canvas;

    canvas.on("selection:created", updateActive);
    canvas.on("selection:updated", updateActive);
    canvas.on("selection:cleared", () => setActive(null));
    canvas.on("object:modified", updateActive);

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!canvas) return;
      
      // Delete key
      if (e.key === "Delete" || e.key === "Backspace") {
        const activeObj = canvas.getActiveObject();
        if (activeObj && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
          e.preventDefault();
          removeSelected();
        }
      }
      
      // Cmd/Ctrl + D for duplicate
      if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        e.preventDefault();
        duplicateSelected();
      }
      
      // Escape to deselect
      if (e.key === "Escape") {
        canvas.discardActiveObject();
        canvas.requestRenderAll();
        setActive(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    fitCanvasToContainer();
    const onWindowResize = () => fitCanvasToContainer();
    window.addEventListener("resize", onWindowResize);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", onWindowResize);
      canvas.dispose();
      fabricRef.current = null;
    };
  }, [fitCanvasToContainer, frame.background, canvasHeight, canvasWidth, updateActive, removeSelected, duplicateSelected]);

  const convertToPixels = (value: number, fromUnit: "px" | "cm" | "in"): number => {
    if (fromUnit === "px") return value;
    if (fromUnit === "cm") return value * 37.795; // 1cm = 37.795px at 96 DPI
    if (fromUnit === "in") return value * 96; // 1in = 96px at 96 DPI
    return value;
  };

  const convertFromPixels = (value: number, toUnit: "px" | "cm" | "in"): number => {
    if (toUnit === "px") return value;
    if (toUnit === "cm") return value / 37.795;
    if (toUnit === "in") return value / 96;
    return value;
  };

  const applyCanvasSize = (width: number, height: number, fromUnit: "px" | "cm" | "in") => {
    const widthPx = convertToPixels(width, fromUnit);
    const heightPx = convertToPixels(height, fromUnit);
    setCanvasWidth(widthPx);
    setCanvasHeight(heightPx);
    
    const canvas = getCanvas();
    if (canvas) {
      canvas.setWidth(widthPx);
      canvas.setHeight(heightPx);
      fitCanvasToContainer();
    }
    setShowSizeDialog(false);
  };

  const addText = () => {
    const canvas = getCanvas();
    if (!canvas) return;
    const text = new fabric.Textbox("Type text here", {
      left: canvasWidth / 2 - 100,
      top: canvasHeight / 2 - 25,
      width: 200,
      fontSize: 36,
      fontFamily: "Manrope",
      fill: "#2d2f2f",
      textAlign: "left",
      editable: true,
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.requestRenderAll();
    updateActive();
  };

  const addRectangle = () => {
    const canvas = getCanvas();
    if (!canvas) return;
    const rect = new fabric.Rect({
      left: canvasWidth / 2 - 100,
      top: canvasHeight / 2 - 75,
      width: 200,
      height: 150,
      fill: "#ffd709",
      rx: 4,
      ry: 4,
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.requestRenderAll();
    updateActive();
  };

  const addCircle = () => {
    const canvas = getCanvas();
    if (!canvas) return;
    const circle = new fabric.Circle({
      left: canvasWidth / 2 - 75,
      top: canvasHeight / 2 - 75,
      radius: 75,
      fill: "#e7e8e8",
    });
    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.requestRenderAll();
    updateActive();
  };

  const addImage = (url: string) => {
    const canvas = getCanvas();
    if (!canvas) return;
    fabric.Image.fromURL(
      url,
      (img) => {
        if (!img) return;
        const maxW = canvasWidth * 0.5;
        const scale = img.width && img.width > maxW ? maxW / img.width : 1;
        img.set({
          left: canvasWidth / 2 - (img.width! * scale) / 2,
          top: canvasHeight / 2 - (img.height! * scale) / 2,
          scaleX: scale,
          scaleY: scale,
        });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.requestRenderAll();
        updateActive();
      },
      { crossOrigin: "anonymous" },
    );
  };

  const bringToFront = () => {
    const canvas = getCanvas();
    const obj = canvas?.getActiveObject();
    if (canvas && obj) {
      canvas.bringToFront(obj);
      canvas.requestRenderAll();
    }
  };

  const sendToBack = () => {
    const canvas = getCanvas();
    const obj = canvas?.getActiveObject();
    if (canvas && obj) {
      canvas.sendToBack(obj);
      canvas.requestRenderAll();
    }
  };

  const bringForward = () => {
    const canvas = getCanvas();
    const obj = canvas?.getActiveObject();
    if (canvas && obj) {
      canvas.bringForward(obj);
      canvas.requestRenderAll();
    }
  };

  const sendBackwards = () => {
    const canvas = getCanvas();
    const obj = canvas?.getActiveObject();
    if (canvas && obj) {
      canvas.sendBackwards(obj);
      canvas.requestRenderAll();
    }
  };

  const zoomIn = () => {
    const canvas = getCanvas();
    if (!canvas) return;
    const next = Math.min(4, zoom + 0.1);
    canvas.setZoom(next);
    canvas.setWidth(canvasWidth * next);
    canvas.setHeight(canvasHeight * next);
    setZoom(next);
  };

  const zoomOut = () => {
    const canvas = getCanvas();
    if (!canvas) return;
    const next = Math.max(0.25, zoom - 0.1);
    canvas.setZoom(next);
    canvas.setWidth(canvasWidth * next);
    canvas.setHeight(canvasHeight * next);
    setZoom(next);
  };

  const zoomFit = () => fitCanvasToContainer();

  const updateActiveObject = (patch: Record<string, unknown>) => {
    const canvas = getCanvas();
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    (obj as fabric.Object & { set: (p: Record<string, unknown>) => void }).set(patch);
    obj.setCoords();
    canvas.requestRenderAll();
    updateActive();
  };

  const saveDesign = () => {
    const canvas = getCanvas();
    if (!canvas) return null;
    const current = canvas.getZoom();
    canvas.setZoom(1);
    canvas.setWidth(canvasWidth);
    canvas.setHeight(canvasHeight);
    const json = canvas.toJSON([
      "selectable",
      "evented",
      "name",
      "data",
    ]);
    const thumbnail = canvas.toDataURL({ format: "png", multiplier: 0.5 });
    canvas.setZoom(current);
    canvas.setWidth(canvasWidth * current);
    canvas.setHeight(canvasHeight * current);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
    return { state: JSON.stringify(json), thumbnail };
  };

  const saveAndAddToCart = () => {
    const payload = saveDesign();
    if (!payload) return;
    addItem({
      id: crypto.randomUUID(),
      productId,
      variationId,
      quantity: qty,
      unitPrice: 0,
      designState: payload.state,
      thumbnailDataUrl: payload.thumbnail,
      productName: "Custom Product",
    });
    router.push("/cart");
  };

  const isTextActive = active?.type === "textbox" || active?.type === "i-text";
  const isShapeActive =
    active?.type === "rect" || active?.type === "circle" || active?.type === "triangle";

  return (
    <div className="flex h-screen flex-col bg-surface">
      {/* Top Navigation Bar */}
      <header className="flex h-14 items-center justify-between border-b border-surface-container px-4 bg-surface-container-lowest">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-on-surface/70 hover:text-on-surface"
          >
            ← Back
          </button>
          <span className="text-sm font-medium text-on-surface/60">|</span>
          <h1 className="font-headline text-sm font-semibold text-on-surface">Square Visiting Cards</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container transition-colors"
          >
            👁 Preview
          </button>
          <button
            type="button"
            onClick={saveAndAddToCart}
            className="rounded bg-primary-container px-6 py-2 text-sm font-semibold text-on-primary-fixed hover:bg-primary-container/90 transition-colors"
          >
            Next
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Tool Sidebar */}
        <aside className="flex w-20 flex-col items-center gap-1 bg-surface-container py-4">
          <button
            type="button"
            onClick={() => setActiveTool(activeTool === "text" ? null : "text")}
            className={`flex w-16 flex-col items-center gap-1 rounded py-3 text-xs uppercase transition-colors ${
              activeTool === "text"
                ? "bg-primary-container text-on-primary-fixed"
                : "text-on-surface/70 hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
              text_fields
            </span>
            <span>Text</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTool(activeTool === "uploads" ? null : "uploads")}
            className={`flex w-16 flex-col items-center gap-1 rounded py-3 text-xs uppercase transition-colors ${
              activeTool === "uploads"
                ? "bg-primary-container text-on-primary-fixed"
                : "text-on-surface/70 hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
              upload
            </span>
            <span>Uploads</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTool(activeTool === "elements" ? null : "elements")}
            className={`flex w-16 flex-col items-center gap-1 rounded py-3 text-xs uppercase transition-colors ${
              activeTool === "elements"
                ? "bg-primary-container text-on-primary-fixed"
                : "text-on-surface/70 hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
              category
            </span>
            <span>Graphics</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTool(activeTool === "templates" ? null : "templates")}
            className={`flex w-16 flex-col items-center gap-1 rounded py-3 text-xs uppercase transition-colors ${
              activeTool === "templates"
                ? "bg-primary-container text-on-primary-fixed"
                : "text-on-surface/70 hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
              dashboard
            </span>
            <span>Template</span>
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setShowSizeDialog(true)}
            className="flex w-16 flex-col items-center gap-1 rounded py-3 text-xs uppercase transition-colors text-on-surface/70 hover:bg-surface-container-high"
            title="Canvas Size"
          >
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
              photo_size_select_large
            </span>
            <span>Size</span>
          </button>
          <button
            type="button"
            onClick={() => setShowRulers(!showRulers)}
            className={`flex w-16 flex-col items-center gap-1 rounded py-3 text-xs uppercase transition-colors ${
              showRulers
                ? "bg-primary-container text-on-primary-fixed"
                : "text-on-surface/70 hover:bg-surface-container-high"
            }`}
            title="Toggle Rulers"
          >
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
              straighten
            </span>
            <span>Rulers</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMeasurementTool(!measurementTool);
              setMeasureStart(null);
              setMeasureEnd(null);
            }}
            className={`flex w-16 flex-col items-center gap-1 rounded py-3 text-xs uppercase transition-colors ${
              measurementTool
                ? "bg-primary-container text-on-primary-fixed"
                : "text-on-surface/70 hover:bg-surface-container-high"
            }`}
            title="Measurement Tool"
          >
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
              square_foot
            </span>
            <span>Measure</span>
          </button>
        </aside>

        {/* Asset Panel */}
        {activeTool && (
          <aside className="w-72 overflow-y-auto bg-surface-container-lowest p-4">
            {activeTool === "text" && (
              <div className="space-y-4">
                <h2 className="font-headline text-base font-semibold text-on-surface">Text</h2>
                <p className="text-xs text-on-surface/60">
                  Edit your text below, or click on the field you'd like to edit directly on your design.
                </p>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-on-surface/70">Type text here</label>
                  <input
                    type="text"
                    placeholder="Type text here"
                    className="w-full rounded bg-surface-container px-3 py-2 text-sm border border-outline-variant/20 focus:border-primary focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={addText}
                  className="w-full rounded bg-primary-container py-3 text-sm font-semibold text-on-primary-fixed hover:bg-primary-container/90 transition-colors"
                >
                  New Text Field
                </button>
                <div className="pt-4 border-t border-outline-variant/20">
                  <p className="text-xs text-on-surface/60 mb-3">Quick text styles</p>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        const canvas = getCanvas();
                        if (!canvas) return;
                        const text = new fabric.Textbox("Your Name", {
                          left: frame.width / 2 - 100,
                          top: frame.height / 2 - 25,
                          width: 200,
                          fontSize: 24,
                          fontFamily: "Space Grotesk",
                          fontWeight: "bold",
                          fill: "#2d2f2f",
                          textAlign: "center",
                          editable: true,
                        });
                        canvas.add(text);
                        canvas.setActiveObject(text);
                        canvas.requestRenderAll();
                        updateActive();
                      }}
                      className="w-full rounded bg-surface-container px-3 py-2 text-left text-sm hover:bg-surface-container-high transition-colors"
                    >
                      <div className="font-headline font-bold">Heading</div>
                      <div className="text-xs text-on-surface/60">Space Grotesk Bold</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const canvas = getCanvas();
                        if (!canvas) return;
                        const text = new fabric.Textbox("Your text here", {
                          left: frame.width / 2 - 100,
                          top: frame.height / 2 - 25,
                          width: 200,
                          fontSize: 16,
                          fontFamily: "Manrope",
                          fill: "#2d2f2f",
                          textAlign: "left",
                          editable: true,
                        });
                        canvas.add(text);
                        canvas.setActiveObject(text);
                        canvas.requestRenderAll();
                        updateActive();
                      }}
                      className="w-full rounded bg-surface-container px-3 py-2 text-left text-sm hover:bg-surface-container-high transition-colors"
                    >
                      <div className="font-body">Body Text</div>
                      <div className="text-xs text-on-surface/60">Manrope Regular</div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTool === "uploads" && (
              <div className="space-y-4">
                <h2 className="font-headline text-base font-semibold text-on-surface">Uploads</h2>
                <ImageUploader onUploadComplete={addImage} />
              </div>
            )}

            {activeTool === "elements" && (
              <div className="space-y-4">
                <h2 className="font-headline text-base font-semibold text-on-surface">Graphics</h2>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-on-surface/70 mb-2">Basic Shapes</h3>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={addRectangle}
                        className="aspect-square rounded bg-surface-container flex items-center justify-center hover:border-2 hover:border-primary-container transition-all"
                      >
                        <div className="h-12 w-12 rounded bg-primary-container" />
                      </button>
                      <button
                        type="button"
                        onClick={addCircle}
                        className="aspect-square rounded bg-surface-container flex items-center justify-center hover:border-2 hover:border-primary-container transition-all"
                      >
                        <div className="h-12 w-12 rounded-full bg-surface-container-high" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const canvas = getCanvas();
                          if (!canvas) return;
                          const triangle = new fabric.Triangle({
                            left: frame.width / 2 - 50,
                            top: frame.height / 2 - 50,
                            width: 100,
                            height: 100,
                            fill: "#e7e8e8",
                          });
                          canvas.add(triangle);
                          canvas.setActiveObject(triangle);
                          canvas.requestRenderAll();
                          updateActive();
                        }}
                        className="aspect-square rounded bg-surface-container flex items-center justify-center hover:border-2 hover:border-primary-container transition-all"
                      >
                        <div className="h-0 w-0 border-l-[24px] border-r-[24px] border-b-[42px] border-l-transparent border-r-transparent border-b-surface-container-high" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-on-surface/70 mb-2">Lines & Dividers</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const canvas = getCanvas();
                          if (!canvas) return;
                          const line = new fabric.Rect({
                            left: frame.width / 2 - 100,
                            top: frame.height / 2 - 2,
                            width: 200,
                            height: 4,
                            fill: "#2d2f2f",
                          });
                          canvas.add(line);
                          canvas.setActiveObject(line);
                          canvas.requestRenderAll();
                          updateActive();
                        }}
                        className="aspect-[2/1] rounded bg-surface-container flex items-center justify-center hover:border-2 hover:border-primary-container transition-all"
                      >
                        <div className="h-1 w-16 bg-on-surface" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const canvas = getCanvas();
                          if (!canvas) return;
                          const line = new fabric.Rect({
                            left: frame.width / 2 - 100,
                            top: frame.height / 2 - 1,
                            width: 200,
                            height: 2,
                            fill: "#acadad",
                          });
                          canvas.add(line);
                          canvas.setActiveObject(line);
                          canvas.requestRenderAll();
                          updateActive();
                        }}
                        className="aspect-[2/1] rounded bg-surface-container flex items-center justify-center hover:border-2 hover:border-primary-container transition-all"
                      >
                        <div className="h-px w-16 bg-outline-variant" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTool === "templates" && (
              <div className="space-y-4">
                <h2 className="font-headline text-base font-semibold text-on-surface">Business Card Templates</h2>
                <p className="text-xs text-on-surface/60">Select a template to start designing</p>
              </div>
            )}
          </aside>
        )}

        {/* Main Canvas Area */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {/* Context Toolbar */}
          <div className="flex h-14 items-center gap-2 border-b border-surface-container bg-white/80 px-4 backdrop-blur-md">
            {isTextActive && (
              <>
                <select
                  value={active?.fontFamily ?? "Manrope"}
                  onChange={(e) => updateActiveObject({ fontFamily: e.target.value })}
                  className="rounded border border-outline-variant/30 bg-surface-container-lowest px-3 py-1.5 text-sm"
                >
                  <option value="Manrope">Manrope</option>
                  <option value="Space Grotesk">Space Grotesk</option>
                  <option value="Arial">Arial</option>
                  <option value="Georgia">Georgia</option>
                </select>
                <div className="h-6 w-px bg-outline-variant/30" />
                <input
                  type="number"
                  min={8}
                  max={144}
                  value={Math.round(active?.fontSize ?? 36)}
                  onChange={(e) => updateActiveObject({ fontSize: Number(e.target.value) })}
                  className="w-16 rounded border border-outline-variant/30 bg-surface-container-lowest px-2 py-1.5 text-sm"
                />
                <div className="h-6 w-px bg-outline-variant/30" />
                <button
                  type="button"
                  onClick={() => updateActiveObject({ fontWeight: active?.fontWeight === "bold" ? "normal" : "bold" })}
                  className={`rounded px-3 py-1.5 text-sm font-bold transition-colors ${
                    active?.fontWeight === "bold" ? "bg-primary-container" : "hover:bg-surface-container"
                  }`}
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => updateActiveObject({ fontStyle: active?.fontStyle === "italic" ? "normal" : "italic" })}
                  className={`rounded px-3 py-1.5 text-sm italic transition-colors ${
                    active?.fontStyle === "italic" ? "bg-primary-container" : "hover:bg-surface-container"
                  }`}
                >
                  I
                </button>
                <div className="h-6 w-px bg-outline-variant/30" />
                <button
                  type="button"
                  onClick={() => updateActiveObject({ textAlign: "left" })}
                  className={`rounded px-3 py-1.5 text-sm transition-colors ${
                    active?.textAlign === "left" ? "bg-primary-container" : "hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
                    format_align_left
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => updateActiveObject({ textAlign: "center" })}
                  className={`rounded px-3 py-1.5 text-sm transition-colors ${
                    active?.textAlign === "center" ? "bg-primary-container" : "hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
                    format_align_center
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => updateActiveObject({ textAlign: "right" })}
                  className={`rounded px-3 py-1.5 text-sm transition-colors ${
                    active?.textAlign === "right" ? "bg-primary-container" : "hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
                    format_align_right
                  </span>
                </button>
                <div className="h-6 w-px bg-outline-variant/30" />
                <input
                  type="color"
                  value={active?.fill ?? "#2d2f2f"}
                  onChange={(e) => updateActiveObject({ fill: e.target.value })}
                  className="h-8 w-12 cursor-pointer rounded border border-outline-variant/30"
                />
              </>
            )}

            {active && (
              <>
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={bringToFront}
                  className="rounded px-3 py-1.5 text-sm hover:bg-surface-container transition-colors"
                  title="Bring to Front"
                >
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
                    flip_to_front
                  </span>
                </button>
                <button
                  type="button"
                  onClick={bringForward}
                  className="rounded px-3 py-1.5 text-sm hover:bg-surface-container transition-colors"
                  title="Bring Forward"
                >
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
                    arrow_upward
                  </span>
                </button>
                <button
                  type="button"
                  onClick={sendBackwards}
                  className="rounded px-3 py-1.5 text-sm hover:bg-surface-container transition-colors"
                  title="Send Backward"
                >
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
                    arrow_downward
                  </span>
                </button>
                <button
                  type="button"
                  onClick={sendToBack}
                  className="rounded px-3 py-1.5 text-sm hover:bg-surface-container transition-colors"
                  title="Send to Back"
                >
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
                    flip_to_back
                  </span>
                </button>
                <div className="h-6 w-px bg-outline-variant/30" />
                <button
                  type="button"
                  onClick={duplicateSelected}
                  className="rounded px-3 py-1.5 text-sm hover:bg-surface-container transition-colors"
                  title="Duplicate"
                >
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
                    content_copy
                  </span>
                </button>
                <button
                  type="button"
                  onClick={removeSelected}
                  className="rounded px-3 py-1.5 text-sm text-error hover:bg-error/10 transition-colors"
                  title="Delete"
                >
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
                    delete
                  </span>
                </button>
              </>
            )}
          </div>

          {/* Canvas Container */}
          <div
            ref={containerRef}
            className="relative flex flex-1 items-center justify-center overflow-auto bg-surface-container-low p-6"
          >
            <div className="relative">
              {/* Rulers */}
              {showRulers && (
                <>
                  {/* Horizontal Ruler (Top) */}
                  <div className="absolute -top-8 left-0 flex h-6 items-end bg-surface-container-lowest border-b border-outline-variant/30" style={{ width: `${canvasWidth * zoom}px` }}>
                    {Array.from({ length: Math.ceil(canvasWidth / 50) + 1 }).map((_, i) => {
                      const pos = i * 50;
                      if (pos > canvasWidth) return null;
                      const isMajor = pos % 100 === 0;
                      return (
                        <div
                          key={i}
                          className="absolute bottom-0 flex flex-col items-center"
                          style={{ left: `${pos * zoom}px` }}
                        >
                          <div
                            className={`${isMajor ? "h-3 w-px bg-on-surface" : "h-2 w-px bg-on-surface/40"}`}
                          />
                          {isMajor && (
                            <span className="absolute -top-4 text-[9px] text-on-surface/60">
                              {pos}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Vertical Ruler (Left) */}
                  <div className="absolute -left-8 top-0 flex w-6 flex-col items-end bg-surface-container-lowest border-r border-outline-variant/30" style={{ height: `${canvasHeight * zoom}px` }}>
                    {Array.from({ length: Math.ceil(canvasHeight / 50) + 1 }).map((_, i) => {
                      const pos = i * 50;
                      if (pos > canvasHeight) return null;
                      const isMajor = pos % 100 === 0;
                      return (
                        <div
                          key={i}
                          className="absolute right-0 flex items-center"
                          style={{ top: `${pos * zoom}px` }}
                        >
                          <div
                            className={`${isMajor ? "h-px w-3 bg-on-surface" : "h-px w-2 bg-on-surface/40"}`}
                          />
                          {isMajor && (
                            <span className="absolute -left-6 text-[9px] text-on-surface/60" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                              {pos}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Ruler Corner */}
                  <div className="absolute -left-8 -top-8 h-6 w-6 bg-surface-container border-r border-b border-outline-variant/30" />
                </>
              )}

              {/* Dimension Labels */}
              <div className={`absolute ${showRulers ? "-left-16" : "-left-12"} top-1/2 -translate-y-1/2 text-xs text-on-surface/60`}>
                {convertFromPixels(canvasHeight, "cm").toFixed(2)}cm
              </div>
              <div className={`absolute left-1/2 ${showRulers ? "-top-12" : "-top-8"} -translate-x-1/2 text-xs text-on-surface/60`}>
                {convertFromPixels(canvasWidth, "cm").toFixed(2)}cm
              </div>

              {/* Canvas with Shadow */}
              <div
                className="relative bg-white"
                style={{
                  boxShadow: "0 20px 40px rgba(45, 47, 47, 0.15)",
                }}
              >
                <canvas ref={canvasElRef} />
                
                {/* Measurement Tool Overlay */}
                {measurementTool && (
                  <div
                    className="absolute inset-0 cursor-crosshair"
                    onMouseDown={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = (e.clientX - rect.left) / zoom;
                      const y = (e.clientY - rect.top) / zoom;
                      setMeasureStart({ x, y });
                      setMeasureEnd({ x, y });
                    }}
                    onMouseMove={(e) => {
                      if (measureStart) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = (e.clientX - rect.left) / zoom;
                        const y = (e.clientY - rect.top) / zoom;
                        setMeasureEnd({ x, y });
                      }
                    }}
                    onMouseUp={() => {
                      // Keep the measurement visible
                    }}
                  >
                    {measureStart && measureEnd && (
                      <>
                        {/* Measurement Line */}
                        <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
                          <line
                            x1={measureStart.x * zoom}
                            y1={measureStart.y * zoom}
                            x2={measureEnd.x * zoom}
                            y2={measureEnd.y * zoom}
                            stroke="#ffd709"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                          />
                          <circle cx={measureStart.x * zoom} cy={measureStart.y * zoom} r="4" fill="#ffd709" />
                          <circle cx={measureEnd.x * zoom} cy={measureEnd.y * zoom} r="4" fill="#ffd709" />
                        </svg>
                        
                        {/* Measurement Label */}
                        <div
                          className="absolute rounded bg-primary-container px-2 py-1 text-xs font-semibold text-on-primary-fixed shadow-lg pointer-events-none"
                          style={{
                            left: `${((measureStart.x + measureEnd.x) / 2) * zoom}px`,
                            top: `${((measureStart.y + measureEnd.y) / 2) * zoom - 20}px`,
                            transform: 'translate(-50%, -100%)',
                          }}
                        >
                          {(() => {
                            const dx = measureEnd.x - measureStart.x;
                            const dy = measureEnd.y - measureStart.y;
                            const distancePx = Math.sqrt(dx * dx + dy * dy);
                            const distanceCm = convertFromPixels(distancePx, "cm");
                            return `${distancePx.toFixed(0)}px / ${distanceCm.toFixed(2)}cm`;
                          })()}
                        </div>
                      </>
                    )}
                  </div>
                )}
                
                {/* Safety Area and Bleed Indicators */}
                <div className="absolute top-2 right-2 flex gap-2">
                  <button className="rounded bg-white/90 px-3 py-1 text-xs font-medium text-on-surface/70 backdrop-blur hover:bg-white transition-colors">
                    Safety Area
                  </button>
                  <button className="rounded bg-white/90 px-3 py-1 text-xs font-medium text-on-surface/70 backdrop-blur hover:bg-white transition-colors">
                    Bleed
                  </button>
                </div>
              </div>

              {/* Face Labels */}
              <div className="mt-4 flex justify-center gap-4">
                <button className="rounded-full bg-primary-container px-4 py-1 text-xs font-semibold text-on-primary-fixed">
                  Front
                </button>
                <button className="rounded-full bg-surface-container px-4 py-1 text-xs font-medium text-on-surface/70 hover:bg-surface-container-high transition-colors">
                  Back
                </button>
              </div>
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-lg backdrop-blur">
            <button
              type="button"
              onClick={zoomOut}
              className="rounded-full p-1 hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
                remove
              </span>
            </button>
            <span className="min-w-[3rem] text-center text-sm font-medium text-on-surface">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={zoomIn}
              className="rounded-full p-1 hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
                add
              </span>
            </button>
            <div className="h-6 w-px bg-outline-variant/30" />
            <button
              type="button"
              onClick={zoomFit}
              className="rounded-full p-1 hover:bg-surface-container transition-colors"
              title="Fit to screen"
            >
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
                fit_screen
              </span>
            </button>
            <button
              type="button"
              className="rounded-full p-1 hover:bg-surface-container transition-colors"
              title="Toggle grid"
            >
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
                grid_on
              </span>
            </button>
          </div>

          {/* Measurement Tool Helper */}
          {measurementTool && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 rounded-lg bg-on-surface px-4 py-2 text-xs text-surface shadow-lg">
              Click and drag on the canvas to measure distance
            </div>
          )}

          {/* Need Design Help Button */}
          <button
            type="button"
            className="absolute bottom-6 right-6 flex items-center gap-2 rounded-full bg-primary-container px-5 py-3 text-sm font-semibold text-on-primary-fixed shadow-lg hover:bg-primary-container/90 transition-colors"
          >
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
              help
            </span>
            Need design help?
          </button>
        </main>
      </div>

      {savedFlash && (
        <div className="fixed bottom-20 right-6 rounded-lg bg-on-surface px-6 py-3 text-sm font-medium text-surface shadow-xl">
          ✓ Design saved successfully
        </div>
      )}

      {/* Canvas Size Dialog */}
      {showSizeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-surface-container-lowest p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-headline text-xl font-semibold text-on-surface">Canvas Size</h2>
              <button
                type="button"
                onClick={() => setShowSizeDialog(false)}
                className="rounded-full p-1 hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
                  close
                </span>
              </button>
            </div>
            
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const width = Number(formData.get("width"));
                const height = Number(formData.get("height"));
                const selectedUnit = formData.get("unit") as "px" | "cm" | "in";
                applyCanvasSize(width, height, selectedUnit);
              }}
              className="space-y-4"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-on-surface/70">Unit</label>
                <select
                  name="unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as "px" | "cm" | "in")}
                  className="w-full rounded border border-outline-variant/30 bg-surface-container px-3 py-2 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="px">Pixels (px)</option>
                  <option value="cm">Centimeters (cm)</option>
                  <option value="in">Inches (in)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-on-surface/70">Width</label>
                  <input
                    type="number"
                    name="width"
                    step="0.01"
                    min="1"
                    defaultValue={convertFromPixels(canvasWidth, unit).toFixed(2)}
                    className="w-full rounded border border-outline-variant/30 bg-surface-container px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-on-surface/70">Height</label>
                  <input
                    type="number"
                    name="height"
                    step="0.01"
                    min="1"
                    defaultValue={convertFromPixels(canvasHeight, unit).toFixed(2)}
                    className="w-full rounded border border-outline-variant/30 bg-surface-container px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="rounded bg-surface-container p-3 text-xs text-on-surface/60">
                <p className="mb-1 font-semibold">Current size:</p>
                <p>{canvasWidth}px × {canvasHeight}px</p>
                <p>{convertFromPixels(canvasWidth, "cm").toFixed(2)}cm × {convertFromPixels(canvasHeight, "cm").toFixed(2)}cm</p>
                <p>{convertFromPixels(canvasWidth, "in").toFixed(2)}in × {convertFromPixels(canvasHeight, "in").toFixed(2)}in</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-on-surface/70">Presets:</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => applyCanvasSize(9, 5, "cm")}
                    className="rounded bg-surface-container px-3 py-2 text-xs hover:bg-surface-container-high transition-colors"
                  >
                    Business Card<br />
                    <span className="text-on-surface/60">9×5 cm</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyCanvasSize(21, 29.7, "cm")}
                    className="rounded bg-surface-container px-3 py-2 text-xs hover:bg-surface-container-high transition-colors"
                  >
                    A4<br />
                    <span className="text-on-surface/60">21×29.7 cm</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyCanvasSize(8.5, 11, "in")}
                    className="rounded bg-surface-container px-3 py-2 text-xs hover:bg-surface-container-high transition-colors"
                  >
                    Letter<br />
                    <span className="text-on-surface/60">8.5×11 in</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyCanvasSize(1920, 1080, "px")}
                    className="rounded bg-surface-container px-3 py-2 text-xs hover:bg-surface-container-high transition-colors"
                  >
                    Full HD<br />
                    <span className="text-on-surface/60">1920×1080 px</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowSizeDialog(false)}
                  className="flex-1 rounded bg-surface-container px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded bg-primary-container px-4 py-2 text-sm font-semibold text-on-primary-fixed hover:bg-primary-container/90 transition-colors"
                >
                  Apply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
