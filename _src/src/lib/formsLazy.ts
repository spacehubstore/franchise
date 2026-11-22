// Ленивое подключение форм (CMO 23.11.2026): библиотека телефонов (~40 КБ) грузится, когда форма близко к экрану,
// при первом фокусе в ней или при открытии окна заявки – не при загрузке страницы.
type Forms = typeof import("./forms");
let mod: Promise<Forms> | null = null;
const load = () => (mod ??= import("./forms"));
const done = new WeakSet<HTMLFormElement>();

export async function ready(form: HTMLFormElement): Promise<Forms> {
  const m = await load();
  if (!done.has(form)) { done.add(form); m.initForm(form); }
  return m;
}

export function prepare(form: HTMLFormElement, margin = "900px") {
  const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { ready(form); io.disconnect(); } }, { rootMargin: margin });
  io.observe(form);
  form.addEventListener("focusin", () => ready(form), { once: true });
}
