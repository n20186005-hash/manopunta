/**
 * 图片压缩脚本（一次性 / 可重复运行）
 *
 * 产出：
 *   public/gallery/punta-del-este-N.jpg        主图（最长边 1600px，mozjpeg，供灯箱与 JSON-LD/OG 使用）
 *   public/gallery/punta-del-este-N-thumb.jpg  缩略图（最长边 640px，供图库网格使用）
 *   public/gallery/hero-mano.jpg               首页 Hero（最长边 1920px）
 *
 * 用法：node scripts/optimize-images.mjs
 *
 * 注意：先把原图读入内存 Buffer 再处理，避免 Windows 下 sharp 占用文件句柄导致写入失败。
 */
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const DIR = 'public/gallery';
const HERO_SOURCE = 'punta-del-este-9.jpg';
const HERO_OUT = 'hero-mano.jpg';

const kb = (n) => `${Math.round(n / 1024)} KB`;

const resizeTo = (buf, width, quality) =>
  sharp(buf)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true, progressive: true, chromaSubsampling: '4:2:0' })
    .toBuffer();

const files = (await fs.readdir(DIR))
  .filter((f) => /^punta-del-este-\d+\.jpg$/.test(f))
  .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));

let totalBefore = 0;
let totalAfter = 0;

for (const file of files) {
  const src = path.join(DIR, file);
  const inputBuf = await fs.readFile(src);
  const before = inputBuf.length;
  const meta = await sharp(inputBuf).metadata();

  const fullBuf = await resizeTo(inputBuf, 1600, 78);
  await fs.writeFile(src, fullBuf);

  const thumbBuf = await resizeTo(inputBuf, 640, 72);
  await fs.writeFile(src.replace(/\.jpg$/, '-thumb.jpg'), thumbBuf);

  totalBefore += before;
  totalAfter += fullBuf.length + thumbBuf.length;

  console.log(
    `${file.padEnd(28)} ${meta.width}x${meta.height}  ${kb(before)} -> ${kb(fullBuf.length)} (+thumb ${kb(thumbBuf.length)})`,
  );
}

// Hero：单独输出一张 1920px 的主视觉
const heroSrc = path.join(DIR, HERO_SOURCE);
const heroInput = await fs.readFile(heroSrc);
const heroBuf = await resizeTo(heroInput, 1920, 80);
await fs.writeFile(path.join(DIR, HERO_OUT), heroBuf);
totalBefore += heroInput.length;
totalAfter += heroBuf.length;
console.log(`${HERO_OUT.padEnd(28)} ${kb(heroInput.length)} -> ${kb(heroBuf.length)}`);

console.log(
  `\nTOTAL: ${(totalBefore / 1024 / 1024).toFixed(1)} MB -> ${(totalAfter / 1024 / 1024).toFixed(1)} MB`,
);
