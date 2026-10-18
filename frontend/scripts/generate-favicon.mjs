import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const SIZES = [16, 32, 48, 64, 128, 256];

const svgUrl = new URL("../src/app/icon.svg", import.meta.url);
const outUrl = new URL("../src/app/favicon.ico", import.meta.url);

function buildIco(pngs) {
  const count = pngs.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  let offset = 6 + count * 16;
  const entries = [];
  for (const { size, data } of pngs) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += data.length;
  }

  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

const svg = await readFile(svgUrl);
const pngs = await Promise.all(
  SIZES.map(async (size) => ({
    size,
    data: await sharp(svg).resize(size, size).png().toBuffer(),
  }))
);

await writeFile(outUrl, buildIco(pngs));
console.log(`Generated ${fileURLToPath(outUrl)} (${SIZES.join(", ")} px)`);
