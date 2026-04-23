import Konva from "konva";
import "konva/canvas-backend";
import { Image, loadImage } from "canvas";

interface RenderContext {
  designState: string;
  widthInches: number;
  heightInches: number;
}

function dpiToPixels(inches: number) {
  return Math.round(inches * 300);
}

async function hydrateExternalImages(stage: Konva.Stage) {
  const imageNodes = stage.find("Image");
  for (const node of imageNodes) {
    const source = node.getAttr("src") as string | undefined;
    if (!source) continue;
    try {
      const image = await loadImage(source);
      (node as Konva.Image).image(image as unknown as Image);
    } catch {
      // Continue with partial rendering if one asset fails.
    }
  }
}

export async function renderDesignToPngBuffer({ designState, widthInches, heightInches }: RenderContext) {
  const width = dpiToPixels(widthInches);
  const height = dpiToPixels(heightInches);

  const node = Konva.Node.create(designState);
  const stage = node as Konva.Stage;
  stage.width(width);
  stage.height(height);

  await hydrateExternalImages(stage);
  stage.draw();

  const canvas = stage.toCanvas({ pixelRatio: 1 });
  return canvas.toBuffer("image/png");
}
