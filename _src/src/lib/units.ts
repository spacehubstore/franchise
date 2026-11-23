// Единицы площади на весь лендинг: м² или sq ft. ЦА в разных странах считает по-разному (CMO 22.11.2026), поэтому выбор
// один на страницу: переключатель в шапке, калькуляторе и квизе меняет всё сразу и запоминается в браузере.
export type Unit = "m2" | "ft";
export const SQFT = 10.7639;   // sq ft в 1 м²
export const FT = 3.28084;     // ft в 1 м
const KEY = "sh_area_unit";
const EV = "area-unit";

export function getUnit(): Unit {
  try { const v = localStorage.getItem(KEY); if (v === "m2" || v === "ft") return v; } catch { /* без хранилища – м² */ }
  return "m2";
}

export function setUnit(u: Unit) {
  try { localStorage.setItem(KEY, u); } catch { /* только на эту страницу */ }
  window.dispatchEvent(new CustomEvent(EV, { detail: u }));
  (window as any).dataLayer?.push({ event: "area_unit_changed", area_unit: u });
}

export function onUnit(cb: (u: Unit) => void) {
  window.addEventListener(EV, (e) => cb((e as CustomEvent).detail));
  cb(getUnit());
}

export const areaLabel = (u: Unit) => (u === "ft" ? "sq ft" : "m²");
export const lenLabel = (u: Unit) => (u === "ft" ? "ft" : "m");

// все переключатели [data-units] на странице: клик меняет единицы, состояние кнопок следует за общим выбором
export function bindToggles() {
  document.querySelectorAll<HTMLButtonElement>("[data-units] [data-u]").forEach((b) =>
    b.addEventListener("click", (e) => { e.preventDefault(); setUnit(b.dataset.u as Unit); }));
  onUnit((u) => document.querySelectorAll<HTMLButtonElement>("[data-units] [data-u]").forEach((b) => b.classList.toggle("on", b.dataset.u === u)));
}
