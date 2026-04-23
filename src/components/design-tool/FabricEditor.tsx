"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fabric } from "fabric";
import { ImageUploader } from "@/components/upload/ImageUploader";
import { useCartStore } from "@/stores/cartStore";

type ActiveSummary = {
  type: string;
  fill?: string;
  opacity?: number;
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  textAlign?: string;
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

export default function FabricEditor({
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
  const [active, setActive] = useState<ActiveSummary | null>(null);
  const [zoom, setZoom] = useState(1);
  const [savedFlash, setSavedFlash] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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
    const padding = 48;
    const availableWidth = container.clientWidth - padding;
    const availableHeight = container.clientHeight - padding;
    if (availableWidth <= 0 || availableHeight <= 0) return;
    const scale = Math.min(availableWidth / frame.width, availableHeight / frame.height, 1);
    canvas.setZoom(scale);
    canvas.setWidth(frame.width * scale);
    canvas.setHeight(frame.height * scale);
    setZoom(scale);
    canvas.requestRenderAll();
  }, [frame.height, frame.width]);

  useEffect(() => {
    if (!canvasElRef.current) return;
    const canvas = new fabric.Canvas(canvasElRef.current, {
      width: frame.width,
      height: frame.height,
      backgroundColor: frame.background,
      preserveObjectStacking: true,
      selection: true,
    });
    fabricRef.current = canvas;

    canvas.on("selection:created", updateActive);
    canvas.on("selection:updated", updateActive);
    canvas.on("selection:cleared", () => setActive(null));
    canvas.on("object:modified", updateActive);

    fitCanvasToContainer();
    const onWindowResize = () => fitCanvasToContainer();
    window.addEventListener("resize", onWindowResize);

    return () => {
      window.removeEventListener("resize", onWindowResize);
      canvas.dispose();
      fabricRef.current = null;
    };
  }, [fitCanvasToContainer, frame.background, frame.height, frame.width, updateActive]);

  const getCanvas = () => fabricRef.current;

  const addText = () => {
    const canvas = getCanvas();
    if (!canvas) return;
    const text = new fabric.Textbox("Double-click to edit", {
      left: 120,
      top: 120,
      width: 360,
      fontSize: 48,
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
      left: 160,
      top: 160,
      width: 240,
      height: 160,
      fill: "#ffd709",
      rx: 6,
      ry: 6,
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
      left: 220,
      top: 180,
      radius: 80,
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
        const maxW = frame.width * 0.5;
        const scale = img.width && img.width > maxW ? maxW / img.width : 1;
        img.set({
          left: 140,
          top: 140,
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

  const removeSelected = () => {
    const canvas = getCanvas();
    if (!canvas) return;
    canvas.getActiveObjects().forEach((obj) => canvas.remove(obj));
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    setActive(null);
  };

  const duplicateSelected = () => {
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
    const next = Math.min(3, zoom + 0.1);
    canvas.setZoom(next);
    canvas.setWidth(frame.width * next);
    canvas.setHeight(frame.height * next);
    setZoom(next);
  };
  const zoomOut = () => {
    const canvas = getCanvas();
    if (!canvas) return;
    const next = Math.max(0.2, zoom - 0.1);
    canvas.setZoom(next);
    canvas.setWidth(frame.width * next);
    canvas.setHeight(frame.height * next);
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
    canvas.setWidth(frame.width);
    canvas.setHeight(frame.height);
    const json = canvas.toJSON([
      "selectable",
      "evented",
      "name",
      "data",
    ]);
    const thumbnail = canvas.toDataURL({ format: "png", multiplier: 0.5 });
    canvas.setZoom(current);
    canvas.setWidth(frame.width * current);
    canvas.setHeight(frame.height * current);
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
  const isImageActive = active?.type === "image";

  return (
    <div className="space-y-2">
      {!isDesktop && (
        <div className="mx-auto w-full max-w-[1400px] px-4 pt-3">
          <p className="rounded bg-surface-container p-3 text-xs text-on-surface/80">
            For best results use desktop width (768px+). Editor is still available below.
          </p>
        </div>
      )}

      <section className="mx-auto grid w-full max-w-[1400px] gap-4 px-4 py-4 lg:grid-cols-[80px_1fr_320px]">
        <aside className="flex flex-col gap-2 rounded-xl bg-surface-container p-2">
          <button
            type="button"
            className="flex flex-col items-center gap-1 rounded bg-surface-container-low px-2 py-3 text-xs hover:bg-primary-container hover:text-on-primary-fixed transition-colors"
            onClick={addText}
            title="Add Text"
          >
            <span className="text-lg">T</span>
            <span>Text</span>
          </button>
          <button
            type="button"
            className="flex flex-col items-center gap-1 rounded bg-surface-container-low px-2 py-3 text-xs hover:bg-primary-container hover:text-on-primary-fixed transition-colors"
            onClick={addRectangle}
            title="Add Rectangle"
          >
            <span className="text-lg">▭</span>
            <span>Rect</span>
          </button>
          <button
            type="button"
            className="flex flex-col items-center gap-1 rounded bg-surface-container-low px-2 py-3 text-xs hover:bg-primary-container hover:text-on-primary-fixed transition-colors"
            onClick={addCircle}
            title="Add Circle"
          >
            <span className="text-lg">●</span>
            <span>Circle</span>
          </button>
          <div className="flex-1" />
          <button
            type="button"
            className="flex flex-col items-center gap-1 rounded bg-error-container/20 px-2 py-3 text-xs text-error hover:bg-error-container transition-colors"
            onClick={removeSelected}
            title="Delete Selected"
          >
            <span className="text-lg">🗑</span>
            <span>Delete</span>
          </button>
        </aside>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-surface-container p-3 shadow-sm">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={zoomIn}
                className="rounded bg-surface-container-low px-3 py-1.5 text-xs font-medium hover:bg-secondary-container transition-colors"
              >
                +
              </button>
              <button
                type="button"
                onClick={zoomOut}
                className="rounded bg-surface-container-low px-3 py-1.5 text-xs font-medium hover:bg-secondary-container transition-colors"
              >
                −
              </button>
              <button
                type="button"
                onClick={zoomFit}
                className="rounded bg-surface-container-low px-3 py-1.5 text-xs font-medium hover:bg-secondary-container transition-colors"
              >
                Fit
              </button>
              <span className="ml-1 text-xs text-on-surface/60">{Math.round(zoom * 100)}%</span>
            </div>

            <div className="h-6 w-px bg-outline-variant/30" />

            <button
              type="button"
              onClick={duplicateSelected}
              disabled={!active}
              className="rounded bg-surface-container-low px-3 py-1.5 text-xs font-medium hover:bg-secondary-container transition-colors disabled:opacity-40"
            >
              Duplicate
            </button>
            <button
              type="button"
              onClick={bringForward}
              disabled={!active}
              className="rounded bg-surface-container-low px-3 py-1.5 text-xs font-medium hover:bg-secondary-container transition-colors disabled:opacity-40"
            >
              Forward
            </button>
            <button
              type="button"
              onClick={sendBackwards}
              disabled={!active}
              className="rounded bg-surface-container-low px-3 py-1.5 text-xs font-medium hover:bg-secondary-container transition-colors disabled:opacity-40"
            >
              Backward
            </button>

            <div className="flex-1" />
            <button
              type="button"
              onClick={saveDesign}
              className="rounded bg-on-surface px-4 py-1.5 text-xs font-semibold text-surface hover:bg-on-surface/90 transition-colors"
            >
              Save
            </button>
            <button
              type="button"
              onClick={saveAndAddToCart}
              className="rounded bg-primary-container px-4 py-1.5 text-xs font-semibold text-on-primary-fixed hover:bg-primary-container/90 transition-colors"
            >
              Add to Cart
            </button>
          </div>

          <div
            ref={containerRef}
            className="flex h-[680px] items-center justify-center overflow-auto rounded-xl bg-surface-container-low p-6 shadow-sm"
          >
            <div className="shadow-xl" style={{ background: "#fff" }}>
              <canvas ref={canvasElRef} />
            </div>
          </div>

          {savedFlash && (
            <div className="rounded-lg bg-tertiary-container px-4 py-2 text-sm font-medium text-on-tertiary-container">
              ✓ Design saved successfully
            </div>
          )}
          <p className="text-xs text-on-surface/60">
            💡 Tip: Double-click text to edit. Click & drag to move. Use corner handles to resize/rotate.
          </p>
        </div>

        <aside className="space-y-4 rounded-xl bg-surface-container p-4">
          <h3 className="font-heading text-base font-semibold">Properties</h3>

          {isTextActive && (
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-on-surface/70">
                  Text Content
                </label>
                <textarea
                  value={active?.text ?? ""}
                  onChange={(e) => updateActiveObject({ text: e.target.value })}
                  className="w-full rounded bg-surface-container-low px-3 py-2 text-sm resize-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-on-surface/70">
                  Font
                </label>
                <select
                  value={active?.fontFamily ?? "Manrope"}
                  onChange={(e) => updateActiveObject({ fontFamily: e.target.value })}
                  className="w-full rounded bg-surface-container-low px-3 py-2 text-sm"
                >
                  {["Manrope", "Space Grotesk", "Inter", "Poppins", "Roboto", "Open Sans", "Arial", "Georgia"].map(
                    (font) => (
                      <option key={font} value={font}>
                        {font}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-on-surface/70">
                    Size
                  </label>
                  <input
                    type="number"
                    min={8}
                    max={400}
                    value={Math.round(active?.fontSize ?? 36)}
                    onChange={(e) => updateActiveObject({ fontSize: Number(e.target.value) })}
                    className="w-full rounded bg-surface-container-low px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-on-surface/70">
                    Align
                  </label>
                  <select
                    value={active?.textAlign ?? "left"}
                    onChange={(e) => updateActiveObject({ textAlign: e.target.value })}
                    className="w-full rounded bg-surface-container-low px-3 py-2 text-sm"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              </div>
              <ColorField
                label="Color"
                value={active?.fill ?? "#2d2f2f"}
                onChange={(v) => updateActiveObject({ fill: v })}
              />
              <OpacityField
                value={active?.opacity ?? 1}
                onChange={(v) => updateActiveObject({ opacity: v })}
              />
            </div>
          )}

          {isShapeActive && (
            <div className="space-y-3">
              <ColorField
                label="Fill"
                value={active?.fill ?? "#ffd709"}
                onChange={(v) => updateActiveObject({ fill: v })}
              />
              <OpacityField
                value={active?.opacity ?? 1}
                onChange={(v) => updateActiveObject({ opacity: v })}
              />
            </div>
          )}

          {isImageActive && (
            <div className="space-y-3">
              {active?.src && (
                <div className="aspect-video w-full overflow-hidden rounded bg-surface-container-low">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={active.src} alt="Preview" className="h-full w-full object-cover" />
                </div>
              )}
              <OpacityField
                value={active?.opacity ?? 1}
                onChange={(v) => updateActiveObject({ opacity: v })}
              />
              <button
                type="button"
                onClick={removeSelected}
                className="w-full rounded bg-error-container px-3 py-2 text-sm font-semibold text-on-error-container"
              >
                Remove Image
              </button>
            </div>
          )}

          {!active && (
            <div className="space-y-3">
              <p className="text-sm text-on-surface/60">Select an element to edit its properties.</p>
              <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-3">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-on-surface/70">
                  Upload Image
                </h4>
                <ImageUploader onUploadComplete={addImage} />
              </div>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-on-surface/70">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-16 cursor-pointer rounded border-2 border-outline-variant"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded bg-surface-container-low px-3 py-2 text-sm font-mono"
        />
      </div>
    </div>
  );
}

function OpacityField({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const pct = Math.round(value * 100);
  return (
    <div>
      <label className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-on-surface/70">
        <span>Opacity</span>
        <span className="font-mono text-xs normal-case">{pct}%</span>
      </label>
      <input
        type="range"
        min={0}
        max={100}
        value={pct}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="w-full"
      />
    </div>
  );
}
