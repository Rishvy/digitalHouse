"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Konva from "konva";
import { ImageUploader } from "@/components/upload/ImageUploader";
import { useCartStore } from "@/stores/cartStore";

type Tool = "select" | "text" | "image" | "rect" | "circle";

function loadGoogleFont(fontFamily: string) {
  const id = `font-${fontFamily.replace(/\s+/g, "-").toLowerCase()}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, "+")}:wght@300;400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

function isLockedNode(node: Konva.Node) {
  return Boolean(node.getAttr("isLocked"));
}

export function DesignEditor({
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
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const designLayerRef = useRef<Konva.Layer | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const [tool, setTool] = useState<Tool>("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [designState, setDesignState] = useState<string>("");
  const [savedFlash, setSavedFlash] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const selectedNode = useMemo(() => {
    if (!selectedId) return null;
    return stageRef.current?.findOne(`#${selectedId}`) ?? null;
  }, [selectedId, designState]);

  const scheduleSync = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    window.clearTimeout((stage as unknown as { __syncTimer?: number }).__syncTimer);
    (stage as unknown as { __syncTimer?: number }).__syncTimer = window.setTimeout(() => {
      setDesignState(stage.toJSON());
    }, 300);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !isDesktop) return;
    const stage = new Konva.Stage({
      container: containerRef.current,
      width: 1000,
      height: 600,
    });

    const backgroundLayer = new Konva.Layer({ name: "background-layer" });
    const designLayer = new Konva.Layer({ name: "design-layer" });
    const overlayLayer = new Konva.Layer({ name: "overlay-layer" });
    const transformer = new Konva.Transformer();

    overlayLayer.add(transformer);
    stage.add(backgroundLayer);
    stage.add(designLayer);
    stage.add(overlayLayer);

    const hydrated = Konva.Node.create(templateJson) as Konva.Stage;
    hydrated.getChildren().forEach((layer) => {
      layer.getChildren().forEach((node) => {
        if (isLockedNode(node)) {
          node.setAttrs({ draggable: false, listening: false });
        } else {
          node.setAttrs({ draggable: true, listening: true });
        }
        backgroundLayer.add(node.clone());
      });
    });
    backgroundLayer.cache();
    backgroundLayer.draw();

    stage.on("click", (event) => {
      if (tool !== "select") return;
      const target = event.target;
      if (target === stage || target.getParent()?.name() === "background-layer") {
        transformer.nodes([]);
        setSelectedId(null);
        return;
      }
      if (isLockedNode(target)) return;
      setSelectedId(target.id());
      transformer.nodes([target]);
      overlayLayer.batchDraw();
    });

    stage.on("dragend transformend", scheduleSync);

    stageRef.current = stage;
    designLayerRef.current = designLayer;
    transformerRef.current = transformer;
    setDesignState(stage.toJSON());

    return () => {
      stage.destroy();
      stageRef.current = null;
      designLayerRef.current = null;
      transformerRef.current = null;
    };
  }, [isDesktop, scheduleSync, templateJson, tool]);

  const addText = () => {
    const layer = designLayerRef.current;
    if (!layer) return;
    const text = new Konva.Text({
      id: crypto.randomUUID(),
      x: 180,
      y: 180,
      text: "Your text",
      fontFamily: "Space Grotesk",
      fontSize: 24,
      fill: "#2d2f2f",
      draggable: true,
    });
    layer.add(text);
    layer.batchDraw();
    scheduleSync();
  };

  const addRect = () => {
    const layer = designLayerRef.current;
    if (!layer) return;
    layer.add(
      new Konva.Rect({
        id: crypto.randomUUID(),
        x: 200,
        y: 200,
        width: 180,
        height: 120,
        fill: "#ffd709",
        draggable: true,
      }),
    );
    layer.batchDraw();
    scheduleSync();
  };

  const addCircle = () => {
    const layer = designLayerRef.current;
    if (!layer) return;
    layer.add(
      new Konva.Circle({
        id: crypto.randomUUID(),
        x: 260,
        y: 220,
        radius: 60,
        fill: "#e7e8e8",
        draggable: true,
      }),
    );
    layer.batchDraw();
    scheduleSync();
  };

  const addImage = (publicUrl: string) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = publicUrl;
    image.onload = () => {
      const layer = designLayerRef.current;
      if (!layer) return;
      const node = new Konva.Image({
        id: crypto.randomUUID(),
        x: 140,
        y: 120,
        image,
        width: 260,
        height: 180,
        draggable: true,
      });
      layer.add(node);
      layer.batchDraw();
      scheduleSync();
    };
  };

  const zoom = (factor: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    const current = stage.scaleX();
    stage.scale({ x: current * factor, y: current * factor });
    stage.batchDraw();
  };

  const fitScreen = () => {
    const stage = stageRef.current;
    if (!stage || !containerRef.current) return;
    const ratio = containerRef.current.clientWidth / stage.width();
    stage.scale({ x: ratio, y: ratio });
    stage.batchDraw();
  };

  const saveDesign = () => {
    const stage = stageRef.current;
    if (!stage) return null;
    const state = stage.toJSON();
    const maxRatio = Math.min(0.5, 800 / stage.width());
    const thumbnail = stage.toDataURL({ pixelRatio: maxRatio });
    setDesignState(state);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
    return { state, thumbnail };
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

  if (!isDesktop) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-4 text-center">
        <p className="rounded bg-surface-container p-6 text-sm">
          The design tool requires a desktop browser (768px or wider)
        </p>
      </div>
    );
  }

  return (
    <section className="mx-auto grid w-full max-w-[1400px] gap-4 px-4 py-4 lg:grid-cols-[96px_1fr_320px]">
      <aside className="space-y-2 rounded-xl bg-surface-container p-2">
        {(["select", "text", "image", "rect", "circle"] as Tool[]).map((value) => (
          <button
            key={value}
            type="button"
            className={`w-full rounded px-3 py-2 text-left text-sm ${tool === value ? "bg-primary-container text-on-primary-fixed" : "bg-surface-container-low"}`}
            onClick={() => {
              setTool(value);
              if (value === "text") addText();
              if (value === "rect") addRect();
              if (value === "circle") addCircle();
            }}
          >
            {value}
          </button>
        ))}
      </aside>

      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded bg-surface-container p-2">
          <button type="button" onClick={() => zoom(1.1)} className="rounded bg-surface-container-low px-3 py-1 text-xs">
            Zoom In
          </button>
          <button type="button" onClick={() => zoom(0.9)} className="rounded bg-surface-container-low px-3 py-1 text-xs">
            Zoom Out
          </button>
          <button type="button" onClick={fitScreen} className="rounded bg-surface-container-low px-3 py-1 text-xs">
            Fit
          </button>
          <button type="button" onClick={saveDesign} className="ml-auto rounded bg-on-surface px-3 py-1 text-xs text-surface">
            Save
          </button>
          <button type="button" onClick={saveAndAddToCart} className="rounded bg-primary-container px-3 py-1 text-xs text-on-primary-fixed">
            Add to Cart
          </button>
        </div>
        <div className="overflow-hidden rounded-xl bg-surface-container-low p-3">
          <div ref={containerRef} className="min-h-[620px] w-full overflow-auto rounded bg-white" />
        </div>
        {savedFlash && <p className="text-xs text-primary">Design saved successfully.</p>}
      </div>

      <aside className="space-y-3 rounded-xl bg-surface-container p-4">
        <h3 className="font-heading text-lg font-semibold">Properties</h3>
        {selectedNode?.className === "Text" && (
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase">Font Family</label>
            <select
              defaultValue={selectedNode.getAttr("fontFamily") ?? "Space Grotesk"}
              onChange={(event) => {
                const node = selectedNode as Konva.Text;
                loadGoogleFont(event.target.value);
                node.fontFamily(event.target.value);
                node.getLayer()?.batchDraw();
                scheduleSync();
              }}
              className="w-full rounded bg-surface-container-low px-2 py-1 text-sm"
            >
              {["Space Grotesk", "Manrope", "Inter", "Poppins"].map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
            <label className="text-xs font-semibold uppercase">Font Size</label>
            <input
              type="number"
              defaultValue={selectedNode.getAttr("fontSize") ?? 24}
              className="w-full rounded bg-surface-container-low px-2 py-1 text-sm"
              onChange={(event) => {
                const node = selectedNode as Konva.Text;
                node.fontSize(Number(event.target.value));
                node.getLayer()?.batchDraw();
                scheduleSync();
              }}
            />
          </div>
        )}
        {selectedNode?.className === "Image" && (
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase">Opacity</label>
            <input
              type="range"
              min={0}
              max={100}
              defaultValue={Number(selectedNode.opacity() * 100)}
              onChange={(event) => {
                selectedNode.opacity(Number(event.target.value) / 100);
                selectedNode.getLayer()?.batchDraw();
                scheduleSync();
              }}
            />
          </div>
        )}
        {(selectedNode?.className === "Rect" || selectedNode?.className === "Circle") && (
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase">Fill Color</label>
            <input
              type="color"
              defaultValue={selectedNode.getAttr("fill") ?? "#ffd709"}
              onChange={(event) => {
                selectedNode.setAttr("fill", event.target.value);
                selectedNode.getLayer()?.batchDraw();
                scheduleSync();
              }}
            />
            <label className="text-xs font-semibold uppercase">Opacity</label>
            <input
              type="range"
              min={0}
              max={100}
              defaultValue={Number(selectedNode.opacity() * 100)}
              onChange={(event) => {
                selectedNode.opacity(Number(event.target.value) / 100);
                selectedNode.getLayer()?.batchDraw();
                scheduleSync();
              }}
            />
          </div>
        )}
        {!selectedNode && <p className="text-sm text-on-surface/70">Select an element to edit properties.</p>}
        {tool === "image" && <ImageUploader onUploadComplete={addImage} />}
      </aside>
    </section>
  );
}
