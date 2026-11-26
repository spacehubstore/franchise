// События поведения для GA4 через GTM-TJVPKFZ (CMO 27.11.2026): по прежним событиям нельзя было отличить «не дошёл до блока»
// от «увидел и не захотел». Добавлены: глубина прокрутки, показ разделов, показ кнопок заявки, первое действие в калькуляторе,
// начало ввода в форму. Каждое событие уходит один раз за просмотр страницы. Имена и параметры – в hub/03-audit/gtm-franchise-landing.md.
const dl = (o: object) => (window as any).dataLayer?.push({ ...o, site_variant: location.pathname });

// разделы страницы по порядку; имя уходит в параметр section, номер – в section_index
const SECTIONS: [string, string][] = [
  [".hero", "hero"], ["[data-floor]", "floor"], [".inc", "includes"], ["#calc", "calc"], ["#check", "quiz"],
  ["#study", "study"], ["#faq", "faq"], ["#timeline", "timeline"], ["#network", "network"], ["#contact", "contact"],
];

/** Срабатывает один раз, когда элемент виден достаточно (ok) не меньше ms миллисекунд подряд. */
function onceVisible(el: Element, ok: (e: IntersectionObserverEntry) => boolean, ms: number, fire: () => void) {
  let timer = 0;
  const io = new IntersectionObserver(([e]) => {
    if (ok(e)) { if (!timer) timer = window.setTimeout(() => { io.disconnect(); fire(); }, ms); }
    else if (timer) { clearTimeout(timer); timer = 0; }
  }, { threshold: [0, .25, .5, .75, 1] });
  io.observe(el);
}

export function initTracking() {
  // 1. глубина прокрутки: 25, 50, 75 и 90 % высоты страницы
  const marks = [25, 50, 75, 90], seen = new Set<number>();
  const onScroll = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    if (h <= 0) return;
    const p = (scrollY / h) * 100;
    marks.forEach((m) => { if (p >= m && !seen.has(m)) { seen.add(m); dl({ event: "scroll_depth", depth: m }); } });
    if (seen.size === marks.length) removeEventListener("scroll", onScroll);
  };
  addEventListener("scroll", onScroll, { passive: true });

  // 2. показ раздела: раздел виден наполовину или занимает половину экрана не меньше секунды
  SECTIONS.forEach(([sel, name], i) => {
    const el = document.querySelector(sel);
    if (el) onceVisible(el, (e) => e.isIntersecting && (e.intersectionRatio >= .5 || e.intersectionRect.height >= innerHeight * .5), 1000,
                        () => dl({ event: "section_viewed", section: name, section_index: i + 1 }));
  });

  // 3. показ кнопки заявки и кнопки мессенджера: по разу на каждое место страницы
  const shown = new Set<string>();
  document.querySelectorAll<HTMLElement>("[data-open-lead], [data-ev='franchise_messenger_clicked'], [data-ev$='_cta']").forEach((b) => {
    const type = b.dataset.ev === "franchise_messenger_clicked" ? "messenger" : "lead";
    const loc = b.dataset.loc || b.closest("section")?.id || "page";
    onceVisible(b, (e) => e.isIntersecting && e.intersectionRatio >= .75 && getComputedStyle(b).opacity !== "0", 500, () => {
      const key = type + ":" + loc;
      if (shown.has(key)) return;
      shown.add(key); dl({ event: "cta_viewed", cta_type: type, event_location: loc });
    });
  });

  // 4. первое действие в калькуляторе
  const calc = document.querySelector("#calc");
  const calcStart = () => { dl({ event: "calc_started" }); calc?.removeEventListener("input", calcStart); calc?.removeEventListener("change", calcStart); };
  calc?.addEventListener("input", calcStart); calc?.addEventListener("change", calcStart);

  // 5. начало ввода в форму заявки: первое введённое значение, по разу на форму
  const started = new WeakSet<HTMLFormElement>();
  document.addEventListener("input", (e) => {
    const f = (e.target as HTMLElement).closest?.("form") as HTMLFormElement | null;
    if (!f || started.has(f) || f.closest("#calc")) return;
    started.add(f);
    const form = f.closest("[data-quiz]") ? "quiz" : f.closest("#contact") ? "contact" : "modal";
    dl({ event: "form_started", form_location: "partner", lead_form: form, field: (e.target as HTMLInputElement).name || "" });
  });
}
