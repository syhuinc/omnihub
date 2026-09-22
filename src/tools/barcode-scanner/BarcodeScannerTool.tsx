import { BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { BarcodeScannerView } from '../scanner/BarcodeScannerView';

const PRODUCT_BARCODE_FORMATS = [
  BarcodeFormat.Aztec,
  BarcodeFormat.Codabar,
  BarcodeFormat.Code39,
  BarcodeFormat.Code93,
  BarcodeFormat.Code128,
  BarcodeFormat.DataMatrix,
  BarcodeFormat.Ean8,
  BarcodeFormat.Ean13,
  BarcodeFormat.Itf,
  BarcodeFormat.Pdf417,
  BarcodeFormat.UpcA,
  BarcodeFormat.UpcE,
];

export function BarcodeScannerTool() {
  return <BarcodeScannerView title="Barcode Scanner" formats={PRODUCT_BARCODE_FORMATS} />;
}
