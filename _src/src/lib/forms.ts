// Поля форм (CMO 22.11.2026): телефон с маской страны, проверка полей с подсказкой под полем, общие данные между формами.
// Телефон – libphonenumber-js: формат по мере ввода, страна по вставленному «+971…» / «00971…», в заявку – E.164 (+971501234567).
import { AsYouType, getCountries, getCountryCallingCode, parsePhoneNumberFromString, isValidPhoneNumber, getExampleNumber, type CountryCode } from "libphonenumber-js";
import examples from "libphonenumber-js/mobile/examples";

const TOP: CountryCode[] = ["AE", "TH", "SA", "EE", "PH", "TR"];
const TZ: Record<string, CountryCode> = { "Asia/Dubai": "AE", "Asia/Bangkok": "TH", "Asia/Riyadh": "SA", "Europe/Tallinn": "EE", "Asia/Manila": "PH", "Europe/Istanbul": "TR" };
const KEY = "sh_lead_fields";
const flag = (c: string) => c.replace(/./g, (ch) => String.fromCodePoint(127397 + ch.charCodeAt(0)));
const names = new Intl.DisplayNames(["en"], { type: "region" });
const dl = (o: object) => (window as any).dataLayer?.push(o);

// общие данные форм в пределах вкладки
function store(): Record<string, string> { try { return JSON.parse(sessionStorage.getItem(KEY) || "{}"); } catch { return {}; } }
function save(k: string, v: string) { try { const s = store(); s[k] = v; sessionStorage.setItem(KEY, JSON.stringify(s)); } catch { /* без хранилища */ } }

export function defaultCountry(): CountryCode {
  const s = store().country as CountryCode;
  if (s) return s;
  try { const tz = Intl.DateTimeFormat().resolvedOptions().timeZone; if (TZ[tz]) return TZ[tz]; } catch { /* нет часового пояса */ }
  return "AE";
}

type Ph = { sel: HTMLSelectElement; inp: HTMLInputElement; cc: HTMLElement; country: () => CountryCode; set: (c: CountryCode, user?: boolean) => void };
const PH = new WeakMap<HTMLFormElement, Ph>();

function initPhone(form: HTMLFormElement): Ph | null {
  const sel = form.querySelector<HTMLSelectElement>('select[name="code"]'), inp = form.querySelector<HTMLInputElement>('input[name="phone"]');
  if (!sel || !inp) return null;
  // список: наши рынки сверху, дальше все страны по алфавиту; выбранное показывается коротко – флаг и код
  const all = getCountries().filter((c) => !TOP.includes(c)).sort((a, b) => (names.of(a) || a).localeCompare(names.of(b) || b));
  const opt = (c: CountryCode) => new Option(`${flag(c)} ${names.of(c)} +${getCountryCallingCode(c)}`, c);
  sel.innerHTML = ""; TOP.forEach((c) => sel.add(opt(c)));
  const sep = new Option("──────────", ""); sep.disabled = true; sel.add(sep);
  all.forEach((c) => sel.add(opt(c)));
  const cc = document.createElement("span"); cc.className = "ph__cc";
  sel.before(cc); cc.appendChild(sel);
  const lab = document.createElement("b"); cc.prepend(lab);
  inp.type = "tel"; inp.inputMode = "tel"; inp.autocomplete = "tel-national";
  const country = () => (sel.value || "AE") as CountryCode;
  const fmt = () => { const raw = inp.value.replace(/[^\d]/g, ""); inp.value = new AsYouType(country()).input(raw); };
  const set = (c: CountryCode, user = false) => {
    sel.value = c; lab.textContent = `${flag(c)} +${getCountryCallingCode(c)}`;
    const ex = getExampleNumber(c, examples);
    inp.placeholder = ex ? ex.formatNational() : "";
    if (user) { sel.dataset.touched = "1"; save("country", c); }
    fmt();
  };
  sel.addEventListener("change", () => { set(country(), true); inp.focus(); });
  inp.addEventListener("input", () => {
    let v = inp.value.trim();
    // вставили номер целиком: «+971 50…» или «00971 50…» – страна определяется сама
    if (v.startsWith("+") || v.startsWith("00")) {
      const p = parsePhoneNumberFromString(v.startsWith("00") ? "+" + v.slice(2) : v);
      if (p?.country) { set(p.country, true); inp.value = p.formatNational(); save("phone", inp.value); clearErr(inp); return; }
      if (v.length < 6) return;   // ещё набирают код
    }
    fmt(); save("phone", inp.value);
    clearErr(inp);
  });
  inp.addEventListener("blur", () => { if (inp.value && !isValidPhoneNumber(inp.value, country())) showErr(inp, `Check the number: ${names.of(country())} numbers look like ${inp.placeholder}`); });
  const st = store();
  set((sel.dataset.country as CountryCode) || defaultCountry());
  if (st.phone && !inp.value) { inp.value = st.phone; fmt(); }
  const ph = { sel, inp, cc, country, set };
  PH.set(form, ph);
  return ph;
}

// подсказка об ошибке – под полем; снимается при вводе
function box(el: HTMLElement) { return el.closest<HTMLElement>(".cf__f, .in, .num__f, .fld") || el; }
function showErr(el: HTMLElement, msg: string) {
  const b = box(el); b.classList.add("is-err");
  let e = b.nextElementSibling as HTMLElement | null;
  if (!e || !e.classList.contains("ferr")) { e = document.createElement("small"); e.className = "ferr"; b.after(e); }
  e.textContent = msg;
}
function clearErr(el: HTMLElement) {
  const b = box(el); b.classList.remove("is-err");
  const e = b.nextElementSibling; if (e?.classList.contains("ferr")) e.remove();
}

export function setPhoneCountry(form: HTMLFormElement, c: string) {
  const ph = PH.get(form); if (ph && !ph.sel.dataset.touched && c) ph.set(c.toUpperCase() as CountryCode);
}

// подключение формы: телефон, автозаполнение, общие поля, подсказки
export function initForm(form: HTMLFormElement) {
  initPhone(form);
  const st = store();
  for (const k of ["name", "city", "email"]) {
    const el = form.querySelector<HTMLInputElement>(`input[name="${k}"]`); if (!el) continue;
    if (k === "name") { el.autocomplete = "name"; el.setAttribute("autocapitalize", "words"); }
    if (k === "email") { el.type = "email"; el.inputMode = "email"; el.autocomplete = "email"; }
    if (k === "city") { el.autocomplete = "address-level2"; el.setAttribute("list", "sh-cities"); }
    if (st[k] && !el.value) el.value = st[k];
    el.addEventListener("input", () => { save(k, el.value.trim()); clearErr(el); });
  }
  form.addEventListener("focusin", () => refillForm(form));
  const agree = form.querySelector<HTMLInputElement>('input[name="agree"]');
  agree?.addEventListener("change", () => clearErr(agree.closest("label")!));
  if (!document.getElementById("sh-cities")) {
    const d = document.createElement("datalist"); d.id = "sh-cities";
    ["Dubai", "Sharjah", "Abu Dhabi", "Riyadh", "Jeddah", "Bangkok", "Pattaya", "Phuket", "Manila", "Tallinn", "Istanbul"].forEach((c) => d.appendChild(new Option(c)));
    document.body.appendChild(d);
  }
}

// подставить в пустые поля то, что человек уже ввёл в другой форме на этой вкладке (вызывается при открытии формы)
export function refillForm(form: HTMLFormElement) {
  const st = store();
  for (const k of ["name", "city", "email"]) {
    const el = form.querySelector<HTMLInputElement>(`input[name="${k}"]`); if (el && !el.value && st[k]) el.value = st[k];
  }
  const ph = PH.get(form);
  if (ph && !ph.inp.value && st.phone) { if (st.country && !ph.sel.dataset.touched) ph.set(st.country as CountryCode); ph.inp.value = st.phone; }
}

// проверка перед отправкой: подсказка под каждым неверным полем, курсор – в первое; телефон – в E.164
export function checkForm(form: HTMLFormElement, where: string): { ok: boolean; phone: string } {
  const bad: [HTMLElement, string, string][] = [];
  const name = form.querySelector<HTMLInputElement>('input[name="name"]');
  if (name && !name.value.trim()) bad.push([name, "name", "Please add your name"]);
  const ph = PH.get(form);
  let phone = "";
  if (ph) {
    const p = parsePhoneNumberFromString(ph.inp.value, ph.country());
    if (!ph.inp.value.trim()) bad.push([ph.inp, "phone", "Please add your phone number"]);
    else if (!p || !p.isValid()) bad.push([ph.inp, "phone", `Check the number: ${names.of(ph.country())} numbers look like ${ph.inp.placeholder}`]);
    else phone = p.number;
  }
  const email = form.querySelector<HTMLInputElement>('input[name="email"]');
  if (email && email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) bad.push([email, "email", "Check the email"]);
  const agree = form.querySelector<HTMLInputElement>('input[name="agree"]');
  if (agree && !agree.checked) bad.push([agree.closest("label")!, "agree", "Please confirm the consent"]);
  bad.forEach(([el, f, msg]) => { showErr(el, msg); dl({ event: "form_field_error", form_location: where, field: f }); });
  if (bad.length) { const first = bad[0][0]; (first.querySelector?.("input") as HTMLElement || first).focus?.(); }
  return { ok: !bad.length, phone };
}
