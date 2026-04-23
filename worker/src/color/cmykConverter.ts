import sharp from "sharp";
import gs from "ghostscript4js";
import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";

export async function convertRgbToCmykBuffer(pngBuffer: Buffer) {
  try {
    return await sharp(pngBuffer).toColourspace("cmyk").png().toBuffer();
  } catch {
    return pngBuffer;
  }
}

export async function convertWithGhostscriptIcc(inputPngBuffer: Buffer, iccProfilePath?: string) {
  if (!iccProfilePath) return convertRgbToCmykBuffer(inputPngBuffer);

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "w2p-icc-"));
  const inputPath = path.join(tmpDir, "input.png");
  const outputPath = path.join(tmpDir, "output.tif");
  await fs.writeFile(inputPath, inputPngBuffer);

  try {
    await gs.executeSync(
      `-dSAFER -dBATCH -dNOPAUSE -sDEVICE=tiff32nc -sOutputFile=${outputPath} -sDefaultCMYKProfile=${iccProfilePath} ${inputPath}`,
    );
    return await fs.readFile(outputPath);
  } catch {
    return convertRgbToCmykBuffer(inputPngBuffer);
  }
}
