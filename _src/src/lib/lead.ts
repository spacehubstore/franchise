// Отправка заявки: POST в FORM_ENDPOINT (сервис franchise-lead в Google Cloud → amoCRM «Неразобранное» + BigQuery).
// Без адреса или при сбое заявка уходит в WhatsApp с заполненным текстом.
// Метки (CMO 23.11.2026): UTM – текущего визита (лид по своему следу); клики рекламы (gclid, gbraid, wbraid, fbclid, li_fat_id)
// – текущего визита, а если их нет – последние сохранённые за 90 дней (окно загрузки конверсий в Google Ads); первое касание
// oppref – ID клика рекламы в ChatGPT (OpenAI Ads), нужен для серверной передачи квал-лидов в OpenAI (F-1789, CMO 23.11.2026);
// без него в адресе берём cookie __oppref, которую пишет пиксель OpenAI.
// хранится отдельно (first_touch). Плюс fbc/fbp для Meta, GA client_id, источник перехода.
import { CONTACTS, FORM_ENDPOINT } from "../data/site";

const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
const CLICK = ["gclid", "gbraid", "wbraid", "fbclid", "li_fat_id", "oppref"];
const DAY = 864e5, KEEP = 90 * DAY;
const get = (st: Storage, k: string) => { try { return JSON.parse(st.getItem(k) || "null"); } catch { return null; } };
const put = (st: Storage, k: string, v: unknown) => { try { st.setItem(k, JSON.stringify(v)); } catch { /* без хранилища */ } };

// при загрузке страницы: метки визита – в sessionStorage, клики – в localStorage с датой, первое касание – один раз
export function captureTouch() {
  const p = new URLSearchParams(location.search), now = Date.now();
  const visit: Record<string, string> = {};
  [...UTM, ...CLICK].forEach((k) => { const v = p.get(k); if (v) visit[k] = v; });
  if (document.referrer && !document.referrer.startsWith(location.origin)) visit.referrer = document.referrer;
  if (Object.keys(visit).length) put(sessionStorage, "sh_visit", { ...(get(sessionStorage, "sh_visit") || {}), ...visit, page: location.href });
  const clicks = CLICK.filter((k) => visit[k]);
  if (clicks.length) put(localStorage, "sh_click", { ...Object.fromEntries(clicks.map((k) => [k, visit[k]])), at: now });
  const ft = get(localStorage, "sh_first");
  if (!ft || now - ft.at > KEEP) put(localStorage, "sh_first", { ...visit, page: location.href, at: now });
}

function cookie(n: string) { return (document.cookie.match(new RegExp("(?:^|; )" + n + "=([^;]*)")) || [])[1] || ""; }

function marks() {
  const visit = get(sessionStorage, "sh_visit") || {};
  const o: Record<string, unknown> = {};
  UTM.forEach((k) => { if (visit[k]) o[k] = visit[k]; });
  const saved = get(localStorage, "sh_click");
  const old = saved && Date.now() - saved.at < KEEP ? saved : {};
  CLICK.forEach((k) => { const v = visit[k] || old[k]; if (v) o[k] = v; });
  if (!o.oppref && cookie("__oppref")) o.oppref = decodeURIComponent(cookie("__oppref"));
  if (visit.referrer) o.referrer = visit.referrer;
  const fbclid = o.fbclid as string | undefined;
  o.fbc = cookie("_fbc") || (fbclid ? `fb.1.${saved && saved.fbclid === fbclid ? saved.at : Date.now()}.${fbclid}` : "");
  o.fbp = cookie("_fbp");
  const ft = get(localStorage, "sh_first"); if (ft) o.first_touch = ft;
  return o;
}

// Повторная отправка (CMO 23.11.2026, проверка конверсий): двойной клик или второй Enter, пока заявка уходит, создавали вторую заявку
// в amoCRM и второе callback_form_sent (вторая конверсия Google Ads с другим request_id). Форма заперта до ответа сервиса,
// а та же форма с тем же телефоном, уже принятая сервисом в этой сессии, заявку не повторяет.
export function onSubmitOnce(form: HTMLFormElement, run: () => Promise<void>) {
  let busy = false;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (busy) return;
    busy = true;
    const btn = form.querySelector<HTMLButtonElement>('[type="submit"]');
    if (btn) btn.disabled = true;
    try { await run(); } finally { busy = false; if (btn) btn.disabled = false; }
  });
}
const sentKey = (lead: Record<string, unknown>) => `${lead.form}|${String(lead.phone || "").replace(/\D/g, "")}`;

// номер последней заявки: тот же уходит в сервис заявок (amoCRM, BigQuery) и в dataLayer – ID транзакции конверсии Google Ads
export let lastRequestId = "";
export async function sendLead(lead: Record<string, unknown>, waText: string): Promise<"endpoint" | "whatsapp" | "repeat"> {
  const sent: string[] = get(sessionStorage, "sh_lead_sent") || [];
  if (sent.includes(sentKey(lead))) return "repeat";
  const f = get(sessionStorage, "sh_lead_fields") || {};
  const body = { source: "franchise_site", page: location.href, site_variant: location.pathname,
                 request_id: (lastRequestId = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
                 ga_client_id: (document.cookie.match(/_ga=GA\d\.\d\.(\d+\.\d+)/) || [])[1] || "",
                 phone_country: f.country || "", ...marks(), ...lead };
  if (FORM_ENDPOINT) {
    try {
      const r = await fetch(FORM_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (r.ok) { put(sessionStorage, "sh_lead_sent", [...sent, sentKey(lead)]); return "endpoint"; }
    } catch { /* уходим в WhatsApp */ }
  }
  const url = `${CONTACTS.whatsapp.url}?text=${encodeURIComponent(waText)}`;
  if (!window.open(url, "_blank")) location.href = url;   // окно могли заблокировать после ожидания ответа
  return "whatsapp";
}
