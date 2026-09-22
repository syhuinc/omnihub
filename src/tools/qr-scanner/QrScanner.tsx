import { BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { BarcodeScannerView } from '../scanner/BarcodeScannerView';

export function QrScanner() {
  return <BarcodeScannerView title="QR Scanner" formats={[BarcodeFormat.QrCode]} />;
}
