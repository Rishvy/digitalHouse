import { PDFDocument } from "pdf-lib";

function inchesToPoints(inches: number) {
  return inches * 72;
}

export async function buildPrintReadyPdf(params: {
  imageBuffer: Buffer;
  widthInches: number;
  heightInches: number;
}) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([inchesToPoints(params.widthInches), inchesToPoints(params.heightInches)]);
  const image = await pdf.embedPng(params.imageBuffer);
  page.drawImage(image, {
    x: 0,
    y: 0,
    width: page.getWidth(),
    height: page.getHeight(),
  });
  const bytes = await pdf.save();
  return Buffer.from(bytes);
}

export async function inspectPdfFonts(pdfBytes: Buffer) {
  const doc = await PDFDocument.load(pdfBytes);
  const fontObjects = doc.context.enumerateIndirectObjects().filter(([, object]) => {
    try {
      return object.toString().includes("/Font");
    } catch {
      return false;
    }
  });
  return fontObjects.length;
}
