"use client";

import { fabric } from "fabric";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  ActiveTool,
} from "../types";
import { PrintSize, BUSINESS_CARD, mmToPx } from "../print";
import { Navbar } from "../components/navbar";
import { Footer } from "../components/footer";
import { useEditor } from "../hooks/use-editor";
import { usePrintGuidelines } from "../hooks/use-print-guidelines";
import { Sidebar } from "../components/sidebar";
import { Toolbar } from "../components/toolbar";
import { ShapeSidebar } from "../components/shape-sidebar";
import { TextSidebar } from "../components/text-sidebar";
import { ImageSidebar } from "../components/image-sidebar";
import { LayersPanel } from "../components/layers-panel";
import { BackgroundsPanel } from "../components/backgrounds-panel";

interface EditorProps {
  printSize?: PrintSize;
  showGuidelines?: boolean;
  productName?: string;
  onSave?: (data: { json: string; height: number; width: number }) => void;
  onExport?: (format: "png" | "jpg" | "svg" | "json" | "print-pdf", data?: string) => void;
}

export const Editor = ({
  printSize = BUSINESS_CARD,
  showGuidelines = true,
  productName = "Untitled Design",
  onSave,
  onExport,
}: EditorProps) => {
  const initialWidth = mmToPx(printSize.widthMm);
  const initialHeight = mmToPx(printSize.heightMm);

  const debouncedSave = useCallback(
    (values: { json: string; height: number; width: number }) => {
      onSave?.(values);
    },
    [onSave]
  );

  const [activeTool, setActiveTool] = useState<ActiveTool>("select");

  const onClearSelection = useCallback(() => {
    setActiveTool("select");
  }, []);

  const { init, editor } = useEditor({
    defaultWidth: initialWidth,
    defaultHeight: initialHeight,
    clearSelectionCallback: onClearSelection,
    saveCallback: debouncedSave,
  });

  const { addGuidelines } = usePrintGuidelines(editor?.canvas || null, {
    size: printSize,
    showTrimLine: showGuidelines,
    showBleedLine: showGuidelines,
    showSafeLine: showGuidelines,
  });

  const onChangeActiveTool = useCallback((tool: ActiveTool) => {
    if (tool === "draw") {
      editor?.enableDrawingMode();
    }

    if (activeTool === "draw") {
      editor?.disableDrawingMode();
    }

    if (tool === activeTool) {
      return setActiveTool("select");
    }
    
    setActiveTool(tool);
  }, [activeTool, editor]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!init || !canvasRef.current || !containerRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      controlsAboveOverlay: true,
      preserveObjectStacking: true,
    });

    init({
      initialCanvas: canvas,
      initialContainer: containerRef.current!,
    });

    return () => {
      canvas.dispose();
    };
  }, [init]);

  // Add guidelines separately when editor is ready
  useEffect(() => {
    if (showGuidelines && editor?.canvas && addGuidelines) {
      const timer = setTimeout(() => {
        try {
          addGuidelines();
        } catch (e) {
          console.error("Error adding guidelines:", e);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [editor?.canvas, showGuidelines, addGuidelines]);

  return (
    <div className="h-full flex flex-col">
      <Navbar
        editor={editor}
        activeTool={activeTool}
        onChangeActiveTool={onChangeActiveTool}
        productName={productName}
        onExport={onExport}
      />
      <div className="absolute h-[calc(100%-68px)] w-full top-[68px] flex">
        <Sidebar
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <ShapeSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <TextSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <ImageSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <BackgroundsPanel
          editor={editor}
        />
        <LayersPanel
          editor={editor}
        />
        <main className="bg-muted flex-1 overflow-auto relative flex flex-col">
          <Toolbar
            editor={editor}
            activeTool={activeTool}
            onChangeActiveTool={onChangeActiveTool}
            key={JSON.stringify(editor?.canvas.getActiveObject())}
          />
          <div className="flex-1 h-[calc(100%-124px)] bg-muted" ref={containerRef}>
            <canvas ref={canvasRef} />
          </div>
          <Footer editor={editor} />
        </main>
      </div>
    </div>
  );
};