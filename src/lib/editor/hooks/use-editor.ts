import { fabric } from "fabric";
import { useCallback, useState, useMemo, useRef } from "react";

import {
  Editor,
  FILL_COLOR,
  STROKE_WIDTH,
  STROKE_COLOR,
  CIRCLE_OPTIONS,
  DIAMOND_OPTIONS,
  TRIANGLE_OPTIONS,
  BuildEditorProps,
  RECTANGLE_OPTIONS,
  EditorHookProps,
  STROKE_DASH_ARRAY,
  TEXT_OPTIONS,
  FONT_FAMILY,
  FONT_SIZE,
  FONT_WEIGHT,
  JSON_KEYS,
} from "../types";
import { useHistory } from "./use-history";
import { downloadFile, isTextType, transformText } from "../utils";
import { useHotkeys } from "./use-hotkeys";
import { useClipboard } from "./use-clipboard";
import { useAutoResize } from "./use-auto-resize";
import { useCanvasEvents } from "./use-canvas-events";

const buildEditor = ({
  save,
  undo,
  redo,
  canRedo,
  canUndo,
  autoZoom,
  copy,
  paste,
  canvas,
  fillColor,
  fontFamily,
  setFontFamily,
  setFillColor,
  strokeColor,
  setStrokeColor,
  strokeWidth,
  setStrokeWidth,
  selectedObjects,
  strokeDashArray,
  setStrokeDashArray,
}: BuildEditorProps): Editor => {
  const generateSaveOptions = () => {
    const { width, height, left, top } = getWorkspace() as fabric.Rect;

    return {
      name: "Image",
      format: "png",
      quality: 1,
      width,
      height,
      left,
      top,
    };
  };

  const getWorkspace = () => {
    return canvas
      .getObjects()
      .find((object) => object.name === "clip");
  };

  const center = (object: fabric.Object) => {
    const workspace = getWorkspace();
    const centerPoint = workspace?.getCenterPoint();

    if (!centerPoint) return;

    canvas.centerObject(object);
  };

  const addToCanvas = (object: fabric.Object) => {
    center(object);
    canvas.add(object);
    canvas.setActiveObject(object);
  };

  return {
    savePng: () => {
      const options = generateSaveOptions();
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      const dataUrl = canvas.toDataURL(options);
      downloadFile(dataUrl, "png");
      autoZoom();
    },
    saveJpg: () => {
      const options = generateSaveOptions();
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      const dataUrl = canvas.toDataURL(options);
      downloadFile(dataUrl, "jpg");
      autoZoom();
    },
    saveSvg: () => {
      const options = generateSaveOptions();
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      const dataUrl = canvas.toDataURL(options);
      downloadFile(dataUrl, "svg");
      autoZoom();
    },
    saveJson: async () => {
      const dataUrl = canvas.toJSON(JSON_KEYS);
      await transformText(dataUrl.objects);
      const fileString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(dataUrl, null, "\t")
      )}`;
      downloadFile(fileString, "json");
    },
    exportCanvas: () => {
      return JSON.stringify(canvas.toJSON(JSON_KEYS));
    },
    loadJson: (json: string) => {
      const data = JSON.parse(json);
      canvas.loadFromJSON(data, () => {
        autoZoom();
      });
    },
    canUndo,
    canRedo,
    autoZoom,
    getWorkspace,
    zoomIn: () => {
      let zoomRatio = canvas.getZoom();
      zoomRatio += 0.05;
      const center = canvas.getCenter();
      canvas.zoomToPoint(
        new fabric.Point(center.left, center.top),
        zoomRatio > 1 ? 1 : zoomRatio
      );
    },
    zoomOut: () => {
      let zoomRatio = canvas.getZoom();
      zoomRatio -= 0.05;
      const center = canvas.getCenter();
      canvas.zoomToPoint(
        new fabric.Point(center.left, center.top),
        zoomRatio < 0.2 ? 0.2 : zoomRatio
      );
    },
    changeSize: (value: { width: number; height: number }) => {
      const workspace = getWorkspace();
      workspace?.set(value);
      autoZoom();
      save();
    },
    changeBackground: (value: string) => {
      const workspace = getWorkspace();
      workspace?.set({ fill: value });
      canvas.renderAll();
      save();
    },
    enableDrawingMode: () => {
      canvas.discardActiveObject();
      canvas.renderAll();
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.width = strokeWidth;
      canvas.freeDrawingBrush.color = strokeColor;
    },
    disableDrawingMode: () => {
      canvas.isDrawingMode = false;
    },
    onUndo: () => undo(),
    onRedo: () => redo(),
    onCopy: () => copy(),
    onPaste: () => paste(),
    changeImageFilter: (value: string) => {
      canvas.getActiveObjects().forEach((object) => {
        if (object.type === "image") {
          const imageObject = object as fabric.Image;
          
          let effect: any = null;
          switch (value) {
            case "greyscale": effect = new fabric.Image.filters.Grayscale(); break;
            case "sepia": effect = new fabric.Image.filters.Sepia(); break;
            case "invert": effect = new fabric.Image.filters.Invert(); break;
            case "brightness": effect = new fabric.Image.filters.Brightness({ brightness: 0.3 }); break;
            case "contrast": effect = new fabric.Image.filters.Contrast({ contrast: 0.3 }); break;
            default: effect = null;
          }

          imageObject.filters = effect ? [effect] : [];
          imageObject.applyFilters();
          canvas.renderAll();
        }
      });
    },
    addImage: (value: string) => {
      fabric.Image.fromURL(
        value,
        (image) => {
          const workspace = getWorkspace();
          image.scaleToWidth(workspace?.width || 0);
          image.scaleToHeight(workspace?.height || 0);
          addToCanvas(image);
        },
        { crossOrigin: "anonymous" }
      );
    },
    delete: () => {
      canvas.getActiveObjects().forEach((object) => canvas.remove(object));
      canvas.discardActiveObject();
      canvas.renderAll();
    },
    addText: (value, options) => {
      const object = new fabric.Textbox(value, {
        ...TEXT_OPTIONS,
        fill: fillColor,
        ...options,
      });
      addToCanvas(object);
    },
    getActiveOpacity: () => {
      const selectedObject = selectedObjects[0];
      if (!selectedObject) return 1;
      return selectedObject.get("opacity") || 1;
    },
    changeFontSize: (value: number) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          (object as any).set({ fontSize: value });
        }
      });
      canvas.renderAll();
    },
    getActiveFontSize: () => {
      const selectedObject = selectedObjects[0];
      if (!selectedObject) return FONT_SIZE;
      return (selectedObject as any).get("fontSize") || FONT_SIZE;
    },
    changeTextAlign: (value: string) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          (object as any).set({ textAlign: value });
        }
      });
      canvas.renderAll();
    },
    getActiveTextAlign: () => {
      const selectedObject = selectedObjects[0];
      if (!selectedObject) return "left";
      return (selectedObject as any).get("textAlign") || "left";
    },
    changeFontUnderline: (value: boolean) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          (object as any).set({ underline: value });
        }
      });
      canvas.renderAll();
    },
    getActiveFontUnderline: () => {
      const selectedObject = selectedObjects[0];
      if (!selectedObject) return false;
      return (selectedObject as any).get("underline") || false;
    },
    changeFontLinethrough: (value: boolean) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          (object as any).set({ linethrough: value });
        }
      });
      canvas.renderAll();
    },
    getActiveFontLinethrough: () => {
      const selectedObject = selectedObjects[0];
      if (!selectedObject) return false;
      return (selectedObject as any).get("linethrough") || false;
    },
    changeFontStyle: (value: string) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          (object as any).set({ fontStyle: value });
        }
      });
      canvas.renderAll();
    },
    getActiveFontStyle: () => {
      const selectedObject = selectedObjects[0];
      if (!selectedObject) return "normal";
      return (selectedObject as any).get("fontStyle") || "normal";
    },
    changeFontWeight: (value: number) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          (object as any).set({ fontWeight: value });
        }
      });
      canvas.renderAll();
    },
    changeOpacity: (value: number) => {
      canvas.getActiveObjects().forEach((object) => {
        object.set({ opacity: value });
      });
      canvas.renderAll();
    },
    bringForward: () => {
      canvas.getActiveObjects().forEach((object) => {
        canvas.bringForward(object);
      });
      canvas.renderAll();
      const workspace = getWorkspace();
      workspace?.sendToBack();
    },
    sendToBack: () => {
      canvas.getActiveObjects().forEach((object) => {
        canvas.sendBackwards(object);
      });
      canvas.renderAll();
      const workspace = getWorkspace();
      workspace?.sendToBack();
    },
    flipX: () => {
      canvas.getActiveObjects().forEach((object) => {
        const scaleX = object.scaleX || 1;
        object.set({ scaleX: -scaleX });
      });
      canvas.renderAll();
    },
    flipY: () => {
      canvas.getActiveObjects().forEach((object) => {
        const scaleY = object.scaleY || 1;
        object.set({ scaleY: -scaleY });
      });
      canvas.renderAll();
    },
    rotate90: () => {
      canvas.getActiveObjects().forEach((object) => {
        const angle = (object.angle || 0) + 90;
        object.set({ angle });
      });
      canvas.renderAll();
    },
    rotateAngle: (angle: number) => {
      canvas.getActiveObjects().forEach((object) => {
        object.set({ angle });
      });
      canvas.renderAll();
    },
    lockObject: () => {
      canvas.getActiveObjects().forEach((object) => {
        object.set({ selectable: false, evented: false });
      });
      canvas.renderAll();
    },
    unlockObject: () => {
      canvas.getActiveObjects().forEach((object) => {
        object.set({ selectable: true, evented: true });
      });
      canvas.renderAll();
    },
    groupObjects: () => {
      const activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type !== "activeSelection") {
        const group = new fabric.ActiveSelection(
          [activeObject],
          { canvas }
        );
        canvas.setActiveObject(group);
        canvas.renderAll();
      }
    },
    ungroupObjects: () => {
      const activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type === "activeSelection") {
        const objects = (activeObject as any).getObjects() || [];
        canvas.discardActiveObject();
        objects.forEach((obj: any) => canvas.add(obj));
        canvas.renderAll();
      }
    },
    copyToClipboard: () => {
      canvas.getActiveObject()?.clone((cloned: any) => {
        (canvas as any)._clipboard = cloned;
      });
    },
    pasteFromClipboard: () => {
      const clipboard = (canvas as any)._clipboard;
      if (!clipboard) return;
      clipboard.clone((clonedObj: any) => {
        canvas.discardActiveObject();
        clonedObj.set({
          left: clonedObj.left + 20,
          top: clonedObj.top + 20,
          evented: true,
        });
        canvas.add(clonedObj);
        canvas.setActiveObject(clonedObj);
        canvas.requestRenderAll();
      });
    },
    duplicate: () => {
      canvas.getActiveObject()?.clone((cloned: any) => {
        canvas.discardActiveObject();
        cloned.set({
          left: (cloned.left || 0) + 20,
          top: (cloned.top || 0) + 20,
          evented: true,
        });
        canvas.add(cloned);
        canvas.setActiveObject(cloned);
        canvas.requestRenderAll();
      });
    },
    getActiveLayerIndex: () => {
      const activeObject = canvas.getActiveObject();
      if (!activeObject) return -1;
      const objects = canvas.getObjects();
      return objects.findIndex((obj) => obj === activeObject);
    },
    setActiveLayer: (index: number) => {
      const objects = canvas.getObjects();
      if (index >= 0 && index < objects.length) {
        canvas.setActiveObject(objects[index]);
        canvas.renderAll();
      }
    },
    getLayers: () => {
      return canvas.getObjects().map((obj, index) => ({
        id: obj.name || `layer-${index}`,
        name: obj.name || `${obj.type}-${index + 1}`,
        type: obj.type || "unknown",
        visible: obj.visible !== false,
        locked: obj.selectable === false,
      }));
    },
    changeBackgroundImage: (url: string) => {
      fabric.Image.fromURL(url, (img) => {
        const workspace = getWorkspace();
        const wsWidth = (workspace?.width || 1) as number;
        const wsHeight = (workspace?.height || 1) as number;
        img.set({
          left: (workspace?.left || 0) as number,
          top: (workspace?.top || 0) as number,
          scaleX: wsWidth / ((img.width || 1) as number),
          scaleY: wsHeight / ((img.height || 1) as number),
        });
        canvas.setBackgroundImage(img as any, canvas.renderAll.bind(canvas));
      }, { crossOrigin: "anonymous" });
    },
    changeBackgroundPattern: (url: string) => {
      fabric.Image.fromURL(url, (img) => {
        const pattern = new fabric.Pattern({
          source: img.getElement() as HTMLImageElement,
          repeat: "repeat",
        });
        const workspace = getWorkspace();
        workspace?.set({ fill: pattern });
        canvas.renderAll();
      }, { crossOrigin: "anonymous" });
    },
    clearBackground: () => {
      const workspace = getWorkspace();
      workspace?.set({ fill: "white" });
      canvas.setBackgroundImage(null as any, canvas.renderAll.bind(canvas));
      canvas.renderAll();
    },
    alignLeft: () => {
      const activeObject = canvas.getActiveObject();
      if (!activeObject) return;
      const workspace = getWorkspace();
      if (!workspace) return;
      activeObject.set({ left: (workspace.left || 0) as number });
      canvas.renderAll();
    },
    alignCenter: () => {
      const activeObject = canvas.getActiveObject();
      if (!activeObject) return;
      const workspace = getWorkspace();
      if (!workspace) return;
      activeObject.set({ left: ((workspace.left || 0) as number) + ((workspace.width || 0) as number) / 2 });
      canvas.renderAll();
    },
    alignRight: () => {
      const activeObject = canvas.getActiveObject();
      if (!activeObject) return;
      const workspace = getWorkspace();
      if (!workspace) return;
      activeObject.set({ left: ((workspace.left || 0) as number) + (workspace.width || 0) as number });
      canvas.renderAll();
    },
    alignTop: () => {
      const activeObject = canvas.getActiveObject();
      if (!activeObject) return;
      const workspace = getWorkspace();
      if (!workspace) return;
      activeObject.set({ top: (workspace.top || 0) as number });
      canvas.renderAll();
    },
    alignMiddle: () => {
      const activeObject = canvas.getActiveObject();
      if (!activeObject) return;
      const workspace = getWorkspace();
      if (!workspace) return;
      activeObject.set({ top: ((workspace.top || 0) as number) + ((workspace.height || 0) as number) / 2 });
      canvas.renderAll();
    },
    alignBottom: () => {
      const activeObject = canvas.getActiveObject();
      if (!activeObject) return;
      const workspace = getWorkspace();
      if (!workspace) return;
      activeObject.set({ top: (workspace.top || 0) + (workspace.height || 0) });
      canvas.renderAll();
    },
    // Grid stubs
    toggleGrid: () => {},
    setGridSize: () => {},
    snapToGrid: () => {},
    sendBackwards: () => {
      canvas.getActiveObjects().forEach((object) => {
        canvas.sendBackwards(object);
      });
      canvas.renderAll();
      const workspace = getWorkspace();
      workspace?.sendToBack();
    },
    changeFontFamily: (value: string) => {
      setFontFamily(value);
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          (object as any).set({ fontFamily: value });
        }
      });
      canvas.renderAll();
    },
    changeFillColor: (value: string) => {
      setFillColor(value);
      canvas.getActiveObjects().forEach((object) => {
        object.set({ fill: value });
      });
      canvas.renderAll();
    },
    changeStrokeColor: (value: string) => {
      setStrokeColor(value);
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          object.set({ fill: value });
          return;
        }
        object.set({ stroke: value });
      });
      canvas.freeDrawingBrush.color = value;
      canvas.renderAll();
    },
    changeStrokeWidth: (value: number) => {
      setStrokeWidth(value);
      canvas.getActiveObjects().forEach((object) => {
        object.set({ strokeWidth: value });
      });
      canvas.freeDrawingBrush.width = value;
      canvas.renderAll();
    },
    changeStrokeDashArray: (value: number[]) => {
      setStrokeDashArray(value);
      canvas.getActiveObjects().forEach((object) => {
        object.set({ strokeDashArray: value });
      });
      canvas.renderAll();
    },
    addCircle: () => {
      const object = new fabric.Circle({
        ...CIRCLE_OPTIONS,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        strokeDashArray: strokeDashArray,
      });
      addToCanvas(object);
    },
    addSoftRectangle: () => {
      const object = new fabric.Rect({
        ...RECTANGLE_OPTIONS,
        rx: 50,
        ry: 50,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        strokeDashArray: strokeDashArray,
      });
      addToCanvas(object);
    },
    addRectangle: () => {
      const object = new fabric.Rect({
        ...RECTANGLE_OPTIONS,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        strokeDashArray: strokeDashArray,
      });
      addToCanvas(object);
    },
    addTriangle: () => {
      const object = new fabric.Triangle({
        ...TRIANGLE_OPTIONS,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        strokeDashArray: strokeDashArray,
      });
      addToCanvas(object);
    },
    addInverseTriangle: () => {
      const HEIGHT = TRIANGLE_OPTIONS.height;
      const WIDTH = TRIANGLE_OPTIONS.width;

      const object = new fabric.Polygon(
        [
          { x: 0, y: 0 },
          { x: WIDTH, y: 0 },
          { x: WIDTH / 2, y: HEIGHT },
        ],
        {
          ...TRIANGLE_OPTIONS,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDashArray: strokeDashArray,
        }
      );
      addToCanvas(object);
    },
    addDiamond: () => {
      const HEIGHT = DIAMOND_OPTIONS.height;
      const WIDTH = DIAMOND_OPTIONS.width;

      const object = new fabric.Polygon(
        [
          { x: WIDTH / 2, y: 0 },
          { x: WIDTH, y: HEIGHT / 2 },
          { x: WIDTH / 2, y: HEIGHT },
          { x: 0, y: HEIGHT / 2 },
        ],
        {
          ...DIAMOND_OPTIONS,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDashArray: strokeDashArray,
        }
      );
      addToCanvas(object);
    },
    canvas,
    getActiveFontWeight: () => {
      const selectedObject = selectedObjects[0];
      if (!selectedObject) return FONT_WEIGHT;
      return (selectedObject as any).get("fontWeight") || FONT_WEIGHT;
    },
    getActiveFontFamily: () => {
      const selectedObject = selectedObjects[0];
      if (!selectedObject) return fontFamily;
      return (selectedObject as any).get("fontFamily") || fontFamily;
    },
    getActiveFillColor: (): string => {
      const selectedObject = selectedObjects[0];
      if (!selectedObject) return fillColor;
      const fill = selectedObject.get("fill");
      return typeof fill === "string" ? fill : fillColor;
    },
    getActiveStrokeColor: (): string => {
      const selectedObject = selectedObjects[0];
      if (!selectedObject) return strokeColor;
      return selectedObject.get("stroke") || strokeColor;
    },
    getActiveStrokeWidth: () => {
      const selectedObject = selectedObjects[0];
      if (!selectedObject) return strokeWidth;
      return selectedObject.get("strokeWidth") || strokeWidth;
    },
    getActiveStrokeDashArray: () => {
      const selectedObject = selectedObjects[0];
      if (!selectedObject) return strokeDashArray;
      return selectedObject.get("strokeDashArray") || strokeDashArray;
    },
    selectedObjects,
  };
};

export const useEditor = ({
  defaultState,
  defaultWidth = 1080,
  defaultHeight = 1080,
  clearSelectionCallback,
  saveCallback,
}: EditorHookProps) => {
  const initialWidth = useRef(defaultWidth);
  const initialHeight = useRef(defaultHeight);

  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [selectedObjects, setSelectedObjects] = useState<fabric.Object[]>([]);

  const [fontFamily, setFontFamily] = useState(FONT_FAMILY);
  const [fillColor, setFillColor] = useState(FILL_COLOR);
  const [strokeColor, setStrokeColor] = useState(STROKE_COLOR);
  const [strokeWidth, setStrokeWidth] = useState(STROKE_WIDTH);
  const [strokeDashArray, setStrokeDashArray] = useState<number[]>(STROKE_DASH_ARRAY);

  const {
    save,
    canRedo,
    canUndo,
    undo,
    redo,
    canvasHistory,
    setHistoryIndex,
  } = useHistory({
    canvas,
    saveCallback,
  });

  const { copy, paste } = useClipboard({ canvas });

  const { autoZoom } = useAutoResize({
    canvas,
    container,
  });

  useCanvasEvents({
    save,
    canvas,
    setSelectedObjects,
    clearSelectionCallback,
  });

  useHotkeys({
    undo,
    redo,
    save,
    copy,
    paste,
    canvas,
  });

  const editor = useMemo(() => {
    if (canvas) {
      return buildEditor({
        save,
        undo,
        redo,
        canUndo,
        canRedo,
        autoZoom,
        copy,
        paste,
        canvas,
        fillColor,
        strokeWidth,
        strokeColor,
        setFillColor,
        setStrokeColor,
        setStrokeWidth,
        strokeDashArray,
        selectedObjects,
        setStrokeDashArray,
        fontFamily,
        setFontFamily,
      });
    }
    return undefined;
  }, [
    canRedo,
    canUndo,
    undo,
    redo,
    save,
    autoZoom,
    copy,
    paste,
    canvas,
    fillColor,
    strokeWidth,
    strokeColor,
    selectedObjects,
    strokeDashArray,
    fontFamily,
  ]);

  const init = useCallback(
    ({
      initialCanvas,
      initialContainer,
    }: {
      initialCanvas: fabric.Canvas;
      initialContainer: HTMLDivElement;
    }) => {
      fabric.Object.prototype.set({
        cornerColor: "#FFF",
        cornerStyle: "circle",
        borderColor: "#3b82f6",
        borderScaleFactor: 1.5,
        transparentCorners: false,
        borderOpacityWhenMoving: 1,
        cornerStrokeColor: "#3b82f6",
      });

      const initialWorkspace = new fabric.Rect({
        width: initialWidth.current,
        height: initialHeight.current,
        name: "clip",
        fill: "white",
        selectable: false,
        hasControls: false,
        shadow: new fabric.Shadow({
          color: "rgba(0,0,0,0.8)",
          blur: 5,
        }),
      });

      initialCanvas.setWidth(initialContainer.offsetWidth);
      initialCanvas.setHeight(initialContainer.offsetHeight);

      initialCanvas.add(initialWorkspace);
      initialCanvas.centerObject(initialWorkspace);
      initialCanvas.clipPath = initialWorkspace;

      setCanvas(initialCanvas);
      setContainer(initialContainer);

      const currentState = JSON.stringify(
        initialCanvas.toJSON(JSON_KEYS)
      );
      canvasHistory.current = [currentState];
      setHistoryIndex(0);
    },
    [canvasHistory, setHistoryIndex]
  );

  return { init, editor };
};