// Изометрические сцены в стиле лендинга (белые боксы, оранжевые рамки дверей, как 3D-иконки из Figma).
// Собираются при сборке в статичный SVG; анимация – CSS по классам групп (Floor.astro).
const C = Math.cos(Math.PI / 6);

export type Pt = [number, number];
export type Iso = { s: number; ox: number; oy: number };

export const pt = (v: Iso, x: number, y: number, z: number): Pt =>
  [v.ox + (x - y) * C * v.s, v.oy + (x + y) * 0.5 * v.s - z * v.s];

const poly = (ps: Pt[], cls: string) => `<polygon class="${cls}" points="${ps.map((p) => p.map((n) => n.toFixed(1)).join(",")).join(" ")}"/>`;

export type BoxOpt = { door?: "or" | "grey" | "none"; cls?: string; style?: string; top?: string };

// бокс: верх, правая грань (x = x+w), передняя грань (y = y+d) с дверью в оранжевой рамке
export function box(v: Iso, x: number, y: number, z: number, w: number, d: number, h: number, o: BoxOpt = {}) {
  const P = (a: number, b: number, c: number) => pt(v, a, b, c);
  const top = poly([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], o.top ?? "f-top");
  const right = poly([P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)], "f-r");
  const front = poly([P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)], "f-l");
  let door = "";
  if ((o.door ?? "or") !== "none") {
    const yy = y + d, m = Math.min(w * 0.14, 0.25), dh = h * 0.86;
    const frame = [P(x + m, yy, z), P(x + w - m, yy, z), P(x + w - m, yy, z + dh), P(x + m, yy, z + dh)];
    const f = 0.07;
    const inner = [P(x + m + f, yy, z), P(x + w - m - f, yy, z), P(x + w - m - f, yy, z + dh - f), P(x + m + f, yy, z + dh - f)];
    door = poly(frame, `d-frame d-${o.door ?? "or"}`) + poly(inner, "d-panel");
  }
  return `<g class="${o.cls ?? ""}"${o.style ? ` style="${o.style}"` : ""}>${right}${front}${top}${door}</g>`;
}

// плита пола
export const slab = (v: Iso, x: number, y: number, w: number, d: number, cls = "slab") =>
  box(v, x, y, -0.25, w, d, 0.25, { door: "none", cls, top: "f-floor" });

// сетка боксов: cols по x, rows по y, порядок отрисовки – от дальних к ближним
export function grid(v: Iso, o: { x0: number; y0: number; z?: number; cols: number; rows: number; w: number; d: number; h: number; gap: number;
  cls?: (i: number, c: number, r: number) => string; door?: (i: number) => "or" | "grey" }) {
  const cells: { c: number; r: number }[] = [];
  for (let r = 0; r < o.rows; r++) for (let c = 0; c < o.cols; c++) cells.push({ c, r });
  cells.sort((a, b) => a.c + a.r - (b.c + b.r));
  return cells.map(({ c, r }) => {
    const i = r * o.cols + c;
    return box(v, o.x0 + c * (o.w + o.gap), o.y0 + r * (o.d + o.gap), o.z ?? 0, o.w, o.d, o.h,
      { door: o.door?.(i) ?? "or", cls: `u ${o.cls?.(i, c, r) ?? ""}`, style: `--i:${c + r}` });
  }).join("");
}
