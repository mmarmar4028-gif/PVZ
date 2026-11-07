/* Общие данные и компоненты: шапка, подвал, тарифы, FAQ, чат-бот, хранилище. */
'use strict';

const TARIFFS = [
  { id: 'base', name: 'Базовый', for: 'Для владельцев 1-2 точек', year: 12999, month: 1299,
    disputes: 3, lawyer: '2 вопроса в месяц', sla: 'вопросы юристу по лимиту тарифа',
    features: ['Разбор удержания и готовый ответ, до 3 случаев в месяц на точку',
      'Подача претензии под ключ за 20% от возвращённых денег',
      'Замена сотрудника по вызову: 990 ₽ плюс оплата смены',
      '2 вопроса юристу или финансисту в месяц',
      'Календарь сроков и разбор новых правил',
      'Скидка 10% на полис Ингосстраха'] },
  { id: 'opt', name: 'Оптимальный', for: 'Для сетей 2-9 точек', year: 29999, month: 2990, rec: true,
    disputes: 10, lawyer: 'без лимита', sla: 'ответ за 1 рабочий день',
    features: ['Споры с площадкой под ключ, до 10 случаев в месяц на точку',
      'Срочный поиск замены, 1 вызов в квартал на точку бесплатно',
      'Вопросы юристу и финансисту без лимита, ответ за 1 рабочий день',
      'Отчёт по каждой точке раз в месяц',
      'Шаблоны договоров с сотрудниками, контроль порога НДС',
      'Скидка 20% на полис Ингосстраха'] },
  { id: 'full', name: 'Полная защита', for: 'Для сетей от 5 точек и крупных сетей', year: 57999, month: 5790,
    disputes: Infinity, lawyer: 'без лимита', sla: 'личный куратор, ответ за 2 часа',
    features: ['Споры без лимита и досудебные претензии',
      'Замены без платы за вызов, в приоритете',
      'Личный куратор, ответ за 2 часа',
      'Отчёт по точкам и разбор с аналитиком раз в месяц',
      'Помощь с запросами налоговой, проверка точки раз в квартал',
      'Полис Ингосстраха на точку уже включён'] }
];
const tariffById = id => TARIFFS.find(t => t.id === id) || TARIFFS[1];

const FAQ = [
  { cat: 'Тарифы', q: 'Цена зависит от числа посылок?', a: 'Нет. Цена считается за одну точку в год и не меняется от того, сколько посылок проходит через пункт.' },
  { cat: 'Тарифы', q: 'Что выгоднее: платить за год или помесячно?', a: 'За год выгоднее примерно на 16-17%, это почти два месяца в подарок. Например, «Оптимальный» стоит 29 999 ₽ в год или 2 990 ₽ в месяц (35 880 ₽ за 12 месяцев).' },
  { cat: 'Тарифы', q: 'Можно сменить тариф?', a: 'Да. Напишите куратору в личном кабинете, он подскажет условия перехода.' },
  { cat: 'Тарифы', q: 'Цены с НДС?', a: 'Да, все цены указаны за одну точку с НДС.' },
  { cat: 'Споры', q: 'С какими площадками вы работаете?', a: 'Готовим споры по удержаниям Ozon, Яндекс Маркета и Wildberries. Если у вас другая площадка, напишите, разберём условия её оферты.' },
  { cat: 'Споры', q: 'Сколько стоит подать претензию?', a: 'На «Базовом» подача претензии под ключ стоит 20% от возвращённых денег. На «Оптимальном» до 10 споров в месяц на точку входят в тариф, на «Полной защите» споры без лимита.' },
  { cat: 'Споры', q: 'Что нужно для спора?', a: 'Скриншот удержания из личного кабинета площадки и доказательства: видео с камер, фото посылок, акты приёмки, переписка с поддержкой. Чек-лист есть в кабинете в разделе «Споры».' },
  { cat: 'Споры', q: 'Вы гарантируете возврат денег?', a: 'Нет. Решение принимает площадка. Мы готовим претензию и собираем доказательства так, чтобы шанс на возврат был выше.' },
  { cat: 'Замены', q: 'Как быстро найдёте замену сотруднику?', a: 'Заявку на замену принимаем в кабинете или через куратора. Срок поиска зависит от города и времени смены, в пилоте его замеряем отдельно.' },
  { cat: 'Замены', q: 'Сколько стоит замена?', a: 'На «Базовом» 990 ₽ за вызов плюс оплата смены. На «Оптимальном» 1 вызов в квартал на точку бесплатно. На «Полной защите» замены без платы за вызов и в приоритете.' },
  { cat: 'Подключение', q: 'Как подключиться?', a: 'Оставьте заявку на сайте: выберите тариф и число точек. Куратор свяжется, проверит данные и откроет доступ в личный кабинет.' },
  { cat: 'Подключение', q: 'Есть пробный период?', a: 'В пилоте тариф «Оптимальный» стоит полцены на 2 месяца.' },
  { cat: 'Подключение', q: 'При чём здесь Ингосстрах?', a: 'Тарифы дают скидку на полис Ингосстраха для точки: 10% на «Базовом», 20% на «Оптимальном», на «Полной защите» полис уже включён.' }
];

const ICONS = {
  scale: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M5 21h14M6 7h12M6 7l-3 7a3 3 0 006 0L6 7zm12 0l-3 7a3 3 0 006 0l-3-7z"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/><path d="M17 4l2 2 3-3"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/></svg>'
};

/* --- утилиты --- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const rub = n => Math.round(n).toLocaleString('ru-RU') + ' ₽';
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const plural = (n, a, b, c) => { const m = n % 10, h = n % 100; return m === 1 && h !== 11 ? a : (m >= 2 && m <= 4 && (h < 10 || h >= 20) ? b : c); };
const pointsWord = n => n + ' ' + plural(n, 'точку', 'точки', 'точек');
const store = {
  get(k, d) { try { const v = localStorage.getItem('pvz_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('pvz_' + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem('pvz_' + k); } catch (e) {} }
};
function toast(text) {
  const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = text;
  document.body.appendChild(t); setTimeout(() => t.remove(), 2600);
}
async function copyText(text, fallbackEl) {
  try { await navigator.clipboard.writeText(text); toast('Текст скопирован'); }
  catch (e) {
    if (fallbackEl) { const r = document.createRange(); r.selectNodeContents(fallbackEl); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    toast('Текст выделен, скопируйте его вручную');
  }
}

/* Подбор тарифа: число точек, споров в месяц на точку, нужен ли быстрый ответ */
function recommend(points, disputes, fast) {
  if (points >= 10 || disputes > 10 || fast) return 'full';
  if (points >= 2 || disputes > 3) return 'opt';
  return 'base';
}

/* --- шапка и подвал --- */
function renderChrome() {
  const page = document.body.dataset.page;
  const links = [['index.html#tarify', 'Тарифы', 'tarify'], ['index.html#podbor', 'Подбор', 'podbor'], ['index.html#faq', 'Вопросы', 'faq'], ['tools.html', 'Инструменты', 'tools']];
  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `<div class="container">
    <a class="logo" href="index.html"><span class="logo-mark" aria-hidden="true"></span>Защита ПВЗ</a>
    <nav class="nav" aria-label="Основное меню">${links.map(([h, t, k]) => `<a href="${h}"${page === k ? ' aria-current="page"' : ''}>${t}</a>`).join('')}</nav>
    <div class="header-cta"><a class="btn btn-ghost btn-sm" href="account.html">Личный кабинет</a><a class="btn btn-sm" href="apply.html">Оставить заявку</a></div>
    <button class="burger" type="button" aria-label="Открыть меню" aria-expanded="false"><span></span><span></span><span></span></button>
  </div>`;
  document.body.prepend(header);
  const burger = $('.burger', header);
  burger.addEventListener('click', () => { const o = header.classList.toggle('open'); burger.setAttribute('aria-expanded', o); });
  $$('.nav a', header).forEach(a => a.addEventListener('click', () => { header.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }));

  if (document.body.dataset.footer !== 'off') {
    const f = document.createElement('footer');
    f.className = 'site-footer';
    f.innerHTML = `<div class="container">
      <div><a class="logo" href="index.html" style="padding:0;margin-bottom:10px"><span class="logo-mark" aria-hidden="true"></span>Защита ПВЗ</a>
      <p>Споры с площадками, замены сотрудников, юрист и финансист для владельцев пунктов выдачи заказов.</p>
      <p style="margin-top:10px">Учебный проект команды №4 для Ингосстраха. Сайт работает в демо-режиме: заявки и данные кабинета хранятся только в вашем браузере и никуда не отправляются. Не является публичной офертой.</p></div>
      <div><b style="color:var(--ink)">Сервис</b><a href="index.html#tarify">Тарифы</a><a href="index.html#podbor">Подбор тарифа</a><a href="apply.html">Заявка</a><a href="account.html">Личный кабинет</a></div>
      <div><b style="color:var(--ink)">Полезное</b><a href="tools.html#claim">Претензия по удержанию</a><a href="tools.html#profit">Прибыль точки</a><a href="tools.html#nds">Порог НДС</a><a href="index.html#faq">Вопросы и ответы</a></div>
    </div>`;
    document.body.appendChild(f);
  }
}

/* --- чат-бот: отвечает по базе вопросов, без сервера --- */
const BOT_RULES = [
  { k: ['привет', 'здравств', 'добрый'], a: () => 'Здравствуйте! Спросите про тарифы, споры с площадкой, замену сотрудника или подключение.' },
  { k: ['подобр', 'какой тариф', 'выбрать', 'посовет', 'подходит'], a: () => { BOT.state = 'points'; return 'Сколько у вас пунктов выдачи? Напишите число.'; } },
  { k: ['цен', 'стоим', 'сколько стоит', 'прайс', 'тариф'], a: () => 'Цены за одну точку в год, с НДС:\n• Базовый: 12 999 ₽ (или 1 299 ₽ в месяц)\n• Оптимальный: 29 999 ₽ (или 2 990 ₽ в месяц)\n• Полная защита: 57 999 ₽ (или 5 790 ₽ в месяц)\nНапишите «подобрать», и я помогу выбрать.' },
  { k: ['помесяч', 'за год', 'оплат', 'рассроч'], a: () => 'Можно платить за год или помесячно. За год выгоднее примерно на 16-17%.' },
  { k: ['спор', 'штраф', 'удерж', 'претенз', 'оспор', 'вернуть'], a: () => 'Готовим споры по удержаниям Ozon, Яндекс Маркета и Wildberries. Понадобятся скриншот удержания и доказательства: видео с камер, фото, акты. Черновик претензии можно собрать бесплатно в разделе <a href="tools.html#claim">Инструменты</a>.' },
  { k: ['замен', 'сотрудник', 'не вышел', 'смен', 'оператор'], a: () => 'Замену можно вызвать из личного кабинета, раздел «Срочная помощь». На «Базовом» вызов стоит 990 ₽ плюс оплата смены, на «Оптимальном» 1 вызов в квартал на точку бесплатно, на «Полной защите» без платы за вызов.' },
  { k: ['юрист', 'юрид', 'финанс', 'бухгалт', 'консульт'], a: () => 'Вопросы юристу и финансисту: на «Базовом» 2 в месяц, на «Оптимальном» и «Полной защите» без лимита. На «Полной защите» отвечает личный куратор в течение 2 часов.' },
  { k: ['ндс', 'налог', 'усн'], a: () => 'С 2026 года на УСН НДС платят при доходе выше 20 млн ₽ в год (закон № 425-ФЗ от 28.11.2025). Проверить свой доход можно в <a href="tools.html#nds">калькуляторе порога НДС</a>.' },
  { k: ['пилот', 'пробн', 'бесплат', 'попроб', 'тест'], a: () => 'В пилоте тариф «Оптимальный» стоит полцены на 2 месяца.' },
  { k: ['полис', 'ингосстрах', 'страхов'], a: () => 'Тарифы дают скидку на полис Ингосстраха для точки: 10% на «Базовом», 20% на «Оптимальном», на «Полной защите» полис уже включён.' },
  { k: ['кабинет', 'войти', 'логин', 'аккаунт'], a: () => 'Личный кабинет открывается после подключения. Посмотреть, как он устроен, можно в <a href="account.html">демо-кабинете</a>.' },
  { k: ['заявк', 'подключ', 'купить', 'оформ', 'начать'], a: () => 'Оставьте заявку на странице <a href="apply.html">«Заявка»</a>: выберите тариф и число точек, куратор свяжется с вами.' },
  { k: ['человек', 'оператор живой', 'менеджер', 'куратор', 'связат', 'позвон', 'телефон'], a: () => 'Сейчас отвечаю я, бот. Чтобы с вами связался куратор, оставьте <a href="apply.html">заявку</a> и укажите удобный способ связи.' },
  { k: ['гарант'], a: () => 'Возврат денег не гарантируем: решение принимает площадка. Мы готовим претензию и доказательства так, чтобы шанс был выше.' }
];
const BOT = { state: null, open: false };
function botAnswer(text) {
  const t = text.toLowerCase().trim();
  if (BOT.state === 'points') {
    const n = parseInt(t, 10);
    if (n > 0) { BOT.points = n; BOT.state = 'disputes'; return 'Сколько удержаний в месяц бывает на одной точке? Напишите число, можно примерно.'; }
    return 'Напишите число точек цифрами, например 3.';
  }
  if (BOT.state === 'disputes') {
    const n = parseInt(t, 10);
    if (!isNaN(n) && n >= 0) {
      BOT.state = null;
      const tr = tariffById(recommend(BOT.points, n, false));
      return `Советую тариф «${tr.name}». За ${pointsWord(BOT.points)} это ${rub(tr.year * BOT.points)} в год.\n<a href="apply.html?plan=${tr.id}&points=${BOT.points}">Оформить заявку</a>`;
    }
    return 'Напишите число удержаний цифрами, например 2.';
  }
  for (const r of BOT_RULES) if (r.k.some(k => t.includes(k))) return r.a();
  const hit = FAQ.find(f => f.q.toLowerCase().split(/\s+/).filter(w => w.length > 4).some(w => t.includes(w.slice(0, 5))));
  if (hit) return hit.a;
  return 'Пока не знаю ответа на этот вопрос. Попробуйте спросить иначе или выберите тему ниже. Можно также оставить <a href="apply.html">заявку</a>, и куратор ответит лично.';
}
function mountBot(opts = {}) {
  const fab = document.createElement('button');
  fab.className = 'bot-fab'; fab.type = 'button';
  fab.innerHTML = '<span class="dot" aria-hidden="true"></span>Задать вопрос';
  const box = document.createElement('div');
  box.className = 'bot'; box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Чат-бот');
  box.innerHTML = `<div class="bot-head"><div><b>Помощник Защиты ПВЗ</b><span>Бот отвечает сразу</span></div><button class="bot-close" type="button" aria-label="Закрыть чат">×</button></div>
    <div class="bot-log" aria-live="polite"></div>
    <div class="quick">${['Подобрать тариф', 'Сколько стоит?', 'Как оспорить штраф?', 'Замена сотрудника', 'Есть пробный период?'].map(q => `<button type="button">${q}</button>`).join('')}</div>
    <form class="bot-form"><input class="input" id="botInput" placeholder="Напишите вопрос" autocomplete="off" aria-label="Ваш вопрос"><button class="btn" type="submit">Отправить</button></form>`;
  document.body.append(fab, box);
  const log = $('.bot-log', box);
  const add = (html, who) => { const m = document.createElement('div'); m.className = 'msg ' + who; if (who === 'u') m.textContent = html; else m.innerHTML = html; log.appendChild(m); log.scrollTop = log.scrollHeight; };
  const ask = q => { add(q, 'u'); setTimeout(() => add(botAnswer(q), 'b'), 250); };
  add('Здравствуйте! Я помогу выбрать тариф и отвечу на частые вопросы.', 'b');
  const open = v => { box.hidden = !v; fab.hidden = v; if (v) $('#botInput').focus(); };
  fab.onclick = () => open(true);
  $('.bot-close', box).onclick = () => open(false);
  $$('.quick button', box).forEach(b => b.onclick = () => ask(b.textContent));
  $('.bot-form', box).addEventListener('submit', e => { e.preventDefault(); const i = $('#botInput'); const v = i.value.trim(); if (!v) return; i.value = ''; ask(v); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !box.hidden) open(false); });
  window.openBot = q => { open(true); if (q) ask(q); };
}

function renderFaq(container, filterEl, items = FAQ) {
  const cats = ['Все', ...new Set(items.map(f => f.cat))];
  let cur = 'Все';
  const draw = () => {
    container.innerHTML = items.filter(f => cur === 'Все' || f.cat === cur)
      .map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('');
  };
  if (filterEl) {
    filterEl.innerHTML = cats.map(c => `<button class="chip" type="button" aria-pressed="${c === cur}">${c}</button>`).join('');
    $$('.chip', filterEl).forEach(b => b.onclick = () => { cur = b.textContent; $$('.chip', filterEl).forEach(x => x.setAttribute('aria-pressed', x === b)); draw(); });
  }
  draw();
}

document.addEventListener('DOMContentLoaded', () => {
  renderChrome();
  $$('[data-i]').forEach(el => { el.innerHTML = ICONS[el.dataset.i] || ''; });
  if (document.body.dataset.bot !== 'off') mountBot();
});
