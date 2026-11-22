// Данные лендинга: контакты и кейсы по городам. Цифры кейсов – только подтверждённые (кейс Бангкока – финмодель
// Романенкова, документ LinkedIn 21.11.2026); Шарджа и Таллин – прорабатываются (CMO 22.11.2026).
export const CONTACTS = {
  whatsapp: { label: "+90 507 930 4218", url: "https://wa.me/905079304218" },
  line: { label: "LINE", url: "https://line.me/ti/p/HuEU2cEx-j" },
};

export type City = {
  id: string; name: string; region: string; ready: boolean;
  before?: { value: string; note: string; img: string };
  after?: { value: string; note: string; img: string };
};

export const CITIES: City[] = [
  { id: "sharjah", name: "Sharjah", region: "Middle East", ready: false },
  {
    id: "bangkok", name: "Bangkok", region: "Southeast Asia", ready: true,
    before: { value: "฿5k", note: "a month", img: "/assets/case-bkk-before.jpg" },
    after: { value: "฿23k", note: "a month", img: "/assets/case-bkk-after.jpg" },
  },
  { id: "tallinn", name: "Tallinn", region: "Europe", ready: false },
];

// Приёмник заявок: сервис в Google Cloud → amoCRM (решение CMO 22.11.2026, вариант «а»). Пока адреса нет – заявка уходит
// в WhatsApp с заполненным текстом, чтобы не потерять ни одной. Лендинг не публикуется без рабочего приёмника.
export const FORM_ENDPOINT = "";
