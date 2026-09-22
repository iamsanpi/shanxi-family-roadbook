const el = (id) => document.getElementById(id);
const escape = (s) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const link = (url, label) => `<a href="${escape(url)}" target="_blank" rel="noopener">${escape(label)} ↗</a>`;
const map = (name) => `https://uri.amap.com/search?keyword=${encodeURIComponent(name)}&callnative=1`;
const key = 'shanxi-roadbook-v2';
async function start() {
    const response = await fetch('data.json');
    if (!response.ok)
        throw Error('data');
    const data = await response.json();
    let raw = {};
    try {
        raw = JSON.parse(localStorage.getItem(key) || '{}');
    }
    catch { }
    const state = { selected: data.stays.map((s, i) => Number.isInteger(raw.selected?.[i]) && s.options[raw.selected[i]] ? raw.selected[i] : 0), prices: data.stays.map((_, i) => Math.max(0, Math.min(100000, Number(raw.prices?.[i]) || 0))), checks: data.checks.map((_, i) => raw.checks?.[i] === true), day: Math.max(0, Math.min(5, Number(raw.day) || 0)) };
    const save = () => { try {
        localStorage.setItem(key, JSON.stringify(state));
    }
    catch { } };
    function renderDay(d, i) { return `<article class="day-card"><div class="day-top"><div><span>10月${i + 1}日 · ${d.weekday}</span><h2>${escape(d.title)}</h2><p>${escape(d.route)}</p><p class="small">${escape(d.drive)}</p></div><span class="day-number">0${i + 1}</span></div><div class="day-body"><ol class="timeline">${d.events.map(e => `<li><time>${escape(e[0])}</time><h3>${escape(e[1])}</h3><p>${escape(e[2])}</p></li>`).join('')}</ol><aside><div class="sidebox"><h3>🍜 今天吃什么</h3><p>${escape(d.food)}</p></div><div class="sidebox"><h3>☁ 给孩子留白</h3><p>${escape(d.rest)}</p></div><div class="sidebox"><h3>⚡ 补电安排</h3><p>${escape(d.charge)}</p></div><div class="sidebox warn"><h3>临场减法</h3><p>${escape(d.fallback)}</p></div><div class="links">${d.places.map(p => link(map(p), p + ' · 地图搜索')).join('')}</div><p class="small">地图链接为地点搜索；请核对同名地点及入口，再开始导航。</p></aside></div></article>`; }
    function showDay(index) { state.day = index; el('days').innerHTML = data.days.map((d, i) => `<button data-day="${i}" class="${i === index ? 'active' : ''}" aria-pressed="${i === index}"><small>DAY 0${i + 1} · ${d.date}</small>${d.city}</button>`).join(''); el('day').innerHTML = renderDay(data.days[index], index); save(); }
    el('days').addEventListener('click', e => { const b = e.target.closest('button[data-day]'); if (b)
        showDay(Number(b.dataset.day)); });
    function budget() { const total = state.prices.reduce((a, b) => a + b, 0); const complete = state.prices.every(p => p > 0); el('total').textContent = '¥' + total.toLocaleString('zh-CN'); el('budget-status').textContent = !complete ? '尚有未填写的酒店，当前为部分合计' : total > 2500 ? '超过原预算 ¥2,500；按实际房型价格比较' : total > 1750 ? '高于理想预算，仍在原预算区间内' : '在理想住宿预算内'; el('budget-status').className = total > 2500 ? 'over' : ''; }
    function hotels() { el('hotels').innerHTML = data.stays.map((s, i) => { const chosen = s.options[state.selected[i]]; return `<article class="hotel"><small>${s.dates} · ${s.nights}晚</small><h3>${s.city}</h3><label for="hotel-${i}">酒店候选</label><select id="hotel-${i}" data-stay="${i}">${s.options.map((o, j) => `<option value="${j}" ${j === state.selected[i] ? 'selected' : ''}>${escape(o.name)}</option>`).join('')}</select><p>${escape(chosen.note)}</p><p class="over">${escape(chosen.quote || "此备选尚未查到对应国庆日期报价，不能保证低于¥500。")}</p>${link('https://hotels.ctrip.com/hotels/detail/?hotelId=' + chosen.id + '&checkIn=2026-10-0' + (i + 1) + '&checkOut=2026-10-0' + (i === 3 ? 6 : i + 2) + '&adult=2&children=1', '携程查对应日期（核对儿童5岁）')}<label for="price-${i}">${s.nights}晚含税总价 ¥ <input id="price-${i}" type="number" min="0" max="100000" step="1" inputmode="numeric" placeholder="待核价" value="${state.prices[i] || ''}" data-price="${i}"></label><small>${s.nights === 2 ? '请填写10月4–6日两晚合计，不是单晚价格。' : '请填写对应日期一晚价格。'} ${state.prices[i] / s.nights > 500 ? '⚠ 超过原参考¥500/晚' : ''}</small></article>`; }).join(''); budget(); }
    el('hotels').addEventListener('change', e => { const t = e.target; if (t.dataset.stay !== undefined) {
        const i = Number(t.dataset.stay);
        state.selected[i] = Number(t.value);
        state.prices[i] = 0;
        hotels();
    }
    else if (t.dataset.price !== undefined) {
        state.prices[Number(t.dataset.price)] = Math.max(0, Math.min(100000, Number(t.value) || 0));
        hotels();
    } save(); });
    el('checks').innerHTML = data.checks.map((c, i) => `<label><input type="checkbox" data-check="${i}" ${state.checks[i] ? 'checked' : ''}><span>${escape(c)}</span></label>`).join('');
    el('checks').addEventListener('change', e => { const t = e.target; state.checks[Number(t.dataset.check)] = t.checked; save(); });
    el('sources').innerHTML = data.sources.map(s => `<div class="source-row">${link(s[1], s[0])}<p>${escape(s[2])}</p></div>`).join('');
    el('chargers').innerHTML = data.chargers.map(c => `<p>${link(c[1], c[0])}<br>${escape(c[2])}</p>`).join('');
    el('export').addEventListener('click', () => { const blob = new Blob([JSON.stringify({ trip: '2026-10-01至06晋北亲子自驾', savedAt: new Date().toISOString(), stays: data.stays.map((s, i) => ({ city: s.city, dates: s.dates, hotel: s.options[state.selected[i]]?.name, totalPrice: state.prices[i] || '待核价' })), checklist: data.checks.map((item, i) => ({ item, done: state.checks[i] })), days: data.days }, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = '晋北六日路书-我的安排.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); });
    const printAll = () => { const block = document.createElement('div'); block.id = 'print-all'; block.innerHTML = data.days.map(d => `<div class="print-day">${renderDay(d, data.days.indexOf(d))}</div>`).join(''); el('day').after(block); };
    window.addEventListener('beforeprint', printAll);
    window.addEventListener('afterprint', () => el('print-all')?.remove());
    el('print').addEventListener('click', () => window.print());
    showDay(state.day);
    hotels();
}
start().catch(() => { el('day').textContent = '路书数据暂时未加载，请刷新页面；若离线，请先联网打开一次。'; });
export {};
