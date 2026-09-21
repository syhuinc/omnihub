// capacitor-assets always regenerates these with a 16.7% <inset> on both
// layers, which shrinks and dims our full-bleed icon art. Strip it back out
// after every `npx capacitor-assets generate`.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const XML = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
`;

const resDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res', 'mipmap-anydpi-v26');

for (const name of ['ic_launcher.xml', 'ic_launcher_round.xml']) {
  fs.writeFileSync(path.join(resDir, name), XML);
  console.log(`fixed ${name}`);
}
