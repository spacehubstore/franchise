// Единое окно заявки (CMO 22.11.2026): одни поля везде – имя, город, телефон, согласие. Разметка – components/LeadModal.astro.
// Кто открывает, передаёт метку формы, заголовок, подстановку города и страны и данные для заявки (например, расчёт).
import { sendLead } from "./lead";
import { initForm, checkForm, setPhoneCountry, refillForm } from "./forms";

export type LeadOpts = {
  form: string; title: string; lead: string;
  city?: string; country?: string;
  data?: Record<string, unknown>;
  text?: (who: string) => string;   // текст для WhatsApp, если сервис заявок недоступен
};

let ready = false, cur: LeadOpts | null = null;

export function openLead(o: LeadOpts) {
  const dlg = document.querySelector<HTMLDialogElement>("[data-lead-modal]")!;
  const form = dlg.querySelector<HTMLFormElement>("form")!;
  const city = form.querySelector<HTMLInputElement>('input[name="city"]')!;
  if (!ready) {
    ready = true;
    initForm(form);
    city.addEventListener("input", () => (city.dataset.touched = "1"));
    dlg.querySelector("[data-lm-close]")!.addEventListener("click", () => dlg.close());
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!cur) return;
      const { ok, phone } = checkForm(form, cur.form);
      if (!ok) return;
      const fd = new FormData(form);
      const who = `${fd.get("name")}, ${phone}, ${fd.get("city") || ""}`;
      const how = await sendLead({ form: cur.form, name: fd.get("name"), city: fd.get("city"), phone, ...(cur.data || {}) },
                                 cur.text ? cur.text(who) : `Franchise request (${cur.form}): ${who}`);
      (window as any).dataLayer?.push({ event: "franchise_callback_form_sent", form_location: cur.form, site_variant: location.pathname, delivery: how });
      dlg.querySelector<HTMLElement>("[data-lm-ok]")!.hidden = false;
    });
  }
  cur = o;
  dlg.querySelector("[data-lm-h]")!.textContent = o.title;
  dlg.querySelector("[data-lm-lead]")!.textContent = o.lead;
  dlg.querySelector<HTMLElement>("[data-lm-ok]")!.hidden = true;
  refillForm(form);
  if (o.city !== undefined && !city.dataset.touched) city.value = o.city;
  if (o.country) setPhoneCountry(form, o.country);
  (window as any).dataLayer?.push({ event: "lead_modal_open", form_location: o.form });
  dlg.showModal();
}
