export const DPI = 300;

export const MM_TO_INCH = 0.0393701;
export const INCH_TO_MM = 25.4;

export const mmToPx = (mm: number): number => {
  return Math.round(mm * MM_TO_INCH * DPI);
};

export const pxToMm = (px: number): number => {
  return Math.round(px / DPI / MM_TO_INCH);
};

export interface PrintSize {
  widthMm: number;
  heightMm: number;
  bleedMm: number;
  trimMarginMm: number;
}

export const BUSINESS_CARD: PrintSize = {
  widthMm: 92,
  heightMm: 54,
  bleedMm: 3,
  trimMarginMm: 3,
};

export const A5_FLYER: PrintSize = {
  widthMm: 148,
  heightMm: 210,
  bleedMm: 3,
  trimMarginMm: 3,
};

export const A4_LETTERHEAD: PrintSize = {
  widthMm: 210,
  heightMm: 297,
  bleedMm: 3,
  trimMarginMm: 3,
};

export const getTrimBox = (size: PrintSize) => {
  const bleed = size.bleedMm;
  const margin = size.trimMarginMm;
  
  return {
    x: mmToPx(bleed),
    y: mmToPx(bleed),
    width: mmToPx(size.widthMm - bleed * 2),
    height: mmToPx(size.heightMm - bleed * 2),
  };
};

export const getBleedBox = (size: PrintSize) => {
  const bleed = size.bleedMm;
  
  return {
    x: 0,
    y: 0,
    width: mmToPx(size.widthMm),
    height: mmToPx(size.heightMm),
  };
};

export const getSafeBox = (size: PrintSize) => {
  const bleed = size.bleedMm;
  const margin = size.trimMarginMm;
  
  return {
    x: mmToPx(bleed + margin),
    y: mmToPx(bleed + margin),
    width: mmToPx(size.widthMm - (bleed + margin) * 2),
    height: mmToPx(size.heightMm - (bleed + margin) * 2),
  };
};

export const getCanvasDimensions = (size: PrintSize) => {
  return {
    width: mmToPx(size.widthMm),
    height: mmToPx(size.heightMm),
  };
};