/* Личный кабинет (демо). Все данные в localStorage, ключ pvz_acc. */
'use strict';

const SECTIONS = [
  ['obzor', 'Обзор'], ['spory', 'Споры'], ['srochno', 'Срочная помощь', 'urgent'], ['finansy', 'Финансы'],
  ['pravo', 'Юридическое'], ['shablony', 'Шаблоны'], ['voprosy', 'Вопросы и ответы'], ['chat', 'Чат с куратором'], ['-'], ['profil', 'Профиль']
];
const STATUS = { new: ['Готовим претензию', 's-new'], work: ['На рассмотрении', 's-work'], done: ['Возвращено', 's-done'], rej: ['Отказ площадки', 's-rej'],
  search: ['Ищем замену', 's-work'], found: ['Замена найдена', 's-done'], wait: ['Ждёт ответа', 's-new'], answered: ['Есть ответ', 's-done'] };
const st = s => `<span class="status ${STATUS[s][1]}">${STATUS[s][0]}</span>`;
const dShort = d => new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
const daysAgo = n => new Date(Date.now() - n * 864e5).toISOString();

function seed() {
  const o = store.get('order', null);
  const plan = o ? o.plan : 'opt', points = o ? o.points : 3;
  const addr = ['Москва, ул. Профсоюзная, 12', 'Москва, ул. Новаторов, 4', 'Москва, Ленинский пр-т, 90', 'Москва, ул. Вавилова, 21', 'Москва, ул. Губкина, 3'];
  const addresses = Array.from({ length: Math.min(points, 5) }, (_, i) => addr[i]);
  return {
    plan, points, period: o ? o.period : 'year', since: o ? o.created : daysAgo(40),
    name: o ? o.name : 'Анна', email: o ? o.email : 'anna@example.ru', phone: o ? o.phone : '', fromOrder: !!o, orderNo: o ? o.no : null,
    addresses,
    cases: [
      { id: 1, ex: true, platform: 'Ozon', reason: 'loss', sum: 6200, date: daysAgo(18), addr: addresses[0], status: 'done', returned: 6200, what: 'Посылка пришла с повреждённой упаковкой, есть фото при приёмке.' },
      { id: 2, ex: true, platform: 'Яндекс Маркет', reason: 'idle', sum: 3000, date: daysAgo(7), addr: addresses[addresses.length > 1 ? 1 : 0], status: 'work', what: 'Пункт работал по графику, есть видео за весь день.' },
      { id: 3, ex: true, platform: 'Wildberries', reason: 'claim', sum: 1850, date: daysAgo(2), addr: addresses[0], status: 'new', what: 'Клиент заявил, что не получил заказ. По видео заказ выдан.' }
    ],
    repl: [{ id: 1, ex: true, addr: addresses[0], date: daysAgo(25), from: '09:00', to: '21:00', status: 'found', note: 'Оператор заболел' }],
    qs: [{ id: 1, ex: true, topic: 'Финансы', text: 'Доход по трём точкам около 17 млн в год. Когда начинать готовиться к НДС?', date: daysAgo(10), status: 'answered',
      answer: 'В 2026 году порог для УСН 20 млн ₽, в 2027 году 15 млн ₽. При вашем доходе в 2027 году вы, скорее всего, превысите порог. Предлагаем созвониться с бухгалтером и заранее посчитать нагрузку.' }],
    chat: [{ who: 'b', text: 'Здравствуйте! Я помогу с вопросами по тарифу, спорам и заменам. В демо-версии отвечает бот.' }]
  };
}
let A = store.get('acc', null);
let SESSION = false;
const hasSession = () => SESSION || store.get('session', false);
const save = () => store.set('acc', A);
const T = () => tariffById(A.plan);
const monthCases = () => A.cases.filter(c => new Date(c.date).getMonth() === new Date().getMonth() && new Date(c.date).getFullYear() === new Date().getFullYear()).length;
const qCount = () => A.qs.filter(q => Date.now() - new Date(q.date) < 30 * 864e5).length;
const quarterRepl = () => { const now = new Date(), q = Math.floor(now.getMonth() / 3); return A.repl.filter(r => { const d = new Date(r.date); return d.getFullYear() === now.getFullYear() && Math.floor(d.getMonth() / 3) === q; }).length; };
const limits = () => {
  const t = T();
  return {
    cases: t.disputes === Infinity ? Infinity : t.disputes * A.points,
    qs: t.id === 'base' ? 2 * A.points : Infinity,
    replFree: t.id === 'base' ? 0 : t.id === 'opt' ? A.points : Infinity
  };
};
const lim = n => n === Infinity ? 'без лимита' : n;

/* ---------- модальное окно ---------- */
function modal(title, html, onMount) {
  $('#modalTitle').textContent = title; $('#modalBody').innerHTML = html; $('#modal').hidden = false;
  const first = $('#modalBody input, #modalBody select, #modalBody textarea, #modalBody button'); if (first) first.focus();
  if (onMount) onMount();
}
const closeModal = () => { $('#modal').hidden = true; };

/* ---------- разделы ---------- */
const V = {};

V.obzor = () => {
  const t = T(), L = limits(), mc = monthCases(), returned = A.cases.reduce((s, c) => s + (c.returned || 0), 0);
  const renew = new Date(new Date(A.since).getTime() + 365 * 864e5).toLocaleDateString('ru-RU');
  const meter = (v, m) => m === Infinity ? '' : `<div class="meter"><i style="width:${Math.min(100, v / m * 100)}%"></i></div>`;
  const recent = [...A.cases.map(c => ({ d: c.date, t: `Спор: ${c.platform}, ${rub(c.sum)}`, s: c.status })), ...A.repl.map(r => ({ d: r.date, t: `Замена: ${r.addr}`, s: r.status })), ...A.qs.map(q => ({ d: q.date, t: `Вопрос: ${q.topic}`, s: q.status }))]
    .sort((a, b) => new Date(b.d) - new Date(a.d)).slice(0, 5);
  return `<div class="panel-head"><div><h2>Здравствуйте${A.name ? ', ' + esc(A.name) : ''}</h2><p>Тариф «${t.name}» на ${pointsWord(A.points)}. Действует до ${renew}.</p></div><a class="btn btn-ghost btn-sm" href="#profil">Сменить тариф</a></div>
  ${A.fromOrder ? `<p class="notice" style="margin-bottom:20px">Кабинет создан по заявке № ${esc(A.orderNo)}. Записи с пометкой «пример» показаны для наглядности.</p>` : '<p class="notice" style="margin-bottom:20px">Это демо-кабинет. Записи с пометкой «пример» показывают, как будут выглядеть ваши данные.</p>'}
  <div class="kpis">
    <div class="kpi"><div class="label">Споров в этом месяце</div><div class="val">${mc} <span class="muted" style="font-size:15px;font-weight:500">${L.cases === Infinity ? 'без лимита' : 'из ' + L.cases}</span></div>${meter(mc, L.cases)}</div>
    <div class="kpi"><div class="label">Возвращено денег</div><div class="val">${rub(returned)}</div></div>
    <div class="kpi"><div class="label">Бесплатных замен в квартале</div><div class="val">${L.replFree === Infinity ? 'без лимита' : Math.max(0, L.replFree - quarterRepl()) + ' <span class="muted" style="font-size:15px;font-weight:500">из ' + L.replFree + '</span>'}</div></div>
    <div class="kpi"><div class="label">Вопросов юристу за 30 дней</div><div class="val">${qCount()} <span class="muted" style="font-size:15px;font-weight:500">${L.qs === Infinity ? 'без лимита' : 'из ' + L.qs}</span></div>${meter(qCount(), L.qs)}</div>
  </div>
  <div class="grid g4" style="margin-bottom:28px">
    <button class="tile" type="button" data-act="newCase"><b>Новый спор</b><span>Пришло удержание от площадки</span></button>
    <a class="tile danger" href="#srochno"><b>Сотрудник не вышел</b><span>Вызвать замену на смену</span></a>
    <button class="tile" type="button" data-act="newQ"><b>Вопрос юристу</b><span>Договоры, налоги, оферты</span></button>
    <a class="tile" href="#shablony"><b>Шаблоны</b><span>Претензии, акты, чек-листы</span></a>
  </div>
  <h3 style="margin-bottom:12px">Последние события</h3>
  <div class="table-wrap"><table><thead><tr><th>Дата</th><th>Событие</th><th>Статус</th></tr></thead><tbody>
  ${recent.map(r => `<tr><td class="num">${dShort(r.d)}</td><td>${esc(r.t)}</td><td>${st(r.s)}</td></tr>`).join('') || '<tr><td colspan="3" class="muted">Пока событий нет</td></tr>'}
  </tbody></table></div>`;
};

V.spory = () => {
  const L = limits();
  return `<div class="panel-head"><div><h2>Споры с площадками</h2><p>В этом месяце ${monthCases()} ${L.cases === Infinity ? '(без лимита)' : 'из ' + L.cases} по тарифу «${T().name}».${T().id === 'base' ? ' Подача претензии под ключ стоит 20% от возвращённых денег.' : ''}</p></div><button class="btn" type="button" data-act="newCase">Новый спор</button></div>
  ${A.cases.length ? `<div class="table-wrap"><table><thead><tr><th>Дата</th><th>Площадка</th><th>Причина</th><th>Сумма</th><th>Статус</th><th></th></tr></thead><tbody>
  ${[...A.cases].sort((a, b) => new Date(b.date) - new Date(a.date)).map(c => `<tr><td class="num">${dShort(c.date)}</td><td>${esc(c.platform)}${c.ex ? '<span class="tag-ex">пример</span>' : ''}</td><td>${REASONS[c.reason].t}</td><td class="num">${rub(c.sum)}</td><td>${st(c.status)}</td><td><button class="btn btn-ghost btn-sm" type="button" data-case="${c.id}">Открыть</button></td></tr>`).join('')}
  </tbody></table></div>` : '<div class="empty">Споров пока нет. Нажмите «Новый спор», когда придёт удержание.</div>'}
  <div class="card" style="margin-top:24px"><h3>Что подготовить к спору</h3><ul class="checklist" style="margin-top:12px"><li>Скриншот удержания из кабинета площадки</li><li>Видео с камер за нужный день и время</li><li>Фото посылки и акт приёмки, если речь о повреждении</li><li>Номер обращения в поддержку площадки</li></ul></div>`;
};

V.srochno = () => {
  const t = T(), L = limits(), left = L.replFree === Infinity ? Infinity : Math.max(0, L.replFree - quarterRepl());
  const price = t.id === 'full' ? 'Вызов бесплатный, заявка в приоритете.' : t.id === 'opt' ? (left > 0 ? `Бесплатно: осталось ${left} из ${L.replFree} вызовов в этом квартале.` : 'Бесплатные вызовы в этом квартале закончились, стоимость подскажет куратор.') : 'Вызов стоит 990 ₽ плюс оплата смены.';
  return `<div class="panel-head"><div><h2>Срочная помощь</h2><p>Сотрудник не вышел на смену или точка простаивает. Заполните заявку, мы начнём искать замену.</p></div></div>
  <div class="grid g2">
    <form class="card" id="replForm" novalidate>
      <h3>Вызвать замену сотрудника</h3>
      <p class="notice" style="margin:12px 0 18px">${price}</p>
      <div class="field"><label for="rAddr">Точка</label><select class="input" id="rAddr">${A.addresses.map(a => `<option>${esc(a)}</option>`).join('')}</select></div>
      <div class="row2"><div class="field"><label for="rDate">Дата смены</label><input class="input" id="rDate" type="date"></div>
      <div class="field"><span class="label">Время</span><div style="display:flex;gap:8px"><input class="input" id="rFrom" type="time" value="09:00" aria-label="Начало смены"><input class="input" id="rTo" type="time" value="21:00" aria-label="Конец смены"></div></div></div>
      <div class="field"><label for="rNote">Комментарий</label><textarea class="input" id="rNote" rows="2" placeholder="Например: нужен оператор с опытом Ozon"></textarea></div>
      <button class="btn btn-block" type="submit" style="background:var(--bad);border-color:var(--bad)">Вызвать замену</button>
    </form>
    <div class="stack">
      <div class="card"><h3>Другие срочные ситуации</h3>
        <div style="display:grid;gap:10px;margin-top:14px">
          <button class="tile" type="button" data-urgent="Площадка заблокировала точку или приостановила выдачу. Что делать?"><b>Точку заблокировали</b><span>Площадка приостановила работу пункта</span></button>
          <button class="tile" type="button" data-urgent="Пришла проверка или запрос из налоговой. Что делать?"><b>Пришла проверка</b><span>Запрос налоговой или другого ведомства</span></button>
          <button class="tile" type="button" data-urgent="Крупное удержание, нужно срочно разобраться"><b>Крупное удержание</b><span>Сумма, которую нельзя ждать</span></button>
        </div></div>
    </div>
  </div>
  <h3 style="margin:28px 0 12px">Мои заявки на замену</h3>
  ${A.repl.length ? `<div class="table-wrap"><table><thead><tr><th>Дата</th><th>Точка</th><th>Смена</th><th>Статус</th></tr></thead><tbody>${[...A.repl].sort((a, b) => new Date(b.date) - new Date(a.date)).map(r => `<tr><td class="num">${dShort(r.date)}</td><td>${esc(r.addr)}${r.ex ? '<span class="tag-ex">пример</span>' : ''}</td><td class="num">${r.from}-${r.to}</td><td>${st(r.status)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Заявок пока не было</div>'}`;
};

const FIN_ADVICE = [
  ['Считайте прибыль каждой точки отдельно', ['В интервью двое из трёх владельцев не знали, сколько приносит каждая точка. Общая сумма скрывает убыточные пункты.', 'Раз в месяц сводите по каждой точке вознаграждение, аренду, зарплаты, штрафы и прочие расходы. Калькулятор ниже помогает это сделать.']],
  ['Следите за порогом НДС', ['На УСН с 2026 года НДС платят при доходе выше 20 млн ₽ в год, в 2027 году порог 15 млн ₽, с 2028 года 10 млн ₽ (закон № 425-ФЗ от 28.11.2025).', 'Если доход приближается к порогу, обсудите с бухгалтером нагрузку заранее, до конца года.']],
  ['Ведите журнал удержаний', ['Записывайте каждое удержание: дату, площадку, сумму, причину и результат спора. Так видно, какие штрафы повторяются и где теряются деньги.', 'Шаблон журнала есть в разделе «Шаблоны».']],
  ['Проверяйте новые условия площадок', ['Площадки меняют условия для партнёров. По данным исследования команды, Ozon с 1 декабря 2026 года берёт до 1% вознаграждения владельца.', 'Заложите такие изменения в расчёт прибыли и сверяйтесь с договором.']],
  ['Разделяйте личные и деловые деньги', ['Отдельный расчётный счёт для бизнеса упрощает учёт, расчёт налогов и разговор с бухгалтером.']]
];
const LAW_ADVICE = [
  ['Храните видео с камер', ['Исход спора часто решают доказательства, прежде всего видео. Храните записи не меньше срока, в который по оферте можно оспорить удержание.', 'Проверьте, что камеры видят зону выдачи и приёмки, а время на записи совпадает с реальным.']],
  ['Фиксируйте приёмку', ['Повреждённую посылку фотографируйте при приёмке и оформляйте акт. Шаблон акта есть в разделе «Шаблоны».']],
  ['Читайте оферту площадки', ['В оферте описаны основания штрафов, порядок и сроки обжалования. Ссылайтесь на конкретный пункт в претензии.']],
  ['Общайтесь с поддержкой письменно', ['Сохраняйте номера обращений и скриншоты переписки. Устные договорённости в споре не помогут.']],
  ['Оформляйте сотрудников по договору', ['Подходит трудовой договор или договор ГПХ, у каждого свои налоги и обязанности. Условия материальной ответственности согласуйте с юристом: их нельзя прописать произвольно.', 'Шаблон договора юрист готовит под ваш формат найма, запросите его через форму ниже.']]
];
const adviceHtml = list => `<div class="advice">${list.map(([h, ps]) => `<details><summary>${esc(h)}</summary><div>${ps.map(p => `<p>${esc(p)}</p>`).join('')}</div></details>`).join('')}</div>`;

V.finansy = () => `<div class="panel-head"><div><h2>Финансы</h2><p>Советы, калькуляторы и вопросы финансисту.</p></div><button class="btn" type="button" data-act="newQ" data-topic="Финансы">Вопрос финансисту</button></div>
  <h3 style="margin-bottom:12px">Советы</h3>${adviceHtml(FIN_ADVICE)}
  <h3 style="margin:32px 0 12px">Прибыль точки</h3><div id="accProfit"></div>
  <h3 style="margin:32px 0 12px">Порог НДС</h3><div id="accNds"></div>`;

V.pravo = () => `<div class="panel-head"><div><h2>Юридическое</h2><p>Советы и вопросы юристу. ${T().id === 'base' ? `По тарифу «Базовый» доступно ${2 * A.points} вопроса в месяц.` : `По тарифу «${T().name}» вопросы без лимита, ${T().sla}.`}</p></div><button class="btn" type="button" data-act="newQ" data-topic="Юридическое">Вопрос юристу</button></div>
  <h3 style="margin-bottom:12px">Советы</h3>${adviceHtml(LAW_ADVICE)}
  <h3 style="margin:32px 0 12px">Мои вопросы</h3>
  ${A.qs.length ? `<div class="stack">${[...A.qs].sort((a, b) => new Date(b.date) - new Date(a.date)).map(q => `<div class="card"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:8px"><b>${esc(q.topic)}${q.ex ? '<span class="tag-ex">пример</span>' : ''}</b>${st(q.status)}</div><p style="color:var(--ink)">${esc(q.text)}</p>${q.answer ? `<p style="margin-top:10px;padding-top:10px;border-top:1px solid var(--line)"><b style="color:var(--ink)">Ответ:</b> ${esc(q.answer)}</p>` : '<p class="hint" style="margin-top:8px">В демо-версии ответ не приходит. В рабочей версии здесь появится ответ юриста.</p>'}</div>`).join('')}</div>` : '<div class="empty">Вопросов пока нет</div>'}
  <p class="hint" style="margin-top:20px">Советы на этой странице общие и не заменяют консультацию юриста по вашей ситуации.</p>`;

const TEMPLATES = [
  { k: 'claim', t: 'Претензия по удержанию', d: 'Для спора с площадкой', text: () => claimText({ platform: 'Ozon', reason: 'loss', sum: 0, date: '', what: '', owner: A.name ? `[ИП ${A.name}, ИНН]` : '', address: A.addresses[0] }) },
  { k: 'req', t: 'Запрос основания удержания', d: 'Если непонятно, за что списали деньги', text: () => `Кому: [площадка], служба поддержки партнёров пунктов выдачи
От кого: [ИП или организация, ИНН]
Пункт выдачи: [адрес]

[Дата] с моего вознаграждения удержано [сумма] ₽. В личном кабинете основание удержания не указано или указано без расчёта.

Прошу сообщить:
1. Пункт оферты, на основании которого сделано удержание.
2. Расчёт суммы.
3. Документы и данные, на которых основано решение (номера заказов, время, записи).

[Дата, подпись]` },
  { k: 'act', t: 'Акт о повреждении посылки при приёмке', d: 'Заполняется в момент приёмки', text: () => `АКТ о повреждении отправления при приёмке

Дата и время: [дд.мм.гггг, чч:мм]
Пункт выдачи: ${A.addresses[0] || '[адрес]'}
Площадка: [Ozon / Яндекс Маркет / Wildberries]
Номер отправления: [номер]

Описание повреждения: [что повреждено: упаковка, вскрытие, следы влаги, вмятины]
Фото: [количество] шт., сделаны в момент приёмки.
Видео приёмки: камера [номер или зона], время записи [чч:мм-чч:мм].

Отправление принято с повреждением / не принято (нужное подчеркнуть).

Принял: [ФИО сотрудника], подпись ________
Передал: [ФИО курьера или водителя], подпись ________` },
  { k: 'log', t: 'Журнал удержаний', d: 'Таблица для учёта штрафов', text: () => `Журнал удержаний. Скопируйте в таблицу: столбцы разделены табуляцией.

Дата\tПлощадка\tТочка\tСумма, ₽\tПричина\tДоказательства\tДата претензии\tРезультат\tВозвращено, ₽
[дд.мм]\t[Ozon]\t[адрес]\t[сумма]\t[причина]\t[видео, фото, акт]\t[дд.мм]\t[возврат / отказ / ждём]\t[сумма]` },
  { k: 'shift', t: 'Чек-лист открытия смены', d: 'Для оператора пункта', text: () => `Чек-лист открытия смены

[ ] Пункт открыт вовремя, время открытия отмечено
[ ] Камеры работают, время на записи совпадает с реальным
[ ] Зона выдачи и примерочная чистые, вывеска с режимом работы на месте
[ ] Терминал и сканер работают, связь есть
[ ] Посылки с прошлой смены разложены по ячейкам
[ ] Повреждённые отправления отложены, на них оформлены акты
[ ] Проверены сообщения от площадки в личном кабинете

Сотрудник: [ФИО]   Дата: [дд.мм.гггг]` }
];
V.shablony = () => `<div class="panel-head"><div><h2>Шаблоны</h2><p>Скопируйте шаблон, заполните поля в квадратных скобках и отправьте. Шаблоны общие, сложные случаи обсудите с юристом.</p></div></div>
  <div class="tpl-list">${TEMPLATES.map(t => `<div class="tpl"><div><b>${t.t}</b><span>${t.d}</span></div><button class="btn btn-ghost btn-sm" type="button" data-tpl="${t.k}">Открыть</button></div>`).join('')}</div>
  ${T().id !== 'base' ? '<p class="notice" style="margin-top:20px">Шаблон договора с сотрудником входит в ваш тариф. Юрист готовит его под формат найма (трудовой договор или ГПХ), запросите в разделе «Юридическое».</p>' : ''}`;

const ACC_FAQ = [
  { cat: 'Кабинет', q: 'Как создать спор?', a: 'В разделе «Споры» нажмите «Новый спор», укажите площадку, сумму и что произошло. Мы подготовим претензию и сообщим статус.' },
  { cat: 'Кабинет', q: 'Что значат статусы споров?', a: '«Готовим претензию»: собираем доказательства. «На рассмотрении»: претензия у площадки. «Возвращено» или «Отказ площадки»: итог спора.' },
  { cat: 'Кабинет', q: 'Как добавить точку?', a: 'В разделе «Профиль» добавьте адрес. Чтобы изменить число точек в тарифе, напишите куратору в чат.' },
  { cat: 'Кабинет', q: 'Где лимиты моего тарифа?', a: 'На главной странице кабинета: сколько споров, вопросов юристу и бесплатных замен осталось.' },
  ...FAQ
];
V.voprosy = () => `<div class="panel-head"><div><h2>Вопросы и ответы</h2></div></div><div class="faq-filter" id="accFaqF"></div><div class="faq" id="accFaq"></div>`;

V.chat = () => `<div class="panel-head"><div><h2>Чат с куратором</h2><p>В демо-версии отвечает бот. В рабочей версии здесь будет ваш куратор${T().id === 'full' ? ', ответ за 2 часа' : ''}.</p></div></div>
  <div class="card" style="padding:0;overflow:hidden;display:flex;flex-direction:column;height:min(560px,70vh)">
    <div class="chat-log" id="chatLog" aria-live="polite">${A.chat.map(m => `<div class="msg ${m.who}">${m.who === 'u' ? esc(m.text) : m.text}</div>`).join('')}</div>
    <form class="chat-form" id="chatForm"><input class="input" id="chatInput" placeholder="Напишите сообщение" autocomplete="off" aria-label="Сообщение"><button class="btn" type="submit">Отправить</button></form>
  </div>`;

V.profil = () => `<div class="panel-head"><div><h2>Профиль</h2></div></div>
  <div class="grid g2">
    <form class="card" id="profForm"><h3 style="margin-bottom:16px">Контакты</h3>
      <div class="field"><label for="pName">Имя</label><input class="input" id="pName" value="${esc(A.name || '')}"></div>
      <div class="field"><label for="pEmail">Почта</label><input class="input" id="pEmail" type="email" value="${esc(A.email || '')}"></div>
      <div class="field"><label for="pPhone">Телефон</label><input class="input" id="pPhone" type="tel" value="${esc(A.phone || '')}"></div>
      <button class="btn" type="submit">Сохранить</button></form>
    <div class="card"><h3 style="margin-bottom:16px">Тариф</h3>
      <div class="field"><label for="pPlan">Тариф</label><select class="input" id="pPlan">${TARIFFS.map(t => `<option value="${t.id}"${t.id === A.plan ? ' selected' : ''}>${t.name}, ${rub(t.year)} за точку в год</option>`).join('')}</select></div>
      <p class="hint">В демо-версии тариф меняется сразу. В рабочей версии смену подтверждает куратор.</p>
      <h3 style="margin:24px 0 12px">Точки</h3>
      <div id="addrList" style="display:grid;gap:8px">${A.addresses.map((a, i) => `<div class="tpl" style="padding:10px 14px"><span style="color:var(--ink)">${esc(a)}</span><button class="link-btn small" type="button" data-del-addr="${i}">Удалить</button></div>`).join('')}</div>
      <form id="addrForm" style="display:flex;gap:8px;margin-top:10px"><input class="input" id="newAddr" placeholder="Адрес новой точки" aria-label="Адрес новой точки"><button class="btn btn-ghost" type="submit">Добавить</button></form>
    </div>
  </div>
  <div class="card" style="margin-top:20px;display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap"><div><b>Демо-данные</b><p class="muted small">Удалить все записи кабинета из этого браузера и начать заново.</p></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-ghost btn-sm" type="button" id="resetDemo">Сбросить демо</button><button class="btn btn-ghost btn-sm" type="button" id="logout">Выйти</button></div></div>`;

/* ---------- формы в модальных окнах ---------- */
function newCaseModal() {
  modal('Новый спор', `<form id="caseForm" novalidate>
    <div class="row2"><div class="field"><label for="cPl">Площадка</label><select class="input" id="cPl">${PLATFORMS.map(p => `<option>${p}</option>`).join('')}</select></div>
    <div class="field"><label for="cRs">Причина</label><select class="input" id="cRs">${Object.entries(REASONS).map(([k, v]) => `<option value="${k}">${v.t}</option>`).join('')}</select></div>
    <div class="field"><label for="cSum">Сумма удержания, ₽</label><input class="input" id="cSum" type="number" min="1" inputmode="numeric"><span class="err" id="cSum-err" hidden>Укажите сумму</span></div>
    <div class="field"><label for="cDate">Дата удержания</label><input class="input" id="cDate" type="date"></div></div>
    <div class="field"><label for="cAddr">Точка</label><select class="input" id="cAddr">${A.addresses.map(a => `<option>${esc(a)}</option>`).join('')}</select></div>
    <div class="field"><label for="cWhat">Что произошло</label><textarea class="input" id="cWhat" rows="3"></textarea></div>
    <div class="field"><label for="cFiles">Доказательства</label><input class="input" id="cFiles" type="file" multiple><span class="hint">В демо-версии файлы не загружаются, сохраняются только их названия.</span></div>
    <button class="btn" type="submit">Создать спор</button></form>`, () => {
    $('#cDate').valueAsDate = new Date();
    $('#caseForm').addEventListener('submit', e => {
      e.preventDefault();
      const sum = +$('#cSum').value;
      if (!(sum > 0)) { $('#cSum-err').hidden = false; $('#cSum').setAttribute('aria-invalid', 'true'); $('#cSum').focus(); return; }
      A.cases.push({ id: Date.now(), platform: $('#cPl').value, reason: $('#cRs').value, sum, date: $('#cDate').value ? new Date($('#cDate').value).toISOString() : new Date().toISOString(), addr: $('#cAddr').value, what: $('#cWhat').value.trim(), files: [...$('#cFiles').files].map(f => f.name), status: 'new' });
      save(); closeModal(); location.hash = 'spory'; render(); toast('Спор создан, статус «Готовим претензию»');
    });
  });
}
function caseModal(id) {
  const c = A.cases.find(x => String(x.id) === String(id)); if (!c) return;
  const steps = [['Спор создан', true], ['Претензия подготовлена', c.status !== 'new'], ['Претензия у площадки', c.status === 'work' || c.status === 'done' || c.status === 'rej'], [c.status === 'rej' ? 'Отказ площадки' : 'Деньги возвращены', c.status === 'done' || c.status === 'rej']];
  const text = claimText({ platform: c.platform, reason: c.reason, sum: c.sum, date: c.date, what: c.what, address: c.addr });
  modal(`${c.platform}: ${rub(c.sum)}`, `<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">${st(c.status)}<span class="muted small">${REASONS[c.reason].t} · ${esc(c.addr || '')}</span>${c.ex ? '<span class="tag-ex">пример</span>' : ''}</div>
    <ul class="timeline">${steps.map(([t, d]) => `<li class="${d ? 'done' : ''}"><div><b>${t}</b></div></li>`).join('')}</ul>
    ${c.files && c.files.length ? `<p class="small muted">Файлы: ${c.files.map(esc).join(', ')}</p>` : ''}
    <div class="label">Черновик претензии</div><pre class="doc" id="caseDoc">${esc(text)}</pre>
    <div><button class="btn btn-sm" type="button" id="caseCopy">Скопировать текст</button></div>`, () => { $('#caseCopy').onclick = () => copyText(text, $('#caseDoc')); });
}
function newQModal(topic = 'Юридическое') {
  const L = limits();
  if (qCount() >= L.qs) { modal('Лимит вопросов', `<p class="muted">По тарифу «${T().name}» доступно ${L.qs} вопроса за 30 дней, они уже использованы. На «Оптимальном» вопросы без лимита.</p><a class="btn" href="#profil" id="goProf">Сменить тариф</a>`, () => { $('#goProf').onclick = closeModal; }); return; }
  modal('Вопрос юристу или финансисту', `<form id="qForm" novalidate>
    <div class="field"><label for="qTopic">Тема</label><select class="input" id="qTopic">${['Юридическое', 'Финансы', 'Налоги и НДС', 'Сотрудники', 'Другое'].map(t => `<option${t === topic ? ' selected' : ''}>${t}</option>`).join('')}</select></div>
    <div class="field"><label for="qText">Вопрос</label><textarea class="input" id="qText" rows="5" placeholder="Опишите ситуацию: что произошло, какие документы есть"></textarea><span class="err" id="qText-err" hidden>Напишите вопрос</span></div>
    <p class="hint" style="margin-bottom:14px">${T().id === 'base' ? `Осталось вопросов: ${L.qs - qCount()} из ${L.qs}.` : T().sla[0].toUpperCase() + T().sla.slice(1) + '.'}</p>
    <button class="btn" type="submit">Отправить вопрос</button></form>`, () => {
    $('#qForm').addEventListener('submit', e => {
      e.preventDefault(); const text = $('#qText').value.trim();
      if (!text) { $('#qText-err').hidden = false; $('#qText').focus(); return; }
      A.qs.push({ id: Date.now(), topic: $('#qTopic').value, text, date: new Date().toISOString(), status: 'wait' });
      save(); closeModal(); location.hash = 'pravo'; render(); toast('Вопрос отправлен');
    });
  });
}
function tplModal(k) {
  const t = TEMPLATES.find(x => x.k === k); const text = t.text();
  modal(t.t, `<pre class="doc" id="tplDoc">${esc(text)}</pre><div><button class="btn btn-sm" type="button" id="tplCopy">Скопировать текст</button></div>`, () => { $('#tplCopy').onclick = () => copyText(text, $('#tplDoc')); });
}

/* ---------- рендер ---------- */
function current() { const h = location.hash.slice(1); return SECTIONS.some(s => s[0] === h) ? h : 'obzor'; }
function render() {
  const cur = current();
  $('#side').innerHTML = SECTIONS.map(s => s[0] === '-' ? '<hr>' : `<a href="#${s[0]}" class="${s[2] || ''}"${s[0] === cur ? ' aria-current="true"' : ''}>${s[1]}</a>`).join('');
  $('#view').innerHTML = V[cur]();
  document.title = SECTIONS.find(s => s[0] === cur)[1] + ' · Личный кабинет · Защита ПВЗ';

  $$('[data-act=newCase]').forEach(b => b.onclick = newCaseModal);
  $$('[data-act=newQ]').forEach(b => b.onclick = () => newQModal(b.dataset.topic));
  $$('[data-case]').forEach(b => b.onclick = () => caseModal(b.dataset.case));
  $$('[data-tpl]').forEach(b => b.onclick = () => tplModal(b.dataset.tpl));
  $$('[data-urgent]').forEach(b => b.onclick = () => { A.chat.push({ who: 'u', text: b.dataset.urgent }); A.chat.push({ who: 'b', text: 'Сообщение передано куратору с пометкой «срочно». В демо-версии куратор не подключается. В рабочей версии он свяжется с вами по телефону из профиля.' }); save(); location.hash = 'chat'; });

  if (cur === 'srochno') {
    $('#rDate').valueAsDate = new Date();
    $('#replForm').addEventListener('submit', e => {
      e.preventDefault();
      A.repl.push({ id: Date.now(), addr: $('#rAddr').value, date: $('#rDate').value ? new Date($('#rDate').value).toISOString() : new Date().toISOString(), from: $('#rFrom').value, to: $('#rTo').value, note: $('#rNote').value.trim(), status: 'search' });
      save(); render(); toast('Заявка принята, ищем замену');
    });
  }
  if (cur === 'finansy') { mountProfit($('#accProfit'), 'ap'); mountNds($('#accNds'), 'an'); }
  if (cur === 'voprosy') renderFaq($('#accFaq'), $('#accFaqF'), ACC_FAQ);
  if (cur === 'chat') {
    const log = $('#chatLog'); log.scrollTop = log.scrollHeight;
    $('#chatForm').addEventListener('submit', e => {
      e.preventDefault(); const i = $('#chatInput'), v = i.value.trim(); if (!v) return; i.value = '';
      A.chat.push({ who: 'u', text: v }); const m = document.createElement('div'); m.className = 'msg u'; m.textContent = v; log.appendChild(m);
      setTimeout(() => { const a = botAnswer(v); A.chat.push({ who: 'b', text: a }); save(); const r = document.createElement('div'); r.className = 'msg b'; r.innerHTML = a; log.appendChild(r); log.scrollTop = log.scrollHeight; }, 300);
      log.scrollTop = log.scrollHeight; save();
    });
  }
  if (cur === 'profil') {
    $('#profForm').addEventListener('submit', e => { e.preventDefault(); A.name = $('#pName').value.trim(); A.email = $('#pEmail').value.trim(); A.phone = $('#pPhone').value.trim(); save(); toast('Сохранено'); });
    $('#pPlan').onchange = () => { A.plan = $('#pPlan').value; save(); toast(`Тариф изменён на «${T().name}»`); };
    $('#addrForm').addEventListener('submit', e => { e.preventDefault(); const v = $('#newAddr').value.trim(); if (!v) return; A.addresses.push(v); save(); render(); });
    $$('[data-del-addr]').forEach(b => b.onclick = () => { if (A.addresses.length <= 1) { toast('Нужна хотя бы одна точка'); return; } A.addresses.splice(+b.dataset.delAddr, 1); save(); render(); });
    let armed = false;
    $('#resetDemo').onclick = e => { if (!armed) { armed = true; e.target.textContent = 'Точно сбросить?'; return; } store.del('acc'); store.del('order'); A = seed(); save(); toast('Демо-данные сброшены'); render(); };
    $('#logout').onclick = () => { SESSION = false; store.del('session'); location.hash = ''; boot(); };
  }
  $('#view').focus({ preventScroll: true });
}

function boot() {
  const o = store.get('order', null);
  if (!hasSession()) {
    $('#login').hidden = false; $('#app').hidden = true;
    if (o) { $('#loginText').textContent = `Вы оставили заявку № ${o.no} на тариф «${tariffById(o.plan).name}». Демо-кабинет покажет выбранный тариф.`; $('#enterDemo').textContent = 'Войти в кабинет'; }
    return;
  }
  if (!A || (o && A.orderNo !== o.no)) { A = seed(); save(); }
  $('#login').hidden = true; $('#app').hidden = false; render();
}

window.addEventListener('load', () => {
  $('#view').tabIndex = -1;
  $('#enterDemo').onclick = () => { SESSION = true; store.set('session', true); boot(); };
  $('#modalClose').onclick = closeModal;
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#modal').hidden) closeModal(); });
  window.addEventListener('hashchange', () => { if (hasSession()) render(); });
  boot();
});
