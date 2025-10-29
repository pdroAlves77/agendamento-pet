// Store/local mock com regras + mini datepicker e timepicker
const STORAGE_KEY = "agendaStoreV1";

const PERIODS = [
  { key: "morning", name: "Manhã", start: "09:00", end: "12:00", rangeLabel: "09h-12h" },
  { key: "afternoon", name: "Tarde", start: "13:00", end: "18:00", rangeLabel: "13h-18h" },
  { key: "night", name: "Noite", start: "19:00", end: "21:00", rangeLabel: "19h-21h" }
];

// Horários extras solicitados (bordas pós-faixa)
const EXTRA_SLOTS = {
  morning: ["12:00","12:15","12:30","12:45"],
  afternoon: ["18:00","18:15","18:30","18:45"],
  night: ["21:00","21:15","21:30","21:45"]
};

function loadStore() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; } }
function saveStore(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
function ensureDate(store, dateISO) { if (!store[dateISO]) store[dateISO] = []; return store; }

function hhmmToMinutes(hhmm) { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; }
function minutesToHHMM(min){ const h = Math.floor(min/60), m = min%60; return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`; }
function sortByTimeAsc(items) { return items.sort((a, b) => hhmmToMinutes(a.time) - hhmmToMinutes(b.time)); }

function formatISOToBR(iso) { const [y, m, d] = iso.split("-"); return `${d}/${m}/${y}`; }
function todayISO() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// Semente demo
function seedIfEmpty(store) {
  const demoDate = "2024-01-10";
  if (!store[demoDate]) {
    store[demoDate] = [
      { id: crypto.randomUUID(), time: "09:00", pet: "Thor", owner: "Fernanda Costa", phone: "", service: "Vacinação" },
      { id: crypto.randomUUID(), time: "13:00", pet: "Mel", owner: "João Souza", phone: "", service: "Corte de Unhas" },
      { id: crypto.randomUUID(), time: "14:00", pet: "Bella", owner: "Pedro Martins", phone: "", service: "Aplicação de Anti-pulgas" },
      { id: crypto.randomUUID(), time: "15:00", pet: "Simba", owner: "Juliana Rocha", phone: "", service: "Tosa Higiênica" },
      { id: crypto.randomUUID(), time: "20:00", pet: "Max", owner: "Camila Santos", phone: "", service: "Limpeza de Dentes" }
    ];
  }
  return store;
}

/* ---------- Geração dos horários permitidos (com extras) ---------- */
function generateSlots(step = 15){
  const groups = PERIODS.map(p=>{
    // base: [start, end) exclusivo → gera até 11:45 / 17:45 / 20:45
    const startMin = hhmmToMinutes(p.start);
    const endMin = hhmmToMinutes(p.end);
    const times = [];
    for (let t = startMin; t < endMin; t += step) {
      times.push(minutesToHHMM(t));
    }
    // adiciona horários extras de borda solicitados
    const extra = EXTRA_SLOTS[p.key] || [];
    return { key: p.key, name: p.name, times: [...times, ...extra] };
  });
  return groups;
}

// Conjunto canônico de horários válidos por período e total
const ALLOWED_TIMES = (() => {
  const map = { morning: new Set(), afternoon: new Set(), night: new Set() };
  const groups = generateSlots(15);
  for (const g of groups) for (const t of g.times) map[g.key].add(t);
  return {
    periods: map,
    allSet: new Set([...map.morning, ...map.afternoon, ...map.night]),
    allList: groups.flatMap(g => g.times)
  };
})();

// Agora a verificação e classificação passam a usar os conjuntos
function isTimeAllowed(time) { return ALLOWED_TIMES.allSet.has(time); }
function periodByTime(time) {
  if (ALLOWED_TIMES.periods.morning.has(time)) return "morning";
  if (ALLOWED_TIMES.periods.afternoon.has(time)) return "afternoon";
  if (ALLOWED_TIMES.periods.night.has(time)) return "night";
  return null;
}

/* ---------- Render UI ---------- */
function toVerticalTime(time){
  const [hh, mm] = time.split(":");
  return `
    <div class="stack" role="text" aria-label="${time}">
      <span>${hh}</span>
      <span>${mm[0]}</span>
      <span>${mm[1]}</span>
    </div>
  `;
}

function createAppointmentRow(dateISO, item){
  const row = document.createElement("div");
  row.className = "appointment";
  row.innerHTML = `
    <div class="time-vertical">${toVerticalTime(item.time)}</div>
    <div class="client">
      <div class="line-main">${item.pet} <span class="sep">/ ${item.owner}</span></div>
      <div class="line-sub">${item.time}</div>
    </div>
    <div class="service">${item.service}</div>
    <button class="remove" type="button">Remover agendamento</button>
  `;
  row.querySelector(".remove").addEventListener("click", () => {
    const store = loadStore();
    store[dateISO] = (store[dateISO] || []).filter(x => x.id !== item.id);
    saveStore(store);
    render(dateISO);
  });
  return row;
}

function render(dateISO){
  const selectedDateText = document.getElementById("selectedDateText");
  if (selectedDateText) selectedDateText.textContent = formatISOToBR(dateISO);

  const container = document.getElementById("periods");
  container.innerHTML = "";

  const store = loadStore();
  const items = sortByTimeAsc([...(store[dateISO] || [])]);

  const grouped = { morning: [], afternoon: [], night: [] };
  items.forEach(it => {
    const key = periodByTime(it.time);
    if (key) grouped[key].push(it);
  });

  PERIODS.forEach(p => {
    const card = document.createElement("article");
    card.className = `period-card period--${p.key}`;

    const head = document.createElement("div");
    head.className = "period-head";
    head.innerHTML = `
      <div class="period-left">
        <span class="bullet" aria-hidden="true"></span>
        <span>${p.name}</span>
      </div>
      <div class="period-range">${p.rangeLabel}</div>
    `;

    const list = document.createElement("div");
    list.className = "appointments";
    grouped[p.key].forEach(it => list.appendChild(createAppointmentRow(dateISO, it)));

    card.appendChild(head);
    card.appendChild(list);
    container.appendChild(card);
  });
}

/* ---------- Mini Datepicker reutilizável ---------- */
const monthNames = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
const weekShortMonFirst = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];

function firstDateOfGrid(year, month){
  const first = new Date(year, month, 1);
  const day = first.getDay(); // 0 Dom...6 Sáb
  const offset = (day - 1 + 7) % 7; // desloca para segunda
  const gridStart = new Date(year, month, 1 - offset);
  gridStart.setHours(0,0,0,0);
  return gridStart;
}
function toISO(date){
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,"0");
  const d = String(date.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
}

function attachDatePicker({ wrapperEl, buttonEl, dropdownEl, getDate, setDate, onSelect }){
  let open = false, year = 0, month = 0;
  function openPicker(){
    if (open) return;
    const d = new Date(getDate());
    if (Number.isNaN(d.getTime())) { const t = new Date(); year = t.getFullYear(); month = t.getMonth(); }
    else { year = d.getFullYear(); month = d.getMonth(); }
    renderPicker();
    dropdownEl.classList.add("open");
    buttonEl.setAttribute("aria-expanded","true");
    open = true;
  }
  function closePicker(){ if (!open) return; dropdownEl.classList.remove("open"); buttonEl.setAttribute("aria-expanded","false"); open = false; }
  function addMonths(delta){ month += delta; while (month < 0){ month+=12; year--; } while (month > 11){ month-=12; year++; } renderPicker(); }
  function renderPicker(){
    const title = `${monthNames[month]} ${year}`;
    const start = firstDateOfGrid(year, month);
    const today = todayISO();
    const selected = getDate();

    const head = `
      <div class="dp-head">
        <button class="dp-nav" data-nav="-1" aria-label="Mês anterior">‹</button>
        <div class="dp-title">${title}</div>
        <button class="dp-nav" data-nav="1" aria-label="Próximo mês">›</button>
      </div>
    `;
    const week = `<div class="dp-week">${weekShortMonFirst.map(d=>`<div>${d}</div>`).join("")}</div>`;

    const cells = [];
    for (let i=0;i<42;i++){
      const dt = new Date(start); dt.setDate(start.getDate()+i);
      const iso = toISO(dt);
      const isOther = dt.getMonth() !== month;
      const isToday = iso === today;
      const isSelected = iso === selected;
      cells.push(`
        <button class="dp-day ${isOther?"is-other":""} ${isToday?"is-today":""} ${isSelected?"is-selected":""}"
                data-date="${iso}" aria-label="${formatISOToBR(iso)}" aria-current="${isToday?'date':'false'}">
          ${dt.getDate()}
        </button>
      `);
    }
    const grid = `<div class="dp-grid">${cells.join("")}</div>`;
    const foot = `
      <div class="dp-foot">
        <span>Hoje: ${formatISOToBR(today)}</span>
        <button class="dp-nav" data-today="1" title="Ir para hoje">●</button>
      </div>
    `;
    dropdownEl.innerHTML = head + week + grid + foot;

    dropdownEl.querySelectorAll("[data-nav]").forEach(btn=>btn.addEventListener("click", e => addMonths(parseInt(e.currentTarget.dataset.nav,10))));
    dropdownEl.querySelectorAll(".dp-day").forEach(btn=>{
      btn.addEventListener("click", e => { const iso = e.currentTarget.dataset.date; setDate(iso); onSelect && onSelect(iso); closePicker(); });
    });
    dropdownEl.querySelector("[data-today]").addEventListener("click", ()=>{
      const t = new Date(); year = t.getFullYear(); month = t.getMonth();
      const iso = todayISO(); setDate(iso); onSelect && onSelect(iso); closePicker();
    });
  }
  buttonEl.addEventListener("click", (e)=>{ e.stopPropagation(); open ? closePicker() : openPicker(); });
  document.addEventListener("click", (e)=>{ if (!wrapperEl.contains(e.target)) closePicker(); });
  document.addEventListener("keydown", (e)=>{ if (e.key==="Escape") closePicker(); });
  return { open: openPicker, close: closePicker };
}

/* ---------- Mini Timepicker ---------- */
function attachTimePicker({ wrapperEl, buttonEl, dropdownEl, getDateISO, getValue, setValue, onSelect }){
  let open = false;

  function openPicker(){
    if (open) return;
    renderPicker();
    dropdownEl.classList.add("open");
    buttonEl.setAttribute("aria-expanded","true");
    open = true;
  }
  function closePicker(){ if (!open) return; dropdownEl.classList.remove("open"); buttonEl.setAttribute("aria-expanded","false"); open = false; }

  function renderPicker(){
    const dateISO = getDateISO();
    const store = loadStore();
    const taken = new Set((store[dateISO] || []).map(x => x.time));
    const current = getValue();

    const groups = PERIODS.map(p=>{
      const base = generateSlots(15).find(g => g.key === p.key).times; // inclui extras
      return { key: p.key, name: p.name, times: base };
    });

    const html = groups.map(g=>{
      const items = g.times.map(t=>{
        const disabled = taken.has(t);
        const selected = current === t;
        return `<button type="button" class="tp-item ${selected?"selected":""} ${disabled?"disabled":""}" data-time="${t}" ${disabled?"aria-disabled='true' tabindex='-1'":""}>${t}</button>`;
      }).join("");
      return `<div class="tp-group"><div class="tp-title">${g.name}</div><div class="tp-grid">${items}</div></div>`;
    }).join("");

    dropdownEl.innerHTML = html;

    dropdownEl.querySelectorAll(".tp-item").forEach(btn=>{
      if (btn.classList.contains("disabled")) return;
      btn.addEventListener("click", e=>{
        const t = e.currentTarget.dataset.time;
        setValue(t);
        onSelect && onSelect(t);
        closePicker();
      });
    });
  }

  buttonEl.addEventListener("click", (e)=>{ e.stopPropagation(); open ? closePicker() : openPicker(); });
  document.addEventListener("click", (e)=>{ if (!wrapperEl.contains(e.target)) closePicker(); });
  document.addEventListener("keydown", (e)=>{ if (e.key==="Escape") closePicker(); });

  return { open: openPicker, close: closePicker, rerender: renderPicker };
}

/* ---------- Modal e validações ---------- */
const modalEl = document.getElementById("appointmentModal");
const formEl = document.getElementById("appointmentForm");
const newBtn = document.getElementById("newAppointmentBtn");

let selectedDateISO = todayISO();
let lastFocusedEl = null;

function openModal() {
  lastFocusedEl = document.activeElement;
  formEl.reset();

  // Preenche data/hora iniciais
  setModalDate(selectedDateISO);
  suggestNextTime(); // define time e texto

  modalEl.classList.add("open");
  document.body.classList.add("modal-open");
  modalEl.setAttribute("aria-hidden", "false");

  document.getElementById("tutorName").focus();
  trapFocus(modalEl);
}
function closeModal() {
  modalEl.classList.remove("open");
  document.body.classList.remove("modal-open");
  modalEl.setAttribute("aria-hidden", "true");
  if (lastFocusedEl) lastFocusedEl.focus();
  releaseFocusTrap();
}

function trapFocus(root) {
  const focusables = Array.from(root.querySelectorAll("a, button, input, textarea, select, details,[tabindex]:not([tabindex='-1'])"));
  if (!focusables.length) return;
  function onKey(e){
    if (e.key === "Escape") { closeModal(); return; }
    if (e.key !== "Tab") return;
    const first = focusables[0], last = focusables[focusables.length-1];
    if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  }
  root.__trapHandler = onKey;
  root.addEventListener("keydown", onKey);
}
function releaseFocusTrap(){
  if (modalEl.__trapHandler){
    modalEl.removeEventListener("keydown", modalEl.__trapHandler);
    modalEl.__trapHandler = null;
  }
}
modalEl.addEventListener("click", (e)=>{ if (e.target.dataset.close === "true") closeModal(); });

function setError(name, msg) {
  const field = formEl.elements[name];
  const wrap = field ? field.closest(".field") : null;
  const error = formEl.querySelector(`[data-error-for="${name}"]`);
  if (wrap) wrap.classList.add("invalid");
  if (error) error.textContent = msg || "";
}
function clearError(name) {
  const field = formEl.elements[name];
  const wrap = field ? field.closest(".field") : null;
  const error = formEl.querySelector(`[data-error-for="${name}"]`);
  if (wrap) wrap.classList.remove("invalid");
  if (error) error.textContent = "";
}
function validateRequired(name, label) {
  const value = (formEl.elements[name].value || "").trim();
  if (!value) { setError(name, `Informe ${label}.`); return false; }
  clearError(name); return true;
}
function validatePhone() {
  const name = "phone";
  const value = formEl.elements[name].value.trim();
  const re = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;
  if (!value) { setError(name, "Informe o telefone."); return false; }
  if (!re.test(value)) { setError(name, "Telefone inválido. Use DDD e número (ex.: 11 91234-5678)."); return false; }
  clearError(name); return true;
}
function validateDate() {
  const name = "date";
  const v = formEl.elements[name].value;
  if (!v) { setError(name, "Informe a data."); return false; }
  clearError(name); return true;
}
function validateTime() {
  const name = "time";
  const v = formEl.elements[name].value;
  if (!v) { setError(name, "Informe a hora."); return false; }
  if (!/^\d{2}:\d{2}$/.test(v)) { setError(name, "Hora inválida."); return false; }
  if (!isTimeAllowed(v)) {
    setError(name, "Escolha horários válidos: 09:00–12:45, 13:00–18:45 ou 19:00–21:45.");
    return false;
  }
  clearError(name); return true;
}
function validateConflict(dateISO, time) {
  const store = loadStore();
  const list = store[dateISO] || [];
  const exists = list.some(x => x.time === time);
  if (exists) { setError("time", "Já existe agendamento neste horário para esta data."); return false; }
  clearError("time"); return true;
}

/* ---------- Helpers (data/hora) ---------- */
function setModalDate(iso){
  const hidden = document.getElementById("formDate");
  const text = document.getElementById("modalDateText");
  hidden.value = iso;
  text.textContent = formatISOToBR(iso);
}
function getModalDate(){ return document.getElementById("formDate").value || selectedDateISO; }

function setModalTime(hhmm){
  const hidden = document.getElementById("formTime");
  const text = document.getElementById("modalTimeText");
  hidden.value = hhmm;
  text.textContent = hhmm;
}

function suggestNextTime() {
  const dateISO = getModalDate();
  const store = loadStore();
  const taken = new Set((store[dateISO] || []).map(x => x.time));
  const all = ALLOWED_TIMES.allList;
  const free = all.find(s => !taken.has(s)) || "09:00";
  setModalTime(free);
}

/* ---------- Estado e pickers ---------- */
let selectedDatePicker, modalDatePicker, modalTimePicker;
selectedDateISO = todayISO();

/* ---------- Init ---------- */
function init() {
  let store = loadStore();
  store = seedIfEmpty(store);
  saveStore(store);

  selectedDateISO = store["2024-01-10"] ? "2024-01-10" : todayISO();
  render(selectedDateISO);

  // Datepicker do topo
  selectedDatePicker = attachDatePicker({
    wrapperEl: document.getElementById("topDateWrap"),
    buttonEl: document.getElementById("datePill"),
    dropdownEl: document.getElementById("datePicker"),
    getDate: ()=> selectedDateISO,
    setDate: (iso)=> { selectedDateISO = iso; },
    onSelect: (iso)=> { render(iso); }
  });

  // Abre modal
  newBtn.addEventListener("click", () => {
    setModalDate(selectedDateISO);
    suggestNextTime();
    openModal();
    if (modalTimePicker && modalTimePicker.rerender) modalTimePicker.rerender();
  });

  // Datepicker do modal
  modalDatePicker = attachDatePicker({
    wrapperEl: document.getElementById("modalDateWrap"),
    buttonEl: document.getElementById("modalDateBtn"),
    dropdownEl: document.getElementById("modalDatePicker"),
    getDate: getModalDate,
    setDate: (iso)=> { setModalDate(iso); },
    onSelect: ()=> { suggestNextTime(); clearError("date"); if (modalTimePicker?.rerender) modalTimePicker.rerender(); }
  });

  // Timepicker do modal (inclui horários extras)
  modalTimePicker = attachTimePicker({
    wrapperEl: document.getElementById("modalTimeWrap"),
    buttonEl: document.getElementById("modalTimeBtn"),
    dropdownEl: document.getElementById("modalTimePicker"),
    getDateISO: getModalDate,
    getValue: ()=> formEl.elements["time"].value || "",
    setValue: (val)=> setModalTime(val),
    onSelect: ()=> clearError("time")
  });

  // Submit
  formEl.addEventListener("submit", (e) => {
    e.preventDefault();
    const tutorOk = validateRequired("tutorName", "o nome do tutor");
    const petOk = validateRequired("petName", "o nome do pet");
    const phoneOk = validatePhone();
    const svcOk = validateRequired("service", "a descrição do serviço");
    const dateOk = validateDate();
    const timeOk = validateTime();
    if (!(tutorOk && petOk && phoneOk && svcOk && dateOk && timeOk)) return;

    const dateISO = formEl.elements["date"].value;
    const time = formEl.elements["time"].value;
    if (!validateConflict(dateISO, time)) return;

    const newItem = {
      id: crypto.randomUUID(),
      owner: formEl.elements["tutorName"].value.trim(),
      pet: formEl.elements["petName"].value.trim(),
      phone: formEl.elements["phone"].value.trim(),
      service: formEl.elements["service"].value.trim(),
      time
    };

    const store = loadStore();
    ensureDate(store, dateISO);
    store[dateISO].push(newItem);
    store[dateISO] = sortByTimeAsc(store[dateISO]);
    saveStore(store);

    if (dateISO === selectedDateISO) render(selectedDateISO);
    closeModal();
  });

  // Fechar modal com ESC (reforço)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalEl.classList.contains("open")) closeModal();
  });
}

document.addEventListener("DOMContentLoaded", init);