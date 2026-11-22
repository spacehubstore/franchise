// Данные лендинга: контакты и кейсы по городам. Цифры кейсов – только подтверждённые (кейс Бангкока – финмодель
// Романенкова, документ LinkedIn 21.11.2026); Шарджа и Таллин – прорабатываются (CMO 22.11.2026).
export const CONTACTS = {
  whatsapp: { label: "+90 507 930 4218", url: "https://wa.me/905079304218" },
  line: { label: "LINE", url: "https://line.me/ti/p/HuEU2cEx-j" },
};

// Кейсы первого экрана. Цифры – доход владельца за м² в месяц (на sq ft пересчитывается на странице), фото – склады SpaceHub.
// Бангкок: шопхаус 37 м², ฿5 000 аренды → ~฿23 000 после комиссии 20 % (финмодель Романенкова, решение CMO 21.11.2026).
// Шарджа и Таллин: ставки макета v7 (Шарджа – модель Романенкова 24.09, Таллин – заглушка макета), НЕ проверены:
// до публикации заменить подтверждёнными цифрами или скрыть город (verified: false).
export type City = {
  id: string; name: string; region: string; verified: boolean; cur: string;
  before: number; after: number;            // за м² в месяц, в валюте cur
  total?: string;                           // подпись под слайдером
  photos: { before: string; after: string; caption: string };
};

export const CITIES: City[] = [
  { id: "bangkok", name: "Bangkok", region: "Southeast Asia", verified: true, cur: "฿", before: 135, after: 622,
    total: "A 37 m² shophouse in Bangkok: ฿5,000 a month leased whole, about ฿23,000 a month as self-storage after our 20% fee",
    photos: { before: "/assets/case-bkk-before.jpg", after: "/assets/case-bkk-after.jpg", caption: "SpaceHub forecast for a real property in Bangkok" } },
  { id: "sharjah", name: "Sharjah", region: "Middle East", verified: false, cur: "$", before: 12, after: 58,
    photos: { before: "/assets/case-uae-before.jpg", after: "/assets/case-uae-after.jpg", caption: "Photos: SpaceHub Al Quoz, Dubai" } },
  { id: "tallinn", name: "Tallinn", region: "Europe", verified: false, cur: "$", before: 7, after: 35,
    photos: { before: "/assets/case-tll-before.jpg", after: "/assets/case-tll-after.jpg", caption: "Photos: SpaceHub Tammsaare, Tallinn" } },
];

// Приёмник заявок: сервис в Google Cloud → amoCRM (решение CMO 22.11.2026, вариант «а»). Пока адреса нет – заявка уходит
// в WhatsApp с заполненным текстом, чтобы не потерять ни одной. Лендинг не публикуется без рабочего приёмника.
export const FORM_ENDPOINT = "";
