// Моргание перед стартом ролика (CMO 23.11.2026, мобилка): между заставкой и первым кадром браузер показывает пустой кадр –
// заставка снимается в момент play(), а кадр декодируется позже (iOS Safari, Chrome на Android). На это время ролик почти
// прозрачен, а на его месте стоит картинка того же кадра; убираем её, когда первый кадр уже нарисован
// (requestVideoFrameCallback или пошедшее currentTime – что раньше).
type V = HTMLVideoElement & { _cov?: HTMLImageElement; _covId?: number };

export function cover(v: V, src = v.poster) {
  if (!src) return;
  let img = v._cov;
  if (!img) {
    img = document.createElement("img"); img.alt = ""; img.setAttribute("aria-hidden", "true"); img.decoding = "async";
    const p = v.parentElement!, cs = getComputedStyle(v);
    if (getComputedStyle(p).position === "static") p.style.position = "relative";
    Object.assign(img.style, { position: "absolute", pointerEvents: "none", objectFit: cs.objectFit, mixBlendMode: cs.mixBlendMode, margin: "0", maxWidth: "none" });
    v.after(img); v._cov = img;
  }
  const s = img.style;
  const pw = v.parentElement!.clientWidth || 1, ph = v.parentElement!.clientHeight || 1, pc = (x: number, d: number) => (100 * x / d) + "%";
  s.left = pc(v.offsetLeft, pw); s.top = pc(v.offsetTop, ph); s.width = pc(v.offsetWidth, pw); s.height = pc(v.offsetHeight, ph);   // в % – переживает поворот экрана
  if (img.getAttribute("src") !== src) img.src = src;
  img.style.display = ""; v.style.opacity = "0.001";   // не 0: полностью прозрачный ролик браузер может не рисовать
  const id = (v._covId = (v._covId || 0) + 1);
  const off = () => { if (v._covId !== id) return; const k = ++v._covId; v.style.opacity = ""; requestAnimationFrame(() => { if (v._covId === k) img!.style.display = "none"; }); };
  (v as any).requestVideoFrameCallback?.call(v, () => off());
  const t = () => { if (v._covId !== id) return; if (!v.paused && v.readyState >= 2 && v.currentTime > 0.05) off(); else requestAnimationFrame(t); };
  requestAnimationFrame(t);
}

// снять картинку сразу (ролик не будет играть – показан итог)
export const uncover = (v: V) => { if (v._cov) { v._covId = (v._covId || 0) + 1; v._cov.style.display = "none"; } v.style.opacity = ""; };
