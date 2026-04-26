import { fabric } from "fabric";

export function transformText(objects: any) {
  if (!objects) return;

  objects.forEach((item: any) => {
    if (item.objects) {
      transformText(item.objects);
    } else {
      item.type === "text" && (item.type === "textbox");
    }
  });
};

export function downloadFile(file: string, type: string) {
  const anchorElement = document.createElement("a");

  anchorElement.href = file;
  anchorElement.download = `${Date.now()}.${type}`;
  document.body.appendChild(anchorElement);
  anchorElement.click();
  anchorElement.remove();
};

export function isTextType(type: string | undefined) {
  return type === "text" || type === "i-text" || type === "textbox";
};

export const createFilter = (value: string) => {
  let effect: any = null;

  switch (value) {
    case "greyscale":
      effect = new fabric.Image.filters.Grayscale();
      break;
    case "sepia":
      effect = new fabric.Image.filters.Sepia();
      break;
    case "contrast":
      effect = new fabric.Image.filters.Contrast({ contrast: 0.3 });
      break;
    case "brightness":
      effect = new fabric.Image.filters.Brightness({ brightness: 0.8 });
      break;
    case "pixelate":
      effect = new fabric.Image.filters.Pixelate();
      break;
    case "invert":
      effect = new fabric.Image.filters.Invert();
      break;
    case "blur":
      effect = new fabric.Image.filters.Blur();
      break;
    case "sharpen":
      effect = new fabric.Image.filters.Convolute({
        matrix: [0, -1, 0, -1, 5, -1, 0, -1, 0],
      });
      break;
    case "emboss":
      effect = new fabric.Image.filters.Convolute({
        matrix: [1, 1, 1, 1, 0.7, -1, -1, -1, -1],
      });
      break;
    default:
      effect = null;
      return;
  };

  return effect;
};