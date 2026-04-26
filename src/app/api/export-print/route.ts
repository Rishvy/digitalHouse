import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DPI, mmToPx } from "@/lib/editor/print";

interface ExportRequestBody {
  canvasJson: string;
  printSize: {
    widthMm: number;
    heightMm: number;
    bleedMm: number;
  };
  format?: "pdf" | "png";
}

async function renderCanvasToPng(canvasJson: string, widthPx: number, heightPx: number): Promise<Buffer> {
  const { fabric } = await import("fabric");
  
  return new Promise((resolve, reject) => {
    try {
      const canvas = new fabric.StaticCanvas(null, {
        width: widthPx,
        height: heightPx,
      });
      
      canvas.loadFromJSON(JSON.parse(canvasJson), () => {
        const dataUrl = canvas.toDataURL({
          format: "png",
          quality: 1,
          multiplier: 1,
        });
        
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
        resolve(Buffer.from(base64Data, "base64"));
      });
    } catch (error) {
      reject(error);
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body: ExportRequestBody = await request.json();
    const { canvasJson, printSize, format = "pdf" } = body;
    
    if (!canvasJson) {
      return NextResponse.json(
        { error: "Missing canvasJson payload" },
        { status: 400 }
      );
    }
    
    const { widthMm = 92, heightMm = 54, bleedMm = 3 } = printSize || {};
    
    const pdfWidthPx = mmToPx(widthMm);
    const pdfHeightPx = mmToPx(heightMm);
    
    const imageBuffer = await renderCanvasToPng(canvasJson, pdfWidthPx, pdfHeightPx);
    
    if (format === "png") {
      return new NextResponse(imageBuffer as unknown as Blob, {
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `attachment; filename="print-${widthMm}x${heightMm}mm-${DPI}dpi.png"`,
        },
      });
    }
    
    const PDFDocument = require("pdfkit") as any;
    
    const cropMarkLength = 15;
    const trimOffset = mmToPx(bleedMm) + cropMarkLength;
    
    const pageWidth = pdfWidthPx + trimOffset * 2;
    const pageHeight = pdfHeightPx + trimOffset * 2;
    
    const pdfDoc = new PDFDocument({
      size: [pageWidth, pageHeight],
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      info: {
        Title: `Print Ready - ${widthMm}x${heightMm}mm`,
        Creator: "Web-to-Print Platform",
      },
    });
    
    const chunks: Buffer[] = [];
    pdfDoc.on("data", (chunk: Buffer) => chunks.push(chunk));
    
    await new Promise<void>((resolve, reject) => {
      pdfDoc.on("error", reject);
      pdfDoc.on("end", resolve);
      
      pdfDoc.strokeColor("#000000");
      pdfDoc.lineWidth(0.5);
      
      const fullWidth = pdfWidthPx;
      const fullHeight = pdfHeightPx;
      
      pdfDoc.moveTo(trimOffset, trimOffset - cropMarkLength);
      pdfDoc.lineTo(trimOffset, trimOffset);
      pdfDoc.stroke();
      
      pdfDoc.moveTo(trimOffset, trimOffset + fullHeight);
      pdfDoc.lineTo(trimOffset, trimOffset + fullHeight + cropMarkLength);
      pdfDoc.stroke();
      
      pdfDoc.moveTo(trimOffset + fullWidth, trimOffset - cropMarkLength);
      pdfDoc.lineTo(trimOffset + fullWidth, trimOffset);
      pdfDoc.stroke();
      
      pdfDoc.moveTo(trimOffset + fullWidth, trimOffset + fullHeight);
      pdfDoc.lineTo(trimOffset + fullWidth, trimOffset + fullHeight + cropMarkLength);
      pdfDoc.stroke();
      
      pdfDoc.moveTo(trimOffset - cropMarkLength, trimOffset);
      pdfDoc.lineTo(trimOffset, trimOffset);
      pdfDoc.stroke();
      
      pdfDoc.moveTo(trimOffset - cropMarkLength, trimOffset + fullHeight);
      pdfDoc.lineTo(trimOffset, trimOffset + fullHeight);
      pdfDoc.stroke();
      
      pdfDoc.image(imageBuffer, {
        x: trimOffset,
        y: trimOffset,
        width: pdfWidthPx,
        height: pdfHeightPx,
      });
      
      pdfDoc.end();
    });
    
    const pdfBuffer = Buffer.concat(chunks);
    
    return new NextResponse(pdfBuffer as unknown as Blob, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="print-${widthMm}x${heightMm}mm-${DPI}dpi.pdf"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    
    return NextResponse.json(
      { error: "Failed to generate print-ready file" },
      { status: 500 }
    );
  }
}