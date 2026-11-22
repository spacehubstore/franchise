// Слабое соединение (CMO 23.11.2026): браузер сообщает об экономии трафика или 2G/3G – ролики не грузим, оставляем
// заставки и конечные кадры, фото других кейсов заранее не подгружаем. Где API нет (Safari), считаем соединение нормальным.
const c = (navigator as any).connection;
export const slowNet: boolean = !!c && (c.saveData === true || /(^|-)(2g|3g)$/.test(c.effectiveType || ""));
