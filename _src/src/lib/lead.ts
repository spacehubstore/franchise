// Отправка заявки: POST в FORM_ENDPOINT (сервис в Google Cloud → amoCRM). Без адреса или при сбое заявка уходит в WhatsApp
// с заполненным текстом. Метки UTM, клики рекламы и GA client_id едут вместе с заявкой для склейки в CRM.
import { CONTACTS, FORM_ENDPOINT } from "../data/site";

const KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid", "li_fat_id"];

function marks() {
  const p = new URLSearchParams(location.search);
  const o: Record<string, string> = {};
  KEYS.forEach((k) => { const v = p.get(k); if (v) o[k] = v; });
  return o;
}

export async function sendLead(lead: Record<string, unknown>, waText: string): Promise<"endpoint" | "whatsapp"> {
  const body = { source: "franchise_site", page: location.href, site_variant: location.pathname,
                 ga_client_id: (document.cookie.match(/_ga=GA\d\.\d\.(\d+\.\d+)/) || [])[1] || "", ...marks(), ...lead };
  if (FORM_ENDPOINT) {
    try {
      const r = await fetch(FORM_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (r.ok) return "endpoint";
    } catch { /* уходим в WhatsApp */ }
  }
  window.open(`${CONTACTS.whatsapp.url}?text=${encodeURIComponent(waText)}`, "_blank");
  return "whatsapp";
}
