import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";
let stone: CanvasTexture | undefined;
export function useStoneTexture() {
  if (stone) return stone;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#b7b5a1";
  ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 2400; i++) {
    const v = 100 + ((i * 37) % 100);
    ctx.fillStyle = `rgba(${v},${v},${v - 15},.14)`;
    ctx.fillRect((i * 73) % 128, (i * 113) % 128, 1 + (i % 4), 1 + (i % 3));
  }
  ctx.strokeStyle = "#696d5b55";
  ctx.lineWidth = 1;
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 19, 0);
    ctx.lineTo(i * 19 + 9, 38);
    ctx.lineTo(i * 19 - 5, 67);
    ctx.stroke();
  }
  const tex = new CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.colorSpace = SRGBColorSpace;
  stone = tex;
  return tex;
}
