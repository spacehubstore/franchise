// Данные лендинга: контакты и кейсы по городам. Цифры кейсов – только подтверждённые (кейс Бангкока – финмодель
// Романенкова, документ LinkedIn 21.11.2026); Шарджа и Таллин – прорабатываются (CMO 22.11.2026).
export const CONTACTS = {
  whatsapp: { label: "+90 507 930 4218", url: "https://wa.me/905079304218" },
  line: { label: "LINE", url: "https://line.me/ti/p/HuEU2cEx-j" },
};

// Кейсы первого экрана: доход владельца за всё помещение в месяц, до и после (CMO 22.11.2026: без пересчёта на м²).
// Бангкок: шопхаус 37 м², ฿5 000 аренды → ~฿23 000 после комиссии 20 % (финмодель Романенкова, решение CMO 21.11.2026).
// В долларах (CMO 22.11.2026: все цифры в $): $858,6 выручки модели × 0,8 = $687 → «$690»; ฿5 000 / 33,6 (курс модели) = $149 → «$150».
// Шарджа (CMO 22.11.2026): модель Романенкова 24.09 – 185 м² пола (238 с уличной частью, 301 арендопригодно с антресолью),
// рынок сдал бы по $12/м² = $2,220, чистая прибыль ~$9,700/мес (со слов Романенкова, встреча 24.09) = 4,4×. Подтвердить файлом модели.
// Таллин 300 м² × $7 → $35 – заглушка макета v7, НЕ проверен: до публикации заменить или скрыть город.
export type City = {
  id: string; name: string; region: string; verified: boolean;
  before: string; after: string;            // доход за всё помещение в месяц
  space: string;                            // что за помещение
  note: string;                             // подпись: источник цифр и фото
  photos: { before: string; after: string };
};

// Порядок и состав – CMO 23.11.2026: Шарджа, Бангкок, Рига. Фото Шарджи и Риги – иллюстрации (генерация по типажу местных
// помещений: landing-icons/gen_cases.py, «после» плотное – gen_cases2.py), не фото объектов. Рига – расчёт SpaceHub по лиду (amoCRM 35552471): 176 м² × $5,5 сейчас →
// 234 м² по нашей планировке × $17,6 (ставка Таллина по сайту без акции, €16) × 90 % × 80 %; склад не открыт (F-1784).
export const CITIES: City[] = [
  { id: "sharjah", name: "Sharjah", region: "Middle East", verified: false, before: "$2,220", after: "$9,700",
    space: "185 m²", note: "SpaceHub model, after management commission. Illustration",
    photos: { before: "/assets/case-shj-before.jpg", after: "/assets/case-shj-after.jpg" } },
  { id: "bangkok", name: "Bangkok", region: "Southeast Asia", verified: true, before: "$150", after: "$690",
    space: "37 m²", note: "SpaceHub model, after management commission",
    photos: { before: "/assets/case-bkk-before.jpg", after: "/assets/case-bkk-after.jpg" } },
  { id: "riga", name: "Riga", region: "Europe", verified: false, before: "$970", after: "$2,970",
    space: "176 m²", note: "SpaceHub estimate, after management commission. Illustration",
    photos: { before: "/assets/case-rig-before.jpg", after: "/assets/case-rig-after.jpg" } },
];

// Приёмник заявок: сервис в Google Cloud → amoCRM (решение CMO 22.11.2026, вариант «а»). Пока адреса нет – заявка уходит
// в WhatsApp с заполненным текстом, чтобы не потерять ни одной. Лендинг не публикуется без рабочего приёмника.
export const FORM_ENDPOINT = "";
