import { fabric } from "fabric";
import { useCallback } from "react";
import { 
  PrintSize, 
  BUSINESS_CARD,
  getTrimBox, 
  getBleedBox, 
  getSafeBox,
  mmToPx 
} from "../print";

interface PrintGuidelinesOptions {
  size?: PrintSize;
  showTrimLine?: boolean;
  showBleedLine?: boolean;
  showSafeLine?: boolean;
  trimLineColor?: string;
  bleedLineColor?: string;
  safeLineColor?: string;
}

const DEFAULT_OPTIONS: Required<PrintGuidelinesOptions> = {
  size: BUSINESS_CARD,
  showTrimLine: true,
  showBleedLine: true,
  showSafeLine: true,
  trimLineColor: "#000000",
  bleedLineColor: "#FF0000",
  safeLineColor: "#00FF00",
};

export const usePrintGuidelines = (
  canvas: fabric.Canvas | null,
  options?: PrintGuidelinesOptions
) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const addGuidelines = useCallback(() => {
    if (!canvas || !canvas.renderAll) return;

    try {
      const existing = canvas.getObjects().filter(
        (obj) => obj.name?.startsWith("print_guideline")
      );
      existing.forEach((obj) => canvas.remove(obj));

      const trimBox = getTrimBox(opts.size);
      const bleedBox = getBleedBox(opts.size);
      const safeBox = getSafeBox(opts.size);

      if (opts.showBleedLine) {
        const bleedLine = new fabric.Rect({
          left: bleedBox.x,
          top: bleedBox.y,
          width: bleedBox.width,
          height: bleedBox.height,
          fill: "transparent",
          stroke: opts.bleedLineColor,
          strokeWidth: 1,
          strokeDashArray: [5, 5],
          selectable: false,
          evented: false,
          excludeFromExport: true,
          name: "print_guideline_bleed",
        });
        canvas.add(bleedLine);
      }

      if (opts.showTrimLine) {
        const trimLine = new fabric.Rect({
          left: trimBox.x,
          top: trimBox.y,
          width: trimBox.width,
          height: trimBox.height,
          fill: "transparent",
          stroke: opts.trimLineColor,
          strokeWidth: 1,
          strokeDashArray: [3, 3],
          selectable: false,
          evented: false,
          excludeFromExport: true,
          name: "print_guideline_trim",
        });
        canvas.add(trimLine);
      }

      if (opts.showSafeLine) {
        const safeLine = new fabric.Rect({
          left: safeBox.x,
          top: safeBox.y,
          width: safeBox.width,
          height: safeBox.height,
          fill: "transparent",
          stroke: opts.safeLineColor,
          strokeWidth: 1,
          strokeDashArray: [2, 2],
          selectable: false,
          evented: false,
          excludeFromExport: true,
          name: "print_guideline_safe",
        });
        canvas.add(safeLine);
      }

      canvas.renderAll();
    } catch (e) {
      console.error("Error adding guidelines:", e);
    }
  }, [canvas, opts]);

  const removeGuidelines = useCallback(() => {
    if (!canvas || !canvas.renderAll) return;

    try {
      const guidelines = canvas.getObjects().filter(
        (obj) => obj.name?.startsWith("print_guideline")
      );
      guidelines.forEach((obj) => canvas.remove(obj));
      canvas.renderAll();
    } catch (e) {
      console.error("Error removing guidelines:", e);
    }
  }, [canvas]);

  const toggleGuidelines = useCallback(() => {
    if (!canvas) return;
    try {
      const hasGuidelines = canvas.getObjects().some(
        (obj) => obj.name?.startsWith("print_guideline")
      );
      if (hasGuidelines) {
        removeGuidelines();
      } else {
        addGuidelines();
      }
    } catch (e) {
      console.error("Error toggling guidelines:", e);
    }
  }, [canvas, addGuidelines, removeGuidelines]);

  const areGuidelinesVisible = useCallback(() => {
    if (!canvas) return false;
    try {
      return canvas.getObjects().some(
        (obj) => obj.name?.startsWith("print_guideline")
      );
    } catch (e) {
      return false;
    }
  }, [canvas]);

  return {
    addGuidelines,
    removeGuidelines,
    toggleGuidelines,
    areGuidelinesVisible,
  };
};