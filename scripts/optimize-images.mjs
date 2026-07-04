/* Arka plan fotoğraflarını WebP'e çevirir (bg-*.jpg → bg-*.webp).
 * Çalıştırma: node scripts/optimize-images.mjs
 * JPEG'ler eski Safari (<14) fallback'i olarak repoda kalır;
 * theme.js çalışma anında WebP desteğini algılayıp uygun olanı seçer. */
import { readdirSync, statSync } from "node:fs";
import sharp from "sharp";

const root = new URL("../public/", import.meta.url);
const jpgs = readdirSync(root).filter((f) => /^bg-.*\.jpg$/.test(f));

for (const f of jpgs) {
  const src = new URL(f, root).pathname;
  const out = src.replace(/\.jpg$/, ".webp");
  await sharp(src).webp({ quality: 78 }).toFile(out);
  const a = (statSync(src).size / 1024).toFixed(0);
  const b = (statSync(out).size / 1024).toFixed(0);
  console.log(`${f}: ${a}KB → ${b}KB`);
}
