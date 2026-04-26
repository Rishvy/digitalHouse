import { fabric } from "fabric";
import { useCallback, useEffect } from "react";

interface UseAutoResizeProps {
  canvas: fabric.Canvas | null;
  container: HTMLDivElement | null;
}

export const useAutoResize = ({ canvas, container }: UseAutoResizeProps) => {
  const autoZoom = useCallback(() => {
    if (!canvas || !container || !canvas.renderAll) return;

    try {
      const width = container.offsetWidth;
      const height = container.offsetHeight;

      canvas.setWidth(width);
      canvas.setHeight(height);

      const center = canvas.getCenter();

      const zoomRatio = 0.85;
      const localWorkspace = canvas
        .getObjects()
        .find((object) => object.name === "clip");

      if (!localWorkspace) return;

      const localWidth = localWorkspace.width || 1;
      const localHeight = localWorkspace.height || 1;
      const scale = Math.min(width / localWidth, height / localHeight);

      const zoom = zoomRatio * scale;

      canvas.setViewportTransform(fabric.iMatrix.concat());
      canvas.zoomToPoint(new fabric.Point(center.left, center.top), zoom);

      const workspaceCenter = localWorkspace.getCenterPoint();
      const viewportTransform = canvas.viewportTransform;

      if (
        canvas.width === undefined ||
        canvas.height === undefined ||
        !viewportTransform
      ) {
        return;
      }

      viewportTransform[4] = canvas.width / 2 - workspaceCenter.x * viewportTransform[0];
      viewportTransform[5] = canvas.height / 2 - workspaceCenter.y * viewportTransform[3];

      canvas.setViewportTransform(viewportTransform);

      localWorkspace.clone((cloned: fabric.Rect) => {
        canvas.clipPath = cloned;
        canvas.requestRenderAll();
      });
    } catch (e) {
      console.error("Error in autoZoom:", e);
    }
  }, [canvas, container]);

  useEffect(() => {
    let resizeObserver: ResizeObserver | null = null;

    if (canvas && container && autoZoom) {
      resizeObserver = new ResizeObserver(() => {
        autoZoom();
      });

      resizeObserver.observe(container);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [canvas, container, autoZoom]);

  return { autoZoom };
};