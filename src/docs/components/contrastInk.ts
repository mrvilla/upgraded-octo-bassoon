export function contrastInk(color: string): "#111827" | "#f9fafb" {
  const rgb = parseColor(color);
  if (!rgb) {
    return "#111827";
  }
  const [red, green, blue, alpha] = rgb;
  if (alpha < 0.4) {
    return "#111827";
  }
  const luminance = 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
  return luminance > 0.55 ? "#111827" : "#f9fafb";
}

function channel(value: number): number {
  const srgb = value / 255;
  return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

function parseColor(color: string): [number, number, number, number] | null {
  const hex = color.trim();
  const short = /^#([0-9a-f]{3})$/i.exec(hex);
  if (short) {
  const [r, g, b] = short[1].split("");
  if (!r || !g || !b) {
    return null;
  }
  return [parseInt(`${r}${r}`, 16), parseInt(`${g}${g}`, 16), parseInt(`${b}${b}`, 16), 1];
  }
  const long = /^#([0-9a-f]{6})$/i.exec(hex);
  if (long) {
    return [
      parseInt(long[1].slice(0, 2), 16),
      parseInt(long[1].slice(2, 4), 16),
      parseInt(long[1].slice(4, 6), 16),
      1,
    ];
  }
  const rgba = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/i.exec(hex);
  if (rgba) {
    return [Number(rgba[1]), Number(rgba[2]), Number(rgba[3]), rgba[4] === undefined ? 1 : Number(rgba[4])];
  }
  return null;
}
