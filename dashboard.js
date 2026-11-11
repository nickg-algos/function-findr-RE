(function () {
  "use strict";

  const DD = window.FF_DASHBOARD;
  const CAL = window.FF_CALENDAR;
  const { esc, CHECKLIST_KEY, checklistSteps, miniChecklist, selStepDone } = window.FF_SHARED;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  const STORE_KEY = "ff.dashboard.v1";
  const ORANGE = "#d0702f";
  const CHARCOAL = "#58595b"; // the comparison series: checked against orange for colour-blind separation

  /* ---------- Widgets you can put on the dashboard ---------- */

  const SIZE_NAMES = { s: "Small", m: "Medium", l: "Large" };
  const WIDGETS = {
    functionsTile: { title: "Functions held", desc: "How many functions you ran, against the period before.", sizes: ["s", "m"] },
    functions: { title: "Functions per month", sub: "Against the same months a year earlier", desc: "A line graph of functions held, with last year for comparison.", sizes: ["m", "l"], table: true },
    todo: { title: "To do", desc: "Your own list. Tick things off as you go.", sizes: ["s", "m", "l"] },
    checklists: { title: "Customer checklists", sub: "Bookings still filling theirs in", desc: "Which customers haven’t finished their checklist, and where they’re up to.", sizes: ["m", "l"] },
    spaces: { title: "Revenue by function space", sub: "Inc. GST", desc: "Which rooms earn the most.", sizes: ["m", "l"] },
    days: { title: "Busiest days", sub: "Functions by day of the week", desc: "Which days your functions fall on.", sizes: ["m", "l"], table: true },
  };
  const DEFAULT_LAYOUT = [
    { id: "functionsTile", size: "m" }, { id: "functions", size: "m" },
    { id: "todo", size: "m" }, { id: "checklists", size: "m" },
  ];
  const PERIODS = [3, 6, 12];

  /* ---------- Saved state (layout, date range, to-do list) ---------- */

  const copy = (x) => JSON.parse(JSON.stringify(x));
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE_KEY));
      if (s && Array.isArray(s.layout)) {
        s.layout = s.layout.filter((w) => WIDGETS[w.id] && WIDGETS[w.id].sizes.includes(w.size));
        // Functions held used to start small. Bring older saved layouts up once; after that the size buttons decide.
        if (!s.functionsTileGrown) {
          s.layout.forEach((w) => { if (w.id === "functionsTile" && w.size === "s") w.size = "m"; });
          s.functionsTileGrown = true;
        }
        return s;
      }
    } catch (e) { /* nothing saved, or storage blocked */ }
    return null;
  }
  const state = load() || { layout: copy(DEFAULT_LAYOUT), period: 12, todos: copy(DD.todos), functionsTileGrown: true };
  if (!PERIODS.includes(state.period)) state.period = 12;
  if (!Array.isArray(state.todos)) state.todos = copy(DD.todos);
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* the page still works without storage */ }
  }

  /* ---------- Numbers ---------- */

  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const now = new Date();

  // The last `n` finished months, oldest first, shifted `back` months earlier.
  function months(n, back = 0) {
    const out = [];
    for (let i = n; i >= 1; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i - back, 1);
      out.push(DD.month(d.getFullYear(), d.getMonth()));
    }
    return out;
  }
  const sum = (list, k) => list.reduce((t, x) => t + x[k], 0);
  const dollars = (cents) => "$" + Math.round(cents / 100).toLocaleString("en-AU");
  const monthName = (m) => `${MONTHS[m.month]} ${m.year}`;
  const shortMonth = (m) => MONTHS[m.month].slice(0, 3);

  // Clean axis steps: 1, 2, 2.5 or 5 times a power of ten.
  function ticks(max, count = 4) {
    const raw = Math.max(max, 1) / count;
    const p = 10 ** Math.floor(Math.log10(raw));
    const f = raw / p;
    const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
    const out = [];
    for (let v = 0; v <= Math.ceil(max / step) * step + step / 1e6; v += step) out.push(Math.round(v * 1000) / 1000);
    return out;
  }

  /* ---------- Tooltip (one for the page) ---------- */

  const tip = $("#db-tip");
  // rows: [{ value, name, color, key: "line" | "rect" }]. Built with textContent: labels are data.
  function showTip(title, rows, x, y) {
    tip.replaceChildren();
    const t = document.createElement("p");
    t.className = "db-tip-title";
    t.textContent = title;
    tip.append(t);
    rows.forEach((r) => {
      const row = document.createElement("p");
      row.className = "db-tip-row";
      if (r.color) {
        const k = document.createElement("span");
        k.className = `db-key db-key-${r.key || "line"}`;
        k.style.background = r.color;
        row.append(k);
      }
      const v = document.createElement("strong");
      v.textContent = r.value;
      row.append(v);
      if (r.name) {
        const n = document.createElement("span");
        n.textContent = r.name;
        row.append(n);
      }
      tip.append(row);
    });
    tip.hidden = false;
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;
    let left = x + 14;
    if (left + w > innerWidth - 8) left = x - w - 14;
    // Placed on the page rather than the screen, so scrolling a chart into view doesn't strand it.
    tip.style.left = `${Math.max(8, left) + scrollX}px`;
    tip.style.top = `${Math.min(Math.max(8, y - h - 10), innerHeight - h - 8) + scrollY}px`;
  }
  const hideTip = () => { tip.hidden = true; };

  /* ---------- Charts (SVG, drawn to the widget's real width) ---------- */

  const svgEl = (w, h, label) => `<svg class="db-chart" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}" tabindex="0" focusable="true">`;

  // Rounded at the data end, square at the baseline.
  function columnPath(x0, x1, y, base) {
    const r = Math.min(4, (x1 - x0) / 2, base - y);
    return `M${x0} ${base}V${y + r}Q${x0} ${y} ${x0 + r} ${y}H${x1 - r}Q${x1} ${y} ${x1} ${y + r}V${base}Z`;
  }

  // Shared keyboard and pointer handling: one active index, shown in the tooltip.
  function wireChart(svg, n, indexAt, show) {
    let active = -1;
    const set = (i, fromKeys) => {
      active = Math.max(0, Math.min(n - 1, i));
      show(active, fromKeys);
    };
    svg.addEventListener("pointermove", (e) => {
      const i = indexAt(e);
      if (i < 0) return hideTip();
      active = i;
      show(i, false, e);
    });
    svg.addEventListener("pointerleave", () => { hideTip(); show(-1); });
    svg.addEventListener("focus", () => set(active < 0 ? n - 1 : active, true));
    svg.addEventListener("blur", () => { hideTip(); show(-1); });
    svg.addEventListener("keydown", (e) => {
      const move = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[e.key];
      if (move) {
        e.preventDefault();
        set(active + move, true);
      } else if (e.key === "Home" || e.key === "End") {
        e.preventDefault();
        set(e.key === "Home" ? 0 : n - 1, true);
      } else if (e.key === "Escape") {
        hideTip();
      }
    });
  }

  // Columns: one series. Labels only the latest column; the axis, tooltip and table carry the rest.
  function drawColumns(el, { labels, titles, values, fmt, fmtAxis, label, rowsFor }) {
    const W = Math.max(240, el.clientWidth);
    const H = el.closest(".dw").dataset.size === "l" ? 260 : 220;
    const m = { t: 22, r: 6, b: 26, l: 50 };
    const iw = W - m.l - m.r;
    const base = H - m.b;
    const tk = ticks(Math.max(...values)).map((v) => ({ v, fmt: fmtAxis(v) }));
    const top = tk[tk.length - 1].v;
    const y = (v) => base - (v / top) * (base - m.t);
    const band = iw / values.length;
    const bw = Math.min(24, band * 0.62);
    const every = band < 30 ? 2 : 1;
    let out = svgEl(W, H, label) + tk.map((t) => `<line class="db-grid-line" x1="${m.l}" x2="${W - m.r}" y1="${y(t.v)}" y2="${y(t.v)}"/><text class="db-axis" x="${m.l - 8}" y="${y(t.v) + 4}" text-anchor="end">${esc(t.fmt)}</text>`).join("");
    values.forEach((v, i) => {
      const cx = m.l + band * (i + 0.5);
      out += `<path class="db-col" data-i="${i}" fill="${ORANGE}" d="${columnPath(cx - bw / 2, cx + bw / 2, y(v), base)}"/>`;
      if (i % every === (values.length - 1) % every) out += `<text class="db-axis" x="${cx}" y="${H - 8}" text-anchor="middle">${esc(labels[i])}</text>`;
    });
    const last = values.length - 1;
    out += `<text class="db-val" x="${m.l + band * (last + 0.5)}" y="${y(values[last]) - 7}" text-anchor="middle">${esc(fmt(values[last]))}</text>`;
    out += "</svg>";
    el.innerHTML = out;
    const svg = $("svg", el);
    const cols = $$(".db-col", svg);
    wireChart(svg, values.length, (e) => {
      const r = svg.getBoundingClientRect();
      const i = Math.floor((e.clientX - r.left - m.l) / band);
      return i >= 0 && i < values.length ? i : -1;
    }, (i, fromKeys, e) => {
      cols.forEach((c, j) => c.classList.toggle("is-active", j === i));
      if (i < 0) return;
      const box = cols[i].getBoundingClientRect();
      showTip(titles[i], rowsFor(i), e && !fromKeys ? e.clientX : box.right, e && !fromKeys ? e.clientY : box.top);
    });
  }

  // Lines: this period against a year earlier, with a crosshair that snaps to the month.
  function drawLines(el, { labels, titles, current, earlier, label }) {
    const W = Math.max(240, el.clientWidth);
    const H = 275; // keeps this chart level with a medium Functions held box beside it
    const m = { t: 22, r: 14, b: 26, l: 36 };
    const iw = W - m.l - m.r;
    const base = H - m.b;
    const tk = ticks(Math.max(...current, ...earlier));
    const top = tk[tk.length - 1];
    const n = current.length;
    const x = (i) => m.l + (n === 1 ? iw / 2 : (iw * i) / (n - 1));
    const y = (v) => base - (v / top) * (base - m.t);
    const pts = (vals) => vals.map((v, i) => `${x(i)},${y(v)}`).join(" ");
    const every = iw / n < 30 ? 2 : 1;
    let out = svgEl(W, H, label);
    out += tk.map((v) => `<line class="db-grid-line" x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}"/><text class="db-axis" x="${m.l - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join("");
    labels.forEach((l, i) => {
      if (i % every === (n - 1) % every) out += `<text class="db-axis" x="${x(i)}" y="${H - 8}" text-anchor="middle">${esc(l)}</text>`;
    });
    out += `<polygon fill="${ORANGE}" fill-opacity=".1" points="${x(0)},${base} ${pts(current)} ${x(n - 1)},${base}"/>`;
    out += `<polyline class="db-line" stroke="${CHARCOAL}" points="${pts(earlier)}"/>`;
    out += `<polyline class="db-line" stroke="${ORANGE}" points="${pts(current)}"/>`;
    out += `<line class="db-cross" x1="0" x2="0" y1="${m.t - 6}" y2="${base}" visibility="hidden"/>`;
    out += `<circle class="db-dot" data-s="earlier" r="4" fill="${CHARCOAL}" visibility="hidden"/>`;
    out += `<circle class="db-dot" r="4" fill="${ORANGE}" cx="${x(n - 1)}" cy="${y(current[n - 1])}"/>`;
    out += `<text class="db-val" x="${x(n - 1)}" y="${y(current[n - 1]) - 10}" text-anchor="end">${current[n - 1]}</text>`;
    out += "</svg>";
    el.innerHTML = out;
    const svg = $("svg", el);
    const cross = $(".db-cross", svg);
    const [dotEarlier, dotNow] = $$(".db-dot", svg);
    const lastLabel = $(".db-val", svg);
    wireChart(svg, n, (e) => {
      const r = svg.getBoundingClientRect();
      const px = e.clientX - r.left;
      if (px < m.l - 10 || px > W - m.r + 10) return -1;
      return Math.max(0, Math.min(n - 1, Math.round(((px - m.l) / iw) * (n - 1))));
    }, (i, fromKeys, e) => {
      const on = i >= 0;
      cross.setAttribute("visibility", on ? "visible" : "hidden");
      dotEarlier.setAttribute("visibility", on ? "visible" : "hidden");
      lastLabel.setAttribute("visibility", on && i !== n - 1 ? "hidden" : "visible");
      const j = on ? i : n - 1;
      cross.setAttribute("x1", x(j));
      cross.setAttribute("x2", x(j));
      dotEarlier.setAttribute("cx", x(j));
      dotEarlier.setAttribute("cy", y(earlier[j]));
      dotNow.setAttribute("cx", x(j));
      dotNow.setAttribute("cy", y(current[j]));
      if (!on) return;
      const box = dotNow.getBoundingClientRect();
      showTip(titles[i], [
        { value: String(current[i]), name: "This period", color: ORANGE },
        { value: String(earlier[i]), name: "A year earlier", color: CHARCOAL },
      ], e && !fromKeys ? e.clientX : box.right, e && !fromKeys ? e.clientY : box.top);
    });
  }

  function table(caption, head, rows) {
    return `<div class="db-table-wrap"><table class="db-table"><caption class="sr-only">${esc(caption)}</caption><thead><tr>${head.map((h, i) => `<th scope="col"${i ? ' class="num"' : ""}>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c, i) => (i ? `<td class="num">${esc(c)}</td>` : `<th scope="row">${esc(c)}</th>`)).join("")}</tr>`).join("")}</tbody></table></div>`;
  }

  /* ---------- What each widget draws ---------- */

  const upArrow = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 10V2M2.500 5.500L6 2l3.500 3.500" fill="none" stroke="currentColor" stroke-width="1.800" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function tile(el, { value, cur, prev, series, fmtPoint }) {
    const n = state.period;
    let delta = '<p class="db-delta">No earlier figures to compare</p>';
    if (prev) {
      const change = (cur - prev) / prev;
      const up = change >= 0;
      // Up is good for every tile here; the arrow and words carry it, not colour alone.
      delta = `<p class="db-delta ${up ? "is-up" : "is-down"}">${upArrow}<span><span class="sr-only">${up ? "Up" : "Down"} </span>${Math.abs(change * 100).toFixed(1)}%</span><span class="db-delta-vs">vs the ${n} months before</span></p>`;
    }
    let spark = "";
    if (el.closest(".dw").dataset.size === "m" && series) {
      const W = 200;
      const H = 220; // matches .db-spark in dashboard.css
      const max = Math.max(...series);
      const min = Math.min(...series);
      const x = (i) => 4 + ((W - 8) * i) / (series.length - 1);
      const y = (v) => H - 5 - ((v - min) / (max - min || 1)) * (H - 10);
      const last = series.length - 1;
      spark = `<svg class="db-spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><polyline points="${series.map((v, i) => `${x(i)},${y(v)}`).join(" ")}" fill="none" stroke="#bcbec0" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg><span class="db-spark-dot" style="left:calc(${(x(last) / W) * 100}% - 4px);top:${y(series[last]) - 4}px" aria-hidden="true"></span><p class="db-spark-note">Month by month, latest ${esc(fmtPoint(series[last]))}</p>`;
    }
    el.innerHTML = `<p class="db-figure">${esc(value)}</p>${delta}<div class="db-spark-wrap">${spark}</div>`;
  }

  function bookingsDone(b) {
    if (b.live) {
      try {
        const saved = JSON.parse(localStorage.getItem(CHECKLIST_KEY));
        if (saved) return saved.done;
      } catch (e) { /* nothing saved, or storage blocked */ }
      return ["function"];
    }
    return ["function", ...checklistSteps.map((s) => s.id).filter((id) => id !== "function" && selStepDone(id, b.sel))];
  }
  const ordinal = (d) => d + ([11, 12, 13].includes(d) ? "th" : ({ 1: "st", 2: "nd", 3: "rd" }[d % 10] || "th"));
  const longDate = (iso) => `${ordinal(Number(iso.slice(8, 10)))} ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;

  const draw = {
    functionsTile(el) {
      const cur = months(state.period);
      const prev = months(state.period, state.period);
      tile(el, { value: String(sum(cur, "functions")), cur: sum(cur, "functions"), prev: sum(prev, "functions"), series: cur.map((m) => m.functions), fmtPoint: String });
    },
    functions(el, asTable) {
      const cur = months(state.period);
      const before = months(state.period, 12);
      if (asTable) {
        el.innerHTML = table("Functions per month", ["Month", "This period", "A year earlier"], cur.map((m, i) => [monthName(m), String(m.functions), String(before[i].functions)]));
        return;
      }
      el.innerHTML = `<p class="db-legend"><span><span class="db-key db-key-line" style="background:${ORANGE}"></span>This period</span><span><span class="db-key db-key-line" style="background:${CHARCOAL}"></span>A year earlier</span></p><div class="db-plot"></div>`;
      drawLines($(".db-plot", el), {
        labels: cur.map(shortMonth), titles: cur.map(monthName), current: cur.map((m) => m.functions), earlier: before.map((m) => m.functions),
        label: `Functions per month, ${monthName(cur[0])} to ${monthName(cur[cur.length - 1])}, against a year earlier. Use the arrow keys to read each month.`,
      });
    },
    days(el, asTable) {
      const total = sum(months(state.period), "functions");
      const counts = DD.dayShare.map((s) => Math.round(total * s));
      if (asTable) {
        el.innerHTML = table("Functions by day of the week", ["Day", "Functions"], DAYS.map((d, i) => [d, String(counts[i])]));
        return;
      }
      const busiest = counts.indexOf(Math.max(...counts));
      drawColumns(el, {
        labels: DAYS.map((d) => d.slice(0, 3)), titles: DAYS, values: counts, fmt: String, fmtAxis: String,
        label: `Functions by day of the week. ${DAYS[busiest]} is busiest with ${counts[busiest]}. Use the arrow keys to read each day.`,
        rowsFor: (i) => [{ value: String(counts[i]), name: "functions", color: ORANGE, key: "rect" }],
      });
    },
    // Every value is printed, so this is plain HTML bars with no tooltip.
    spaces(el) {
      const total = sum(months(state.period), "revenueCents");
      const rows = DD.spaceShare.map((s) => ({ name: s.name, cents: Math.round(total * s.share) }));
      const max = Math.max(...rows.map((r) => r.cents));
      el.innerHTML = `<ul class="db-hbars">${rows.map((r) => `<li><span class="db-hbar-name">${esc(r.name)}</span><span class="db-hbar-track"><span class="db-hbar" style="width:${(r.cents / max) * 100}%"></span></span><span class="db-hbar-val">${esc(dollars(r.cents))}</span></li>`).join("")}</ul>`;
    },
    checklists(el) {
      const open = CAL.bookings.map((b) => ({ b, done: bookingsDone(b) })).filter((x) => x.done.length < checklistSteps.length).sort((a, z) => a.b.start.localeCompare(z.b.start));
      const limit = el.closest(".dw").dataset.size === "l" ? 8 : 4;
      const space = (id) => (CAL.spaces.find((s) => s.id === id) || { name: "" }).name;
      if (!open.length) {
        el.innerHTML = '<p class="db-empty">Every customer has finished their checklist.</p>';
        return;
      }
      el.innerHTML = `<ul class="db-checklists">${open.slice(0, limit).map(({ b, done }) => `<li><div><p class="db-cl-title">${esc(b.title)}</p><p class="db-cl-meta">${esc(space(b.space))} · ${esc(longDate(b.start))}</p></div>${miniChecklist(done)}</li>`).join("")}</ul>
        <p class="db-more"><a href="calendar.html">${open.length > limit ? `See all ${open.length} in the booking calendar` : "Open the booking calendar"}</a></p>`;
    },
    todo(el) {
      const done = state.todos.filter((t) => t.done).length;
      el.innerHTML = `<p class="db-todo-count">${state.todos.length ? `${done} of ${state.todos.length} done` : "Nothing on the list"}</p>
        <ul class="db-todos">${state.todos.map((t, i) => `<li class="${t.done ? "is-done" : ""}"><label class="check"><input type="checkbox" data-todo="${i}"${t.done ? " checked" : ""}><span>${esc(t.text)}</span></label><button type="button" class="db-todo-del" data-del="${i}" aria-label="Delete: ${esc(t.text)}">&times;</button></li>`).join("")}</ul>
        <form class="db-todo-add" data-add-todo><label class="sr-only" for="db-todo-new">New to-do</label><input id="db-todo-new" type="text" maxlength="140" placeholder="Add something to do" autocomplete="off"><button type="submit" class="db-btn">Add</button></form>
        ${done ? '<button type="button" class="db-link" data-clear-done>Clear the ticked ones</button>' : ""}`;
    },
  };

  /* ---------- Rendering the grid ---------- */

  const grid = $("#db-grid");
  const tables = new Set(); // widgets showing their table view
  let editing = false;

  const gripIcon = '<svg viewBox="0 0 12 18" aria-hidden="true"><g fill="currentColor"><circle cx="3" cy="3" r="1.600"/><circle cx="9" cy="3" r="1.600"/><circle cx="3" cy="9" r="1.600"/><circle cx="9" cy="9" r="1.600"/><circle cx="3" cy="15" r="1.600"/><circle cx="9" cy="15" r="1.600"/></g></svg>';

  function widgetHtml({ id, size }) {
    const w = WIDGETS[id];
    const isTile = id.endsWith("Tile");
    return `<section class="dw${isTile ? " dw-tile" : ""}" data-id="${id}" data-size="${size}" aria-labelledby="dw-${id}-t">
      <div class="dw-head">
        <button type="button" class="dw-grip" aria-label="Move ${esc(w.title)}" aria-describedby="db-move-help">${gripIcon}</button>
        <div class="dw-titles"><h2 id="dw-${id}-t">${esc(w.title)}</h2>${w.sub ? `<p class="dw-sub">${esc(w.sub)}</p>` : ""}</div>
        <div class="dw-tools">
          ${w.table ? `<button type="button" class="dw-tool" data-table aria-pressed="${tables.has(id)}">${tables.has(id) ? "Chart" : "Table"}</button>` : ""}
          <div class="dw-sizes" role="group" aria-label="Size of ${esc(w.title)}">${w.sizes.map((s) => `<button type="button" class="dw-size" data-size="${s}" aria-pressed="${s === size}" title="${SIZE_NAMES[s]}"><span aria-hidden="true">${s.toUpperCase()}</span><span class="sr-only">${SIZE_NAMES[s]}</span></button>`).join("")}</div>
          <button type="button" class="dw-remove" aria-label="Remove ${esc(w.title)}" title="Remove">&times;</button>
        </div>
      </div>
      <div class="dw-body"></div>
    </section>`;
  }

  function drawWidget(section) {
    const id = section.dataset.id;
    hideTip();
    draw[id]($(".dw-body", section), tables.has(id));
  }

  // Charts redraw to their new width whenever a widget changes size.
  const widths = new WeakMap();
  const resizer = new ResizeObserver((entries) => entries.forEach((en) => {
    const section = en.target.closest(".dw");
    const w = Math.round(en.contentRect.width);
    if (widths.get(en.target) === w) return;
    widths.set(en.target, w);
    if (section && ["functions", "days"].includes(section.dataset.id) && !tables.has(section.dataset.id)) drawWidget(section);
  }));

  function render() {
    resizer.disconnect();
    grid.innerHTML = state.layout.map(widgetHtml).join("") || '<p class="db-empty db-empty-grid">Your dashboard is empty. Choose <strong>Customise</strong>, then <strong>Add widget</strong>.</p>';
    $$(".dw", grid).forEach((s) => {
      drawWidget(s);
      resizer.observe($(".dw-body", s));
    });
    grid.classList.toggle("is-editing", editing);
  }

  function renderPeriod() {
    $("#db-period").innerHTML = PERIODS.map((p) => `<button type="button" data-period="${p}" aria-pressed="${p === state.period}">Last ${p} months</button>`).join("");
    const list = months(state.period);
    $("#db-range").textContent = `${monthName(list[0])} to ${monthName(list[list.length - 1])}`;
  }

  /* ---------- Customise: move, resize, remove, add ---------- */

  const live = (msg) => { $("#db-live").textContent = msg; };
  const titleOf = (id) => WIDGETS[id].title;
  const syncLayoutFromDom = () => {
    const sizes = Object.fromEntries(state.layout.map((w) => [w.id, w.size]));
    state.layout = $$(".dw", grid).map((s) => ({ id: s.dataset.id, size: sizes[s.dataset.id] }));
    save();
  };

  // Slides the other widgets to their new places instead of jumping.
  function flip(mutate) {
    const items = $$(".dw", grid);
    const before = new Map(items.map((el) => [el, el.getBoundingClientRect()]));
    mutate();
    if (reducedMotion()) return;
    items.forEach((el) => {
      const a = before.get(el);
      const b = el.getBoundingClientRect();
      const dx = a.left - b.left;
      const dy = a.top - b.top;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 220, easing: "ease" });
    });
  }

  function setEditing(on) {
    editing = on;
    grid.classList.toggle("is-editing", on);
    $("#db-edit-bar").hidden = !on;
    $("#db-customise").hidden = on;
    $("#db-customise").setAttribute("aria-pressed", String(on));
    if (on) $("#db-add").focus();
    else $("#db-customise").focus();
  }

  function moveBy(section, step) {
    const list = $$(".dw", grid);
    const i = list.indexOf(section);
    const j = i + step;
    if (j < 0 || j >= list.length) return;
    flip(() => grid.insertBefore(section, step < 0 ? list[j] : list[j].nextSibling));
    $(".dw-grip", section).focus();
    syncLayoutFromDom();
    live(`${titleOf(section.dataset.id)} moved to position ${j + 1} of ${list.length}.`);
  }

  // Dragging by the handle: widgets swap places live as the pointer crosses them.
  let drag = null;
  grid.addEventListener("pointerdown", (e) => {
    const grip = e.target.closest(".dw-grip");
    if (!grip || !editing || e.button > 0) return;
    e.preventDefault();
    drag = { section: grip.closest(".dw"), grip, moved: false };
    drag.section.classList.add("is-dragging");
    grip.setPointerCapture(e.pointerId);
  });
  grid.addEventListener("pointermove", (e) => {
    if (!drag) return;
    if (e.clientY < 70) scrollBy(0, -14);
    else if (e.clientY > innerHeight - 70) scrollBy(0, 14);
    const over = document.elementsFromPoint(e.clientX, e.clientY).map((el) => el.closest && el.closest(".dw")).find((s) => s && s !== drag.section && grid.contains(s));
    if (!over) return;
    const r = over.getBoundingClientRect();
    const sideways = r.width < grid.clientWidth * 0.9;
    const before = sideways ? e.clientX < r.left + r.width / 2 : e.clientY < r.top + r.height / 2;
    const target = before ? over : over.nextSibling;
    if (target === drag.section || target === drag.section.nextSibling) return;
    flip(() => grid.insertBefore(drag.section, target));
    drag.moved = true;
  });
  function endDrag() {
    if (!drag) return;
    drag.section.classList.remove("is-dragging");
    if (drag.moved) {
      syncLayoutFromDom();
      const list = $$(".dw", grid);
      live(`${titleOf(drag.section.dataset.id)} moved to position ${list.indexOf(drag.section) + 1} of ${list.length}.`);
    }
    drag = null;
  }
  grid.addEventListener("pointerup", endDrag);
  grid.addEventListener("pointercancel", endDrag);

  grid.addEventListener("keydown", (e) => {
    const grip = e.target.closest(".dw-grip");
    if (!grip) return;
    const step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[e.key];
    if (step) {
      e.preventDefault();
      moveBy(grip.closest(".dw"), step);
    }
  });

  grid.addEventListener("click", (e) => {
    const section = e.target.closest(".dw");
    if (!section) return;
    const id = section.dataset.id;
    const sizeBtn = e.target.closest(".dw-size");
    if (sizeBtn) {
      const w = state.layout.find((x) => x.id === id);
      if (w.size === sizeBtn.dataset.size) return;
      w.size = sizeBtn.dataset.size;
      save();
      flip(() => { section.dataset.size = w.size; });
      $$(".dw-size", section).forEach((b) => b.setAttribute("aria-pressed", String(b === sizeBtn)));
      if (!["functions", "days"].includes(id)) drawWidget(section);
      live(`${titleOf(id)} is now ${SIZE_NAMES[w.size].toLowerCase()}.`);
      return;
    }
    if (e.target.closest(".dw-remove")) {
      const list = $$(".dw", grid);
      const next = list[list.indexOf(section) + 1] || list[list.indexOf(section) - 1];
      state.layout = state.layout.filter((x) => x.id !== id);
      save();
      flip(() => section.remove());
      if (!state.layout.length) render();
      (next ? $(".dw-grip", next) : $("#db-add")).focus();
      live(`${titleOf(id)} removed. You can add it back with Add widget.`);
      return;
    }
    if (e.target.closest("[data-table]")) {
      if (tables.has(id)) tables.delete(id);
      else tables.add(id);
      const btn = $("[data-table]", section);
      btn.setAttribute("aria-pressed", String(tables.has(id)));
      btn.textContent = tables.has(id) ? "Chart" : "Table";
      drawWidget(section);
      return;
    }
    // To-do list
    const del = e.target.closest("[data-del]");
    if (del) {
      state.todos.splice(Number(del.dataset.del), 1);
      save();
      drawWidget(section);
      const first = $("[data-todo]", section);
      (first || $("#db-todo-new")).focus();
      return;
    }
    if (e.target.closest("[data-clear-done]")) {
      state.todos = state.todos.filter((t) => !t.done);
      save();
      drawWidget(section);
      $("#db-todo-new").focus();
    }
  });

  grid.addEventListener("change", (e) => {
    const box = e.target.closest("[data-todo]");
    if (!box) return;
    state.todos[Number(box.dataset.todo)].done = box.checked;
    save();
    const section = box.closest(".dw");
    const i = box.dataset.todo;
    drawWidget(section);
    $(`[data-todo="${i}"]`, section).focus();
  });

  grid.addEventListener("submit", (e) => {
    if (!e.target.matches("[data-add-todo]")) return;
    e.preventDefault();
    const input = $("#db-todo-new");
    const text = input.value.trim();
    if (!text) return input.focus();
    state.todos.push({ text, done: false });
    save();
    drawWidget(e.target.closest(".dw"));
    $("#db-todo-new").focus();
    live(`Added: ${text}`);
  });

  // Add widget
  const box = $("#db-box");
  function openCatalogue() {
    const shown = new Set(state.layout.map((w) => w.id));
    const hidden = Object.keys(WIDGETS).filter((id) => !shown.has(id));
    $("#db-box-lead").textContent = hidden.length ? "Pick one to add to the end of your dashboard. You can move it from there." : "Every widget is already on your dashboard. Remove one to make room for a different view.";
    $("#db-catalogue").innerHTML = hidden.map((id) => `<li><div><p class="db-cat-title">${esc(WIDGETS[id].title)}</p><p class="db-cat-desc">${esc(WIDGETS[id].desc)}</p></div><button type="button" class="db-btn" data-add-widget="${id}" aria-label="Add ${esc(WIDGETS[id].title)}">Add</button></li>`).join("");
    box.showModal();
  }
  box.addEventListener("click", (e) => {
    if (e.target === box || e.target.closest("#db-box-close")) return box.close();
    const add = e.target.closest("[data-add-widget]");
    if (!add) return;
    const id = add.dataset.addWidget;
    const sizes = WIDGETS[id].sizes;
    state.layout.push({ id, size: sizes.includes("m") ? "m" : sizes[0] });
    save();
    box.close();
    render();
    const section = $(`.dw[data-id="${id}"]`, grid);
    section.scrollIntoView({ block: "nearest", behavior: reducedMotion() ? "auto" : "smooth" });
    $(".dw-grip", section).focus();
    live(`${titleOf(id)} added at the end.`);
  });

  /* ---------- Page wiring ---------- */

  $("#db-customise").addEventListener("click", () => setEditing(true));
  $("#db-done").addEventListener("click", () => setEditing(false));
  $("#db-add").addEventListener("click", openCatalogue);
  $("#db-reset").addEventListener("click", () => {
    state.layout = copy(DEFAULT_LAYOUT);
    save();
    render();
    live("Layout reset. Your to-do list is unchanged.");
  });
  $("#db-period").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-period]");
    if (!btn) return;
    state.period = Number(btn.dataset.period);
    save();
    renderPeriod();
    $$(".dw", grid).forEach(drawWidget);
    live(`Showing the last ${state.period} months.`);
  });
  document.addEventListener("click", (e) => { if (e.target.closest('a[href="#"]')) e.preventDefault(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drag) endDrag();
    if (e.key === "Escape" && editing && !box.open && !(e.target instanceof Element && e.target.closest(".db-chart"))) setEditing(false);
  });
  // Customer checklists follow My Bookings live, like the calendar does.
  addEventListener("storage", (e) => {
    if (e.key !== CHECKLIST_KEY) return;
    const s = $('.dw[data-id="checklists"]', grid);
    if (s) drawWidget(s);
  });

  const help = document.createElement("p");
  help.id = "db-move-help";
  help.className = "sr-only";
  help.textContent = "Drag to move, or use the arrow keys.";
  document.body.append(help);

  renderPeriod();
  render();
})();
