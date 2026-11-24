// Языки лендинга (CMO 23.11.2026): / – английский, /th/ – тайский, /ar/ – арабский (следом, справа налево).
// Ключ перевода – сама английская фраза: английская версия не меняется, на другом языке без перевода – английский текст.
// Мессенджер зависит от языка: тайская версия – LINE вместо WhatsApp во всех кнопках.
import th from "./th";
import ar from "./ar";
import { CONTACTS } from "../data/site";

export const LANGS = ["en", "th", "ar"] as const;
export type Lang = (typeof LANGS)[number];
export const LANG_LABEL: Record<Lang, string> = { en: "EN", th: "TH", ar: "AR" };      // код на кнопке списка
export const LANG_NAME: Record<Lang, string> = { en: "English", th: "ไทย", ar: "العربية" };  // название в списке – на своём языке
const DICT: Record<Lang, Record<string, string>> = { en: {}, th, ar };
export const dirOf = (lang: Lang) => (lang === "ar" ? "rtl" : "ltr");   // арабский – справа налево

// язык по адресу страницы (сервер) или по <html lang> (браузер)
const isLang = (x: string): x is Lang => (LANGS as readonly string[]).includes(x);
export const langOf = (path: string): Lang => { const x = path.split("/")[1] || ""; return isLang(x) && x !== "en" ? x : "en"; };
export const pageLang = (): Lang => { const x = typeof document !== "undefined" ? document.documentElement.lang : ""; return isLang(x) ? x : "en"; };

// перевод: t("Get in touch"); шаблоны с подстановкой – t("Check the number. Example for {c}: {n}", { c, n })
export function tr(lang: Lang, s: string, v?: Record<string, string | number>) {
  let out = DICT[lang][s] ?? s;
  if (v) for (const [k, x] of Object.entries(v)) out = out.replaceAll(`{${k}}`, String(x));
  return out;
}
export const useT = (lang: Lang) => (s: string, v?: Record<string, string | number>) => tr(lang, s, v);
export const ct = (s: string, v?: Record<string, string | number>) => tr(pageLang(), s, v);

// ссылка внутри языковой версии: href(lang, "/#calc") → "/th/#calc"
export const href = (lang: Lang, p: string) => (lang === "en" ? p : `/${lang}${p}`);

// WhatsApp с готовым первым сообщением (CMO 24.11.2026, версия 1 – одно предложение, без кода источника и города)
export const waUrl = (lang: Lang) => `${CONTACTS.whatsapp.url}?text=${encodeURIComponent(tr(lang, "Hi! I'm interested in the SpaceHub franchise."))}`;

// мессенджер языка; LINE – личная ссылка, текст в неё не передаётся
export const messenger = (lang: Lang) =>
  lang === "th"
    ? { id: "line", name: "LINE", url: CONTACTS.line.url, icon: "/assets/figma/line-24.svg" }
    : { id: "whatsapp", name: "WhatsApp", url: waUrl(lang), icon: "/assets/figma/whatsapp-24.svg" };
