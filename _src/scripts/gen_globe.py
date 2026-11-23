"""Шар из точек для блока «Think global, act local» (CMO 24.11.2026): суша Natural Earth 1:50m (world-atlas@2, land-50m.json),
равномерные точки по сфере (спираль Фибоначчи), ортографическая проекция с горизонтом сверху.
Выход: scripts/globe.svg (суша) и src/data/globe.json (пины и дуги от Дубая в долях кадра).
На сайт идёт растр: globe.svg → public/assets/net/globe-1440.webp и globe-2880.webp (прозрачный фон, headless Chrome 1× и 2×).
SVG из 9 тыс. точек браузер рисует в основном потоке – разовая задача 100–200 мс на телефоне; WebP декодируется в фоне (24.11.2026).

Запуск: python3 scripts/gen_globe.py <land-50m.json> [lon0 lat0 R top roll]"""
import json, math, sys, pathlib
from PIL import Image, ImageDraw

HERE = pathlib.Path(__file__).resolve().parent.parent
W, H = 1440, 700                     # кадр блока
args = sys.argv[2:]
LON0, LAT0, R, TOP, ROLL = (float(a) for a in args) if args else (48.0, -6.0, 780.0, 190.0, 12.0)
CX, CY = W / 2, TOP + R               # центр шара ниже кадра, виден верхний край
N = 90000                             # точек на всю сферу

topo = json.load(open(sys.argv[1]))
sx, sy = topo["transform"]["scale"]; tx, ty = topo["transform"]["translate"]
arcs = []
for a in topo["arcs"]:
    x = y = 0; pts = []
    for dx, dy in a:
        x += dx; y += dy; pts.append((x * sx + tx, y * sy + ty))
    arcs.append(pts)
def ring(idx):
    out = []
    for i in idx:
        p = arcs[i] if i >= 0 else arcs[~i][::-1]
        out += p if not out else p[1:]
    return out

# маска суши в равнопромежуточной растровой сетке 0,1°
MW, MH = 3600, 1800
mask = Image.new("1", (MW, MH), 0); dr = ImageDraw.Draw(mask)
px = lambda lon, lat: ((lon + 180) / 360 * MW, (90 - lat) / 180 * MH)
for g in topo["objects"]["land"]["geometries"]:
    polys = g["arcs"] if g["type"] == "MultiPolygon" else [g["arcs"]]
    for poly in polys:
        for k, r in enumerate(poly):
            pts = [px(*p) for p in ring(r)]
            if len(pts) > 2: dr.polygon(pts, fill=1 if k == 0 else 0)
land = lambda lon, lat: mask.getpixel((min(MW - 1, int((lon + 180) / 360 * MW)), min(MH - 1, int((90 - lat) / 180 * MH))))

l0, f0 = math.radians(LON0), math.radians(LAT0)
def proj(lon, lat, lift=1.0):
    l, f = math.radians(lon), math.radians(lat)
    cosc = math.sin(f0) * math.sin(f) + math.cos(f0) * math.cos(f) * math.cos(l - l0)
    x = math.cos(f) * math.sin(l - l0)
    y = math.cos(f0) * math.sin(f) - math.sin(f0) * math.cos(f) * math.cos(l - l0)
    g = math.radians(ROLL)            # поворот вокруг оси взгляда: линия Таллин – Бангкок ложится ближе к горизонтали
    x, y = x * math.cos(g) - y * math.sin(g), x * math.sin(g) + y * math.cos(g)
    return CX + R * lift * x, CY - R * lift * y, cosc

dots = []
ga = math.pi * (3 - math.sqrt(5))
for i in range(N):
    z = 1 - 2 * (i + .5) / N; r = math.sqrt(1 - z * z); th = ga * i
    lat = math.degrees(math.asin(z)); lon = (math.degrees(th) + 180) % 360 - 180
    if not land(lon, lat): continue
    x, y, c = proj(lon, lat)
    if c <= 0.02 or not (-10 < x < W + 10 and -10 < y < H + 10): continue
    dots.append((x, y, c))

svg = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">',
       f'<circle cx="{CX:.1f}" cy="{CY:.1f}" r="{R:.1f}" fill="#1c1c20"/>']
# размер и яркость точки – по наклону к зрителю; точки одного уровня – один путь из нулевых штрихов со скруглёнными концами
LEVELS = 6
for k in range(LEVELS):
    grp = [(x, y) for x, y, c in dots if min(LEVELS - 1, int(c * LEVELS)) == k]
    if not grp: continue
    c = (k + .5) / LEVELS
    d = "".join(f"M{x:.0f} {y:.0f}h0" for x, y in grp)
    svg.append(f'<path d="{d}" stroke="#8a8a94" stroke-opacity="{.3 + .6 * c:.2f}" stroke-width="{2.2 + 2.6 * c:.1f}" stroke-linecap="round"/>')
svg.append("</svg>")
(HERE / "scripts/globe.svg").write_text("".join(svg))

CITIES = [("Tallinn", 24.75, 59.44), ("Ljubljana", 14.5, 46.05), ("Istanbul", 28.98, 41.0), ("Dubai", 55.27, 25.2), ("Bangkok", 100.5, 13.75)]
def arc(a, b, n=48):
    """Дуга большого круга, приподнятая над шаром к середине."""
    def v(lon, lat):
        l, f = math.radians(lon), math.radians(lat); return (math.cos(f) * math.cos(l), math.cos(f) * math.sin(l), math.sin(f))
    A, B = v(*a), v(*b); om = math.acos(sum(p * q for p, q in zip(A, B)))
    out = []
    for i in range(n + 1):
        t = i / n; s1, s2 = math.sin((1 - t) * om) / math.sin(om), math.sin(t * om) / math.sin(om)
        p = [s1 * A[k] + s2 * B[k] for k in range(3)]
        lat = math.degrees(math.asin(p[2])); lon = math.degrees(math.atan2(p[1], p[0]))
        x, y, _ = proj(lon, lat, 1 + .06 * math.sin(math.pi * t)); out.append((x, y))
    return "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in out)
pins = []
for name, lon, lat in CITIES:
    x, y, c = proj(lon, lat); pins.append({"city": name, "x": round(x / W * 100, 2), "y": round(y / H * 100, 2), "c": round(c, 2)})
dub = next(c for c in CITIES if c[0] == "Dubai")
arcs_out = [{"to": n, "d": arc((dub[1], dub[2]), (lo, la))} for n, lo, la in CITIES if n != "Dubai"]
(HERE / "src/data/globe.json").write_text(json.dumps({"w": W, "h": H, "cx": CX, "cy": CY, "r": R, "top": TOP, "pins": pins, "arcs": arcs_out}, indent=1))
print(len(dots), "точек;", [(p["city"], p["x"], p["y"]) for p in pins])
