"use client";

import { fabric } from "fabric";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { ActiveTool, Editor as EditorType } from "@/lib/editor/types";
import { PrintSize, BUSINESS_CARD, mmToPx } from "@/lib/editor/print";
import { useEditor } from "@/lib/editor/hooks/use-editor";
import { usePrintGuidelines } from "@/lib/editor/hooks/use-print-guidelines";
import { useCartStore } from "@/stores/cartStore";

import "../../lib/editor/styles/editor.css";

interface PrintEditorProps {
  printSize?: PrintSize;
  showGuidelines?: boolean;
  productName?: string;
  productId: string;
  variationId?: string;
  qty?: number;
}

const TOOLS = [
  { id: "select", label: "Select", icon: "⊙" },
  { id: "text", label: "Text", icon: "T" },
  { id: "shapes", label: "Shapes", icon: "□" },
  { id: "images", label: "Images", icon: "▣" },
  { id: "draw", label: "Draw", icon: "✎" },
  { id: "layers", label: "Layers", icon: "≣" },
];

export function PrintEditor({
  printSize = BUSINESS_CARD,
  showGuidelines = true,
  productName = "Untitled Design",
  productId,
  variationId = "",
  qty = 1,
}: PrintEditorProps) {
  const router = useRouter();
  const { addItem } = useCartStore();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [zoom, setZoom] = useState(100);
  const [docTitle, setDocTitle] = useState(productName);
  const [activeTool, setActiveTool] = useState<ActiveTool>("select");
  const [layers, setLayers] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);

  const initialWidth = mmToPx(printSize.widthMm);
  const initialHeight = mmToPx(printSize.heightMm);

  const { init, editor } = useEditor({
    defaultWidth: initialWidth,
    defaultHeight: initialHeight,
    clearSelectionCallback: () => setActiveTool("select"),
    saveCallback: () => {},
  });

  const { addGuidelines } = usePrintGuidelines(canvas, {
    size: printSize,
    showTrimLine: showGuidelines,
    showBleedLine: showGuidelines,
    showSafeLine: showGuidelines,
  });

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: 600,
      height: 400,
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
    });

    // Add workspace
    const workspace = new fabric.Rect({
      left: 0,
      top: 0,
      width: initialWidth,
      height: initialHeight,
      fill: "#ffffff",
      selectable: false,
      evented: false,
      name: "clip",
    });
    fabricCanvas.add(workspace);
    fabricCanvas.centerObject(workspace);
    fabricCanvas.clipPath = workspace;

    fabricCanvas.on("selection:created", () => updateLayers(fabricCanvas));
    fabricCanvas.on("selection:updated", () => updateLayers(fabricCanvas));
    fabricCanvas.on("selection:cleared", () => {
      setSelectedLayer(null);
      updateLayers(fabricCanvas);
    });
    fabricCanvas.on("object:added", () => updateLayers(fabricCanvas));
    fabricCanvas.on("object:removed", () => updateLayers(fabricCanvas));

    setCanvas(fabricCanvas);

    return () => {
      fabricCanvas.dispose();
    };
  }, []);

  // Add guidelines after mount
  useEffect(() => {
    if (canvas && showGuidelines) {
      setTimeout(() => {
        try {
          addGuidelines();
        } catch (e) {
          console.error("Error adding guidelines:", e);
        }
      }, 500);
    }
  }, [canvas, showGuidelines]);

  const updateLayers = (fabricCanvas: fabric.Canvas) => {
    const objects = fabricCanvas.getObjects();
    const layerList = objects
      .filter(obj => obj.name !== "clip" && !obj.name?.startsWith("print_guideline"))
      .map((obj, idx) => ({
        id: obj.name || `object-${idx}`,
        name: obj.name || `${obj.type}-${idx + 1}`,
        type: obj.type || "unknown",
      }))
      .reverse();
    setLayers(layerList);
  };

  const handleToolChange = (toolId: string) => {
    setActiveTool(toolId as ActiveTool);
  };

  const handleAddText = () => {
    if (!canvas) return;
    const text = new fabric.Textbox("Double click to edit", {
      left: canvas.width! / 2 - 100,
      top: canvas.height! / 2 - 20,
      fontFamily: "DM Sans",
      fontSize: 32,
      fill: "#1a1a1f",
      width: 200,
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  const handleAddShape = (shape: string) => {
    if (!canvas) return;
    
    let obj: fabric.Object;
    const centerX = canvas.width! / 2 - 50;
    const centerY = canvas.height! / 2 - 50;

    switch (shape) {
      case "rect":
        obj = new fabric.Rect({
          left: centerX,
          top: centerY,
          width: 100,
          height: 100,
          fill: "#c9a66b",
        });
        break;
      case "circle":
        obj = new fabric.Circle({
          left: centerX,
          top: centerY,
          radius: 50,
          fill: "#c9a66b",
        });
        break;
      case "triangle":
        obj = new fabric.Triangle({
          left: centerX,
          top: centerY,
          width: 100,
          height: 100,
          fill: "#c9a66b",
        });
        break;
      default:
        return;
    }

    canvas.add(obj);
    canvas.setActiveObject(obj);
    canvas.renderAll();
  };

  const handleImageUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file || !canvas) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const imgUrl = event.target?.result as string;
        fabric.Image.fromURL(imgUrl, (img) => {
          img.scaleToWidth(200);
          canvas.add(img);
          canvas.centerObject(img);
          canvas.setActiveObject(img);
          canvas.renderAll();
        });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleExport = () => {
    if (!canvas) return;
    const dataUrl = canvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 2,
    });
    
    const link = document.createElement("a");
    link.download = `${docTitle || "design"}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleAddToCart = () => {
    if (!canvas || !productId) return;
    
    const designJson = JSON.stringify(canvas.toJSON());
    
    addItem({
      id: crypto.randomUUID(),
      productId,
      variationId,
      quantity: qty,
      unitPrice: 0,
      designState: designJson,
      thumbnailDataUrl: canvas.toDataURL({ format: "png", quality: 0.5 }),
    });
    
    router.push("/cart");
  };

  const handleZoom = (delta: number) => {
    const newZoom = Math.max(25, Math.min(200, zoom + delta));
    setZoom(newZoom);
  };

  const handleDelete = () => {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) {
      canvas.remove(active);
      canvas.renderAll();
    }
  };

  const handleDuplicate = () => {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) {
      active.clone((cloned: fabric.Object) => {
        cloned.set({
          left: (cloned.left || 0) + 20,
          top: (cloned.top || 0) + 20,
        });
        canvas.add(cloned);
        canvas.setActiveObject(cloned);
        canvas.renderAll();
      });
    }
  };

  return (
    <>
      <div className="grain-overlay" />
      <div className="design-editor-container">
        {/* Header */}
        <header className="editor-header">
          <div className="brand">
            <div className="brand-logo">P</div>
            <span className="brand-name">Print Studio</span>
          </div>
          
          <div className="document-title">
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="Untitled Design"
            />
          </div>
          
          <div className="header-actions">
            <button className="btn btn-outline" onClick={handleExport}>
              Export
            </button>
            <button className="btn btn-primary" onClick={handleAddToCart}>
              Add to Cart ({qty})
            </button>
          </div>
        </header>

        {/* Main Workspace */}
        <div className="editor-workspace">
          {/* Left Toolbar */}
          <div className="editor-toolbar-left">
            {TOOLS.map((tool) => (
              <button
                key={tool.id}
                className={`tool-btn ${activeTool === tool.id ? "active" : ""}`}
                onClick={() => handleToolChange(tool.id)}
              >
                <span>{tool.icon}</span>
                <span>{tool.label}</span>
              </button>
            ))}
          </div>

          {/* Canvas Area */}
          <div className="editor-canvas-area" ref={containerRef}>
            <div 
              className="canvas-frame"
              style={{ transform: `scale(${zoom / 100})` }}
            >
              <canvas ref={canvasRef} />
            </div>
            
            {/* Tool Panel Popup */}
            {activeTool === "text" && (
              <div className="tool-popup">
                <button className="btn btn-ghost" onClick={handleAddText}>
                  Add Text
                </button>
              </div>
            )}
            
            {activeTool === "shapes" && (
              <div className="tool-popup shapes-panel">
                <button className="btn btn-ghost" onClick={() => handleAddShape("rect")}>
                  □ Rectangle
                </button>
                <button className="btn btn-ghost" onClick={() => handleAddShape("circle")}>
                  ○ Circle
                </button>
                <button className="btn btn-ghost" onClick={() => handleAddShape("triangle")}>
                  △ Triangle
                </button>
              </div>
            )}
            
            {activeTool === "images" && (
              <div className="tool-popup">
                <button className="btn btn-ghost" onClick={handleImageUpload}>
                  Upload Image
                </button>
              </div>
            )}
          </div>

          {/* Right Panel */}
          <aside className="editor-panel-right">
            {/* Layers */}
            <div className="panel-section">
              <h3 className="panel-title">Layers</h3>
              <div className="layers-list">
                {layers.length === 0 ? (
                  <div className="empty-state">
                    Add elements to start designing
                  </div>
                ) : (
                  layers.map((layer) => (
                    <div
                      key={layer.id}
                      className={`layer-item ${selectedLayer === layer.id ? "selected" : ""}`}
                      onClick={() => {
                        setSelectedLayer(layer.id);
                        const obj = canvas?.getObjects().find(o => o.name === layer.id);
                        if (obj) {
                          canvas?.setActiveObject(obj);
                          canvas?.renderAll();
                        }
                      }}
                    >
                      <span className="layer-icon">▣</span>
                      <span className="layer-name">{layer.name}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="panel-section">
              <h3 className="panel-title">Actions</h3>
              <div className="action-buttons">
                <button 
                  className="btn btn-ghost" 
                  onClick={handleDuplicate}
                  disabled={!canvas?.getActiveObject()}
                >
                  Duplicate
                </button>
                <button 
                  className="btn btn-ghost" 
                  onClick={handleDelete}
                  disabled={!canvas?.getActiveObject()}
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Print Info */}
            <div className="panel-section">
              <h3 className="panel-title">Print Settings</h3>
              <div className="property-grid">
                <div className="property-item">
                  <span className="property-label">Size</span>
                  <span className="property-value">
                    {printSize.widthMm} × {printSize.heightMm}mm
                  </span>
                </div>
                <div className="property-item">
                  <span className="property-label">Bleed</span>
                  <span className="property-value">
                    {printSize.bleedMm}mm
                  </span>
                </div>
                <div className="property-item">
                  <span className="property-label">Quantity</span>
                  <span className="property-value">{qty} units</span>
                </div>
                <div className="property-item">
                  <span className="property-label">Resolution</span>
                  <span className="property-value">300 DPI</span>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Bottom Toolbar */}
        <div className="editor-toolbar-bottom">
          <div className="toolbar-bottom-left">
            <div className="zoom-control">
              <button 
                className="btn btn-ghost" 
                onClick={() => handleZoom(-25)}
              >
                −
              </button>
              <span className="zoom-value">{zoom}%</span>
              <button 
                className="btn btn-ghost" 
                onClick={() => handleZoom(25)}
              >
                +
              </button>
            </div>
          </div>
          
          <div className="toolbar-bottom-right">
            <span className="hint-text">
              {printSize.widthMm} × {printSize.heightMm}mm • 300 DPI
            </span>
            {layers.length > 0 && (
              <span className="object-count">
                {layers.length} object{layers.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .tool-popup {
          position: absolute;
          bottom: 80px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
          padding: 12px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          box-shadow: 0 20px 40px -20px rgba(0, 0, 0, 0.5);
        }

        .shapes-panel {
          gap: 4px;
          flex-direction: column;
        }

        .empty-state {
          padding: 24px;
          text-align: center;
          color: var(--text-muted);
          font-size: 13px;
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .action-buttons .btn {
          width: 100%;
          justify-content: flex-start;
        }

        .property-value {
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--text-primary);
        }

        .hint-text {
          font-size: 12px;
          color: var(--text-muted);
        }

        .object-count {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--accent-primary);
          padding: 4px 8px;
          background: var(--accent-subtle);
          border-radius: 12px;
        }
      `}</style>
    </>
  );
}