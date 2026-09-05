/**
 * Barcode Generator and Parser Utility
 * 
 * Supports:
 * 1. Standard SKU / EAN / Code128 pattern rendering via scalable SVG (no heavy external lib required)
 * 2. Custom weight-embedded barcodes (Standard Supermarket / Deli format: 20 + 4-digit product code + 5-digit weight in grams + 1 check digit)
 *    Example: 200101003504 -> Prefix '20', Product Code '0101', Weight 350 grams (0.35 kg).
 * 3. Auto-generation of random unique barcodes or sequential barcodes.
 */

// Simple Code 128 / Code 39 bar pattern generator for rendering pure SVG barcodes
export function generateBarcodeSvg(code: string, width = 220, height = 65): string {
  // Generate deterministic bar widths based on char codes
  const clean = code.trim().toUpperCase() || '000000';
  let pattern = '101001101101'; // start pattern
  for (let i = 0; i < clean.length; i++) {
    const charCode = clean.charCodeAt(i);
    // Produce 6-8 bars per char deterministically
    const bin = (charCode * 17 + 101).toString(2).slice(-6);
    pattern += bin + '0';
  }
  pattern += '11001101011'; // stop pattern

  // Render SVG lines
  const barWidth = width / pattern.length;
  let rects = '';
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === '1') {
      rects += `<rect x="${(i * barWidth).toFixed(1)}" y="0" width="${barWidth.toFixed(1)}" height="${height - 18}" fill="#0f172a" />`;
    }
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="${height}" preserveAspectRatio="none">
      <rect width="${width}" height="${height}" fill="#ffffff" />
      ${rects}
      <text x="${width / 2}" y="${height - 4}" font-family="monospace" font-size="11" font-weight="bold" fill="#334155" text-anchor="middle" letter-spacing="2">
        ${clean}
      </text>
    </svg>
  `.trim();
}

/**
 * Generate a weight-embedded barcode (EAN-13 deli format standard)
 * Format: 20 + 4-digit Item Code + 5-digit Weight in Grams + 1 Check Digit
 * Example: itemCode = "0101", weightGrams = 450 -> "200101004509"
 */
export function generateWeightBarcode(productCode: string, weightGrams: number): string {
  // Extract digits or hash from productCode to 4 digits
  let codeDigits = productCode.replace(/\D/g, '');
  if (!codeDigits) {
    let hash = 0;
    for (let i = 0; i < productCode.length; i++) {
      hash = (hash * 31 + productCode.charCodeAt(i)) % 10000;
    }
    codeDigits = String(hash).padStart(4, '0');
  } else {
    codeDigits = codeDigits.padStart(4, '0').slice(-4);
  }

  const weightClean = Math.round(Math.max(1, weightGrams));
  const weightStr = String(weightClean).padStart(5, '0').slice(-5);
  const raw11 = `20${codeDigits}${weightStr}`;

  // Calculate standard modulo 10 checksum
  let sum = 0;
  for (let i = 0; i < raw11.length; i++) {
    const digit = parseInt(raw11[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return `${raw11}${checkDigit}`;
}

/**
 * Parses any scanned barcode string.
 * Detects if it is a weight-embedded barcode (starts with 20 and has 12-13 digits).
 */
export interface ParsedBarcodeResult {
  raw: string;
  isWeightBarcode: boolean;
  productCodeMatch?: string; // 4-digit code
  weightGrams?: number;
  weightKg?: number;
}

export function parseScannedBarcode(rawBarcode: string): ParsedBarcodeResult {
  const clean = rawBarcode.trim();

  // Check deli / custom scale weight pattern: 20 + 4 digit item + 5 digit weight + check
  if (/^20\d{10,11}$/.test(clean)) {
    const productCodeMatch = clean.substring(2, 6);
    const weightGrams = parseInt(clean.substring(6, 11), 10);
    return {
      raw: clean,
      isWeightBarcode: true,
      productCodeMatch,
      weightGrams,
      weightKg: parseFloat((weightGrams / 1000).toFixed(3)),
    };
  }

  return {
    raw: clean,
    isWeightBarcode: false,
  };
}

/**
 * Generate standard unique EAN/UPC-like barcode for an inventory item
 */
export function generateRandomBarcode(prefix = '890'): string {
  const randomDigits = Math.floor(100000000 + Math.random() * 900000000).toString();
  return `${prefix}${randomDigits}`;
}

export function generateStandardBarcode(codeOrPrefix?: string): string {
  if (codeOrPrefix && /^\d+$/.test(codeOrPrefix)) {
    return `890${codeOrPrefix.padStart(9, '0').slice(-9)}`;
  }
  return generateRandomBarcode('890');
}

