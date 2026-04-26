"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fabric } from "fabric";
import { ImageUploader } from "@/components/upload/ImageUploader";
import { useCartStore } from "@/stores/cartStore";
import {
  Type, ImagePlus, Square, Palette, Layout, Layers, MoreHorizontal,
  Undo, Redo, Eye, ShoppingCart, ChevronLeft, ChevronRight,
  ZoomIn, ZoomOut, Settings, HelpCircle, Cloud, CloudOff,
  FileText, CreditCard, Upload, Image as ImageIcon,
  Ruler, Scissors, CheckCircle, ArrowLeft, ArrowRight
} from "lucide-react";

const CM_TO_PX = 300 / 2.54;
const MM_TO_PX = 300 / 25.4;

const BUSINESS_CARD = { wCm: 8.89, hCm: 5.08, bleedMm: 3.2, safeMm: 3 };
const A4 = { wCm: 21, hCm: 29.7, bleedMm: 3, safeMm: 5 };
const A5 = { wCm: 14.8, hCm: 21, bleedMm: 3, safeMm: 5 };
const SQUARE = { wCm: 12.7, hCm: 12.7, bleedMm: 3, safeMm: 5 };

const PRESETS: Record<string, { wCm: number; hCm: number; bleedMm: number; safeMm: number }> = {
  "Business Card": BUSINESS_CARD,
  "A4": A4,
  "A5": A5,
  "Square (5x5)": SQUARE,
};

const TEMPLATES: Record<string, { name: string; fields: { id: string; label: string; default: string }[] }> = {
  "business-card": {
    name: "Business Card",
    fields: [
      { id: "company", label: "Company Name", default: "Your Company" },
      { id: "name", label: "Full Name", default: "John Doe" },
      { id: "title", label: "Job Title", default: "Manager" },
      { id: "phone", label: "Phone", default: "+1 234 567 8900" },
      { id: "email", label: "Email", default: "john@company.com" },
      { id: "website", label: "Website", default: "www.company.com" },
      { id: "address", label: "Address", default: "123 Main St, City" },
    ],
  },
  "letterhead": {
    name: "Letterhead",
    fields: [
      { id: "company", label: "Company Name", default: "Your Company" },
      { id: "tagline", label: "Tagline", default: "Excellence in Service" },
    ],
  },
  "event-ticket": {
    name: "Event Ticket",
    fields: [
      { id: "event", label: "Event Name", default: "Annual Conference 2025" },
      { id: "date", label: "Date", default: "March 15, 2025" },
      { id: "venue", label: "Venue", default: "Convention Center" },
      { id: "seat", label: "Seat", default: "A12" },
    ],
  },
};

const COLORS = ["#FFFFFF", "#F8F9FA", "#E9ECEF", "#DEE2E6", "#CED4DA", "#ADB5BD", "#6C757D", "#495057", "#343A40", "#212529", "#000000"];
const ACCENT_COLORS = ["#DC3545", "#FD7E14", "#FFC107", "#28A745", "#20C997", "#17A2B8", "#007BFF", "#6F42C1", "#E83E8C", "#6610F2"];

export default function FabricEditor(props: { productId: string; variationId: string; qty: number; templateJson: string; productName?: string }) {
  const getTemplate = (json: string) => {
    try {
      const p = JSON.parse(json);
      const tpl = p?.attrs?.template || "business-card";
      return {
        preset: p?.attrs?.preset || "Business Card",
        name: TEMPLATES[tpl]?.name || "Custom Design",
        fields: p?.attrs?.fields || TEMPLATES[tpl]?.fields || TEMPLATES["business-card"].fields,
      };
    } catch {
      return { preset: "Business Card", name: "Business Card", fields: TEMPLATES["business-card"].fields };
    }
  };

  const tmpl = useMemo(() => getTemplate(props.templateJson), [props.templateJson]);
  const preset = PRESETS[tmpl.preset] || BUSINESS_CARD;
  const canvasW = Math.round(preset.wCm * CM_TO_PX);
  const canvasH = Math.round(preset.hCm * CM_TO_PX);
  const bleedPx = Math.round(preset.bleedMm * MM_TO_PX);
  const safePx = Math.round(preset.safeMm * MM_TO_PX);

  const canvasEl = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);

  const [currentSide, setCurrentSide] = useState<"front" | "back">("front");
  const [activeTool, setActiveTool] = useState<string>("text");
  const [zoom, setZoom] = useState(0.4);
  const [selected, setSelected] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [saved, setSaved] = useState(true);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => {
    const vals: Record<string, string> = {};
    tmpl.fields.forEach((f: { id: string; default: string }) => { vals[f.id] = f.default; });
    return vals;
  });

  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const getCanvas = () => canvasRef.current;

  const updateSelection = useCallback(() => {
    const c = getCanvas();
    if (!c) return;
    const obj = c.getActiveObject();
    if (!obj) { setSelected(null); return; }
    const s: any = { type: obj.type, opacity: Math.round((obj.opacity ?? 1) * 100) };
    if (obj.fill && typeof obj.fill === "string") s.fill = obj.fill;
    if (obj.angle) s.rotation = obj.angle;
    if (obj.type === "textbox" || obj.type === "i-text") {
      const t = obj as any;
      s.text = t.text;
      s.fontFamily = t.fontFamily;
      s.fontSize = t.fontSize;
    }
    setSelected(s);
  }, []);

  const fitToContainer = useCallback(() => {
    const c = getCanvas();
    const c2 = containerRef.current;
    if (!c || !c2) return;
    const pad = 80;
    const w = c2.clientWidth - pad;
    const h = c2.clientHeight - pad;
    if (w <= 0 || h <= 0) return;
    const scale = Math.min(w / canvasW, h / canvasH, 1);
    c.setZoom(scale);
    c.setWidth(canvasW * scale);
    c.setHeight(canvasH * scale);
    c.requestRenderAll();
    setZoom(scale);
  }, [canvasW, canvasH]);

  const saveHistory = useCallback(() => {
    const c = getCanvas();
    if (!c) return;
    const json = JSON.stringify(c.toJSON());
    historyRef.current = [...historyRef.current.slice(0, historyIndexRef.current + 1), json];
    historyIndexRef.current = historyRef.current.length - 1;
    setSaved(false);
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    const c = getCanvas();
    if (!c) return;
    historyIndexRef.current--;
    c.loadFromJSON(JSON.parse(historyRef.current[historyIndexRef.current]), () => {
      c.requestRenderAll();
      setSaved(false);
    });
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    const c = getCanvas();
    if (!c) return;
    historyIndexRef.current++;
    c.loadFromJSON(JSON.parse(historyRef.current[historyIndexRef.current]), () => {
      c.requestRenderAll();
      setSaved(false);
    });
  }, []);

  const addTextField = useCallback((fieldId: string) => {
    const c = getCanvas();
    if (!c) return;
    const field = tmpl.fields.find((f: { id: string }) => f.id === fieldId) as { id: string; default: string } | undefined;
    if (!field) return;
    const val = fieldValues[fieldId] || field.default;
    const t = new fabric.Textbox(val, {
      left: safePx,
      top: safePx + (tmpl.fields.indexOf(field) * 40),
      width: canvasW - safePx * 2,
      fontSize: 24,
      fontFamily: "Inter",
      fill: "#212529",
      editable: true,
    });
    c.add(t);
    c.setActiveObject(t);
    c.requestRenderAll();
    saveHistory();
    updateSelection();
  }, [tmpl.fields, fieldValues, canvasW, canvasH, safePx, saveHistory, updateSelection]);

  const updateFieldValue = useCallback((fieldId: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [fieldId]: value }));
    const c = getCanvas();
    if (!c) return;
    const found = c.getObjects().find((o: any) => o.fieldId === fieldId);
    if (found) {
      (found as any).set("text", value);
      c.requestRenderAll();
      saveHistory();
    }
  }, [saveHistory]);

  const addRect = useCallback(() => {
    const c = getCanvas();
    if (!c) return;
    const r = new fabric.Rect({
      left: safePx,
      top: safePx,
      width: canvasW - safePx * 2,
      height: 80,
      fill: "#007BFF",
      rx: 4,
      ry: 4,
    });
    c.add(r);
    c.setActiveObject(r);
    c.requestRenderAll();
    saveHistory();
    updateSelection();
  }, [canvasW, safePx, saveHistory, updateSelection]);

  const addCircle = useCallback(() => {
    const c = getCanvas();
    if (!c) return;
    const r = new fabric.Circle({
      left: canvasW / 2,
      top: canvasH / 2,
      radius: 50,
      fill: "#007BFF",
    });
    c.add(r);
    c.setActiveObject(r);
    c.requestRenderAll();
    saveHistory();
    updateSelection();
  }, [canvasW, canvasH, saveHistory, updateSelection]);

  const addImageBox = useCallback((url: string) => {
    const c = getCanvas();
    if (!c) return;
    fabric.Image.fromURL(url, (img) => {
      if (!img || !img.width || !img.height) return;
      const max = Math.min(canvasW, canvasH) * 0.3;
      const sc = Math.min(max / img.width, max / img.height, 1);
      img.set({
        left: canvasW / 2 - (img.width * sc) / 2,
        top: canvasH / 2 - (img.height * sc) / 2,
        scaleX: sc,
        scaleY: sc,
      });
      c.add(img);
      c.setActiveObject(img);
      c.requestRenderAll();
      saveHistory();
      updateSelection();
    }, { crossOrigin: "anonymous" });
  }, [canvasW, canvasH, saveHistory, updateSelection]);

  const deleteSelected = useCallback(() => {
    const c = getCanvas();
    if (!c) return;
    const o = c.getActiveObject();
    if (o) { c.remove(o); c.discardActiveObject(); c.requestRenderAll(); saveHistory(); setSelected(null); }
  }, [saveHistory]);

  const updateObject = useCallback((patch: any) => {
    const c = getCanvas();
    const o = c && c.getActiveObject();
    if (!c || !o) return;
    o.set(patch);
    o.setCoords();
    c.requestRenderAll();
    saveHistory();
    updateSelection();
  }, [saveHistory, updateSelection]);

  const saveDesign = useCallback(() => {
    const c = getCanvas();
    if (!c) return null;
    const orig = c.getZoom();
    c.setZoom(1);
    c.setWidth(canvasW);
    c.setHeight(canvasH);
    const json = JSON.stringify(c.toJSON());
    const thumb = c.toDataURL({ format: "png", multiplier: 0.25 });
    c.setZoom(orig);
    c.setWidth(canvasW * orig);
    c.setHeight(canvasH * orig);
    setSaved(true);
    return { state: json, thumbnail: thumb };
  }, [canvasW, canvasH]);

  const downloadDesign = useCallback(() => {
    const c = getCanvas();
    if (!c) return;
    const orig = c.getZoom();
    c.setZoom(1);
    const url = c.toDataURL({ format: "png", multiplier: 2 });
    c.setZoom(orig);
    const a = document.createElement("a");
    a.download = "design.png";
    a.href = url;
    a.click();
  }, []);

  const addToCart = useCallback(() => {
    const p = saveDesign();
    if (!p) return;
    addItem({
      id: Math.random().toString(36).slice(2),
      productId: props.productId,
      variationId: props.variationId,
      quantity: props.qty,
      unitPrice: 0,
      designState: p.state,
      thumbnailDataUrl: p.thumbnail,
      productName: props.productName || "Custom Design",
    });
    router.push("/cart");
  }, [props.productId, props.variationId, props.qty, props.productName, saveDesign, addItem, router]);

  const drawGuides = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const scale = ctx.canvas.getContext("2d")?.getTransform().a || 1;
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = "#007BFF";
    ctx.lineWidth = 1 / scale;
    ctx.strokeRect(bleedPx, bleedPx, w - bleedPx * 2, h - bleedPx * 2);
    ctx.strokeStyle = "#28A745";
    ctx.strokeRect(safePx, safePx, w - safePx * 2, h - safePx * 2);
    ctx.setLineDash([]);
  }, [bleedPx, safePx]);

  useEffect(() => {
    if (!canvasEl.current) return;
    const c = new fabric.Canvas(canvasEl.current, {
      width: canvasW,
      height: canvasH,
      backgroundColor: "#FFFFFF",
      preserveObjectStacking: true,
      selection: true,
    });
    canvasRef.current = c;
    c.on("selection:created", updateSelection);
    c.on("selection:updated", updateSelection);
    c.on("selection:cleared", () => setSelected(null));
    c.on("object:modified", () => saveHistory());
    tmpl.fields.forEach((f: { id: string; default: string }, i: number) => {
      const txt = new fabric.Textbox(f.default, {
        left: safePx,
        top: safePx + i * 28,
        width: canvasW - safePx * 2,
        fontSize: 18,
        fontFamily: "Inter",
        fill: "#212529",
      });
      (txt as any).fieldId = f.id;
      c.add(txt);
    });
    saveHistory();
    fitToContainer();
    const onResize = () => fitToContainer();
    window.addEventListener("resize", onResize);
    const onKey = (e: KeyboardEvent) => {
      if (!c) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        const o = c.getActiveObject();
        if (o && document.activeElement && document.activeElement.tagName !== "INPUT") { e.preventDefault(); deleteSelected(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
      c.dispose();
      canvasRef.current = null;
    };
  }, [tmpl.fields, canvasW, canvasH, safePx, fitToContainer, updateSelection, saveHistory, deleteSelected]);

  const tools = [
    { id: "product", label: "Product Options", icon: CreditCard },
    { id: "text", label: "Text", icon: Type },
    { id: "uploads", label: "Uploads", icon: ImagePlus },
    { id: "graphics", label: "Graphics", icon: Layers },
    { id: "background", label: "Background", icon: Palette },
    { id: "template", label: "Templates", icon: Layout },
    { id: "more", label: "More", icon: MoreHorizontal },
  ];

  return (
    <div className="flex h-screen flex-col bg-gray-100">
      <header className="flex h-14 items-center justify-between border-b border-gray-300 bg-white px-4 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            Exit
          </button>
          <div className="h-6 w-px bg-gray-300" />
          <h1 className="font-semibold text-gray-900">{props.productName || tmpl.name}</h1>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            {saved ? <Cloud className="h-3 w-3 text-green-500" /> : <CloudOff className="h-3 w-3 text-amber-500" />}
            <span>Auto-saved</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={undo} className="rounded p-2 hover:bg-gray-100" title="Undo">
            <Undo className="h-4 w-4 text-gray-600" />
          </button>
          <button onClick={redo} className="rounded p-2 hover:bg-gray-100" title="Redo">
            <Redo className="h-4 w-4 text-gray-600" />
          </button>
          <div className="h-6 w-px bg-gray-300" />
          <button onClick={() => setShowPreview(!showPreview)} className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
            <Eye className="h-4 w-4" />
            Preview
          </button>
          <button onClick={addToCart} className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
            Next
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="flex w-16 flex-col items-center gap-1 border-r border-gray-300 bg-white py-2">
          {tools.map((t) => (
            <button key={t.id} type="button" onClick={() => setActiveTool(t.id)}
              className={`flex w-12 flex-col items-center gap-1 rounded-lg py-2 text-xs transition-colors ${activeTool === t.id ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"}`}
              title={t.label}>
              <t.icon className="h-5 w-5" />
            </button>
          ))}
        </aside>

        <aside className="w-80 overflow-y-auto border-r border-gray-300 bg-white">
          {activeTool === "text" && (
            <div className="p-3 space-y-4">
              <h3 className="font-semibold text-gray-900 text-sm">Text Fields</h3>
              <p className="text-xs text-gray-500">Type to update text on the card</p>
              {tmpl.fields.map((f: { id: string; label: string }) => (
                <div key={f.id}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{f.label}</label>
                  <input
                    type="text"
                    value={fieldValues[f.id] || ""}
                    onChange={(e) => updateFieldValue(f.id, e.target.value)}
                    className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              ))}
              <button onClick={() => {
                const id = "custom_" + Date.now();
                setFieldValues((prev) => ({ ...prev, [id]: "New Text" }));
                const c = getCanvas();
                if (c) {
                  const t = new fabric.Textbox("New Text", {
                    left: safePx,
                    top: canvasH / 2,
                    width: canvasW - safePx * 2,
                    fontSize: 24,
                    fontFamily: "Inter",
                    fill: "#212529",
                  });
                  (t as any).fieldId = id;
                  c.add(t);
                  c.setActiveObject(t);
                  c.requestRenderAll();
                  saveHistory();
                }
              }} className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700">
                + New Text Field
              </button>
            </div>
          )}
          {activeTool === "uploads" && (
            <div className="p-3 space-y-4">
              <h3 className="font-semibold text-gray-900 text-sm">Upload Images</h3>
              <ImageUploader onUploadComplete={addImageBox} />
            </div>
          )}
          {activeTool === "graphics" && (
            <div className="p-3 space-y-4">
              <h3 className="font-semibold text-gray-900 text-sm">Shapes</h3>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={addRect} className="aspect-square rounded bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                  <Square className="h-6 w-6 text-gray-600" />
                </button>
                <button onClick={addCircle} className="aspect-square rounded bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                  <div className="h-6 w-6 rounded-full border-4 border-gray-600" />
                </button>
              </div>
            </div>
          )}
          {activeTool === "background" && (
            <div className="p-3 space-y-4">
              <h3 className="font-semibold text-gray-900 text-sm">Card Color</h3>
              <div className="grid grid-cols-5 gap-1">
                {COLORS.map((c, i) => (
                  <button key={i} onClick={() => {
                    const cg = getCanvas();
                    if (cg) { cg.backgroundColor = c; cg.requestRenderAll(); saveHistory(); }
                  }} className={`aspect-square rounded border border-gray-200 ${i === 0 ? "ring-2 ring-blue-500" : ""}`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          )}
          {activeTool === "template" && (
            <div className="p-3 space-y-4">
              <h3 className="font-semibold text-gray-900 text-sm">Template</h3>
              <p className="text-xs text-gray-500">Choose a starting layout</p>
            </div>
          )}
          {activeTool === "product" && (
            <div className="p-3 space-y-4">
              <h3 className="font-semibold text-gray-900 text-sm">Product Options</h3>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Card Size</label>
                <select className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm">
                  {Object.keys(PRESETS).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </aside>

        <main className="flex flex-1 flex-col overflow-hidden">
          <div ref={containerRef} className="flex flex-1 items-center justify-center overflow-auto bg-gray-200 p-8">
            <div className="relative bg-white shadow-xl" style={{ width: canvasW * zoom, height: canvasH * zoom }}>
              <canvas ref={canvasEl} style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }} />
              {showGrid && !showPreview && (
                <svg className="absolute inset-0 pointer-events-none" width={canvasW * zoom} height={canvasH * zoom} viewBox={`0 0 ${canvasW} ${canvasH}`}>
                  <rect x={bleedPx * zoom} y={bleedPx * zoom} width={(canvasW - bleedPx * 2) * zoom} height={(canvasH - bleedPx * 2) * zoom} fill="none" stroke="#3B82F6" strokeWidth={2 / zoom} strokeDasharray="8 4" />
                  <rect x={safePx * zoom} y={safePx * zoom} width={(canvasW - safePx * 2) * zoom} height={(canvasH - safePx * 2) * zoom} fill="none" stroke="#22C55E" strokeWidth={2 / zoom} strokeDasharray="8 4" />
                </svg>
              )}
            </div>
          </div>

          <div className="flex h-12 items-center justify-between border-t border-gray-300 bg-white px-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Ruler className="h-3 w-3" />
                <span>{preset.wCm}cm × {preset.hCm}cm</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Scissors className="h-3 w-3 text-blue-500" />
                <span>Bleed: {preset.bleedMm}mm</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Safe: {preset.safeMm}mm</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { const z = Math.max(0.1, zoom - 0.1); setZoom(z); const c = getCanvas(); if (c) { c.setZoom(z); c.setWidth(canvasW * z); c.setHeight(canvasH * z); c.requestRenderAll(); } }} className="p-1 rounded hover:bg-gray-100">
                <ZoomOut className="h-4 w-4 text-gray-600" />
              </button>
              <span className="min-w-[3rem] text-center text-xs text-gray-600">{Math.round(zoom * 100)}%</span>
              <button onClick={() => { const z = Math.min(2, zoom + 0.1); setZoom(z); const c = getCanvas(); if (c) { c.setZoom(z); c.setWidth(canvasW * z); c.setHeight(canvasH * z); c.requestRenderAll(); } }} className="p-1 rounded hover:bg-gray-100">
                <ZoomIn className="h-4 w-4 text-gray-600" />
              </button>
              <div className="h-5 w-px bg-gray-300" />
              <button onClick={() => setShowGrid(!showGrid)} className={`p-1 rounded ${showGrid ? "bg-gray-200" : "hover:bg-gray-100"}`} title="Toggle Guides">
                <Settings className="h-4 w-4 text-gray-600" />
              </button>
              <button className="flex items-center gap-1 rounded bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700 hover:bg-orange-200">
                <HelpCircle className="h-3 w-3" />
                Need design help?
              </button>
            </div>
          </div>
        </main>

        <aside className="flex w-24 flex-col items-center gap-1 border-l border-gray-300 bg-white py-2">
          <button onClick={() => setCurrentSide("front")}
            className={`flex w-20 flex-col items-center gap-1 rounded-lg p-2 text-xs ${currentSide === "front" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"}`}>
            <div className="aspect-[1.75/1] w-full rounded bg-gray-100 border border-gray-300" />
            <span>Front</span>
          </button>
          <button onClick={() => setCurrentSide("back")}
            className={`flex w-20 flex-col items-center gap-1 rounded-lg p-2 text-xs ${currentSide === "back" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"}`}>
            <div className="aspect-[1.75/1] w-full rounded bg-gray-100 border border-gray-300" />
            <span>Back</span>
          </button>
        </aside>
      </div>
    </div>
  );
}