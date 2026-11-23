// Языки лендинга (CMO 23.11.2026): / – английский, /th/ – тайский, /ar/ – арабский (следом, справа налево).
// Ключ перевода – сама английская фраза: английская версия не меняется, на другом языке без перевода – английский текст.
// Мессенджер зависит от языка: тайская версия – LINE вместо WhatsApp во всех кнопках.
import th from "./th";
import { CONTACTS } from "../data/site";

export const LANGS = ["en", "th"] as const;
export type Lang = (typeof LANGS)[number];
export const LANG_LABEL: Record<Lang, string> = { en: "EN", th: "ไทย" };
const DICT: Record<Lang, Record<string, string>> = { en: {}, th };

// язык по адресу страницы (сервер) или по <html lang> (браузер)
export const langOf = (path: string): Lang => (path.startsWith("/th") ? "th" : "en");
export const pageLang = (): Lang => (typeof document !== "undefined" && document.documentElement.lang === "th" ? "th" : "en");

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

// мессенджер языка
export const messenger = (lang: Lang) =>
  lang === "th"
    ? { id: "line", name: "LINE", url: CONTACTS.line.url, icon: "/assets/figma/line-24.svg" }
    : { id: "whatsapp", name: "WhatsApp", url: CONTACTS.whatsapp.url, icon: "/assets/figma/whatsapp-24.svg" };
