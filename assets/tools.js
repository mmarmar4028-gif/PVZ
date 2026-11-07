/* Инструменты: претензия по удержанию, прибыль точки, порог НДС. Используются на tools.html и в кабинете. */
'use strict';

const REASONS = {
  idle: { t: 'Простой или срыв графика работы', d: 'простой или срыв графика работы пункта выдачи',
    ev: ['Видео с камер за день, указанный в удержании', 'График работы пункта и фото вывески с режимом', 'Скриншоты из кабинета площадки с удержанием и его основанием', 'Переписка с поддержкой площадки'] },
  loss: { t: 'Недостача или повреждение посылок', d: 'недостача или повреждение посылок',
    ev: ['Видео с камер приёмки и выдачи посылки', 'Фото посылки при приёмке и акт приёмки', 'Скриншоты из кабинета площадки с удержанием', 'Пункт оферты, на который ссылается площадка'] },
  claim: { t: 'Претензия клиента', d: 'претензия клиента',
    ev: ['Видео выдачи заказа клиенту', 'Данные о факте выдачи из системы площадки (время, сотрудник)', 'Скриншот претензии клиента и удержания', 'Переписка с поддержкой площадки'] },
  other: { t: 'Другое', d: 'удержание без понятного основания',
    ev: ['Скриншоты из кабинета площадки с удержанием', 'Пункт оферты, на который ссылается площадка', 'Всё, что подтверждает вашу позицию: видео, фото, переписка'] }
};
const PLATFORMS = ['Ozon', 'Яндекс Маркет', 'Wildberries', 'Другая площадка'];

function claimText({ platform, reason, sum, date, what, owner, address }) {
  const r = REASONS[reason] || REASONS.other;
  const d = date ? new Date(date).toLocaleDateString('ru-RU') : '[дата]';
  const s = Math.round(+sum || 0).toLocaleString('ru-RU');
  return `Кому: ${platform}, служба поддержки партнёров пунктов выдачи
От кого: ${owner || '[ИП или организация, ИНН]'}
Пункт выдачи: ${address || '[адрес пункта]'}
Тема: претензия по удержанию от ${d}

Я, владелец пункта выдачи, получил удержание на сумму ${s} ₽ (${r.d}). С удержанием не согласен.

Обстоятельства: ${what || '[опишите, что произошло в этот день]'}

Прошу:
1. Сообщить основание и расчёт удержания.
2. Пересмотреть решение и вернуть ${s} ₽.

К претензии приложены:
${r.ev.map((e, i) => (i + 1) + ') ' + e).join('\n')}

Жду ответа в срок, указанный в оферте площадки.
[Дата, подпись]`;
}

/* Форма претензии. root: контейнер, prefix: префикс id, чтобы на одной странице можно было держать две формы */
function mountClaim(root, prefix = 'cl') {
  const id = n => prefix + '-' + n;
  root.innerHTML = `<div class="grid g2">
    <div class="card">
      <div class="field"><label for="${id('pl')}">Площадка</label><select class="input" id="${id('pl')}">${PLATFORMS.map(p => `<option>${p}</option>`).join('')}</select></div>
      <div class="field"><label for="${id('rs')}">За что удержали</label><select class="input" id="${id('rs')}">${Object.entries(REASONS).map(([k, v]) => `<option value="${k}">${v.t}</option>`).join('')}</select></div>
      <div class="row2">
        <div class="field"><label for="${id('sm')}">Сумма, ₽</label><input class="input" id="${id('sm')}" type="number" min="0" inputmode="numeric" value="4500"></div>
        <div class="field"><label for="${id('dt')}">Дата удержания</label><input class="input" id="${id('dt')}" type="date"></div>
      </div>
      <div class="field"><label for="${id('wh')}">Что произошло</label><textarea class="input" id="${id('wh')}" rows="4" placeholder="Например: пункт работал по графику, камеры записали весь день"></textarea></div>
    </div>
    <div class="card">
      <div class="label" style="margin-bottom:8px">Черновик претензии</div>
      <pre class="doc" id="${id('out')}" aria-live="polite"></pre>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px"><button class="btn btn-sm" type="button" id="${id('cp')}">Скопировать текст</button></div>
      <div class="label" style="margin:20px 0 8px">Что приложить</div>
      <ul class="checklist" id="${id('ev')}"></ul>
      <p class="hint" style="margin-top:14px">Это шаблон для самостоятельной подачи, он не заменяет консультацию юриста. Сроки и порядок подачи смотрите в оферте вашей площадки.</p>
    </div></div>`;
  const dt = document.getElementById(id('dt')); dt.valueAsDate = new Date();
  const upd = () => {
    const v = { platform: document.getElementById(id('pl')).value, reason: document.getElementById(id('rs')).value, sum: document.getElementById(id('sm')).value, date: dt.value, what: document.getElementById(id('wh')).value.trim() };
    document.getElementById(id('out')).textContent = claimText(v);
    document.getElementById(id('ev')).innerHTML = REASONS[v.reason].ev.map(e => `<li>${esc(e)}</li>`).join('');
  };
  ['pl', 'rs', 'sm', 'dt', 'wh'].forEach(n => document.getElementById(id(n)).addEventListener('input', upd));
  document.getElementById(id('cp')).onclick = () => copyText(document.getElementById(id('out')).textContent, document.getElementById(id('out')));
  upd();
}

function mountProfit(root, prefix = 'pr') {
  const id = n => prefix + '-' + n;
  const fields = [['inc', 'Вознаграждение площадки за месяц', 180000], ['rent', 'Аренда', 45000], ['pay', 'Зарплаты', 70000], ['util', 'Свет, интернет, связь', 8000], ['fine', 'Штрафы и удержания', 9000], ['oth', 'Прочее: хозтовары, налоги', 12000]];
  root.innerHTML = `<div class="grid g2">
    <div class="card">
      <p class="notice" style="margin-bottom:18px">В полях стоят примерные числа. Замените их своими данными за месяц.</p>
      <div class="field"><label for="${id('inc')}">${fields[0][1]}, ₽</label><input class="input" id="${id('inc')}" type="number" min="0" inputmode="numeric" value="${fields[0][2]}"></div>
      <div class="row2">${fields.slice(1).map(([k, l, v]) => `<div class="field"><label for="${id(k)}">${l}, ₽</label><input class="input" id="${id(k)}" type="number" min="0" inputmode="numeric" value="${v}"></div>`).join('')}
        <div class="field"><label for="${id('fee')}">Плата площадки, % от вознаграждения</label><input class="input" id="${id('fee')}" type="number" min="0" max="100" step="0.1" inputmode="decimal" value="0"></div></div>
      <p class="hint">По данным исследования команды, Ozon с 1 декабря 2026 года берёт до 1% вознаграждения владельца. Сверьтесь со своим договором.</p>
    </div>
    <div class="card">
      <div class="label">Прибыль за месяц</div>
      <div class="big-num" id="${id('res')}"></div>
      <p id="${id('mg')}" class="muted" style="margin:4px 0 20px"></p>
      <div id="${id('bars')}"></div>
      <p id="${id('yr')}" class="hint" style="margin-top:14px"></p>
    </div></div>`;
  const n = k => Math.max(0, parseFloat(document.getElementById(id(k)).value) || 0);
  const upd = () => {
    const inc = n('inc'), fee = Math.min(100, n('fee')) / 100 * inc;
    const items = [['Аренда', n('rent')], ['Зарплаты', n('pay')], ['Свет, связь', n('util')], ['Штрафы', n('fine')], ['Прочее', n('oth')], ['Плата площадки', fee]];
    const p = inc - items.reduce((a, b) => a + b[1], 0);
    const r = document.getElementById(id('res')); r.textContent = rub(p); r.className = 'big-num ' + (p >= 0 ? 'pos' : 'neg');
    document.getElementById(id('mg')).textContent = inc > 0 ? `Рентабельность ${(p / inc * 100).toFixed(1).replace('.', ',')}% от вознаграждения` : 'Введите вознаграждение';
    const mx = Math.max(1, ...items.map(i => i[1]));
    document.getElementById(id('bars')).innerHTML = items.map(([l, v]) => `<div class="bar-row"><span>${l}</span><span class="track"><i style="width:${v / mx * 100}%"></i></span><span>${rub(v)}</span></div>`).join('');
    document.getElementById(id('yr')).textContent = `За 12 месяцев: ${rub(p * 12)}. Штрафы и удержания за год: ${rub(n('fine') * 12)}.`;
  };
  ['inc', 'rent', 'pay', 'util', 'fine', 'oth', 'fee'].forEach(k => document.getElementById(id(k)).addEventListener('input', upd));
  upd();
}

/* Порог НДС на УСН по 425-ФЗ: 2026 год 20 млн, 2027 год 15 млн, с 2028 года 10 млн ₽ */
const NDS_LIMITS = { 2026: 20e6, 2027: 15e6, 2028: 10e6 };
function mountNds(root, prefix = 'nd') {
  const id = n => prefix + '-' + n;
  root.innerHTML = `<div class="grid g2">
    <div class="card">
      <div class="field"><label for="${id('inc')}">Доход за год по всем точкам, ₽</label><input class="input" id="${id('inc')}" type="number" min="0" inputmode="numeric" value="16000000"></div>
      <div class="field"><label for="${id('y')}">Год</label><select class="input" id="${id('y')}"><option value="2026">2026</option><option value="2027">2027</option><option value="2028">2028 и дальше</option></select></div>
      <p class="hint">Для УСН. Порог по закону № 425-ФЗ от 28.11.2025: 20 млн ₽ в 2026 году, 15 млн ₽ в 2027 году, 10 млн ₽ с 2028 года.</p>
    </div>
    <div class="card"><div class="label">Результат</div><div class="big-num" id="${id('res')}" style="font-size:28px;margin:6px 0 10px"></div><p id="${id('txt')}" class="muted"></p></div></div>`;
  const upd = () => {
    const inc = Math.max(0, parseFloat(document.getElementById(id('inc')).value) || 0), y = document.getElementById(id('y')).value, lim = NDS_LIMITS[y];
    const r = document.getElementById(id('res')), t = document.getElementById(id('txt'));
    if (inc > lim) { r.textContent = 'Выше порога'; r.className = 'big-num neg'; t.textContent = `Доход больше ${rub(lim)} на ${rub(inc - lim)}. Скорее всего, придётся платить НДС. Обсудите это с бухгалтером заранее.`; }
    else { const left = lim - inc; r.textContent = 'Ниже порога'; r.className = 'big-num pos'; t.textContent = `До порога ${rub(lim)} осталось ${rub(left)} (${(left / lim * 100).toFixed(0)}%). ${left / lim < 0.2 ? 'Запас небольшой, следите за доходом по месяцам.' : ''}`; }
    r.style.fontSize = '28px';
  };
  ['inc', 'y'].forEach(k => document.getElementById(id(k)).addEventListener('input', upd));
  upd();
}
