// script.js - lógica da agenda (vertical/mobile-first)
// Mantive a lógica anterior (validações, agrupamento, persistência).
// Apenas garanto que o DOM esteja pronto e os elementos existam.

document.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('agenda-date');
  const newBtn = document.getElementById('new-appointment');
  const dialog = document.getElementById('modal-dialog');
  const modalClose = document.getElementById('modal-close');
  const cancelBtn = document.getElementById('cancel');
  const form = document.getElementById('appointment-form');

  const inputTutor = document.getElementById('tutor');
  const inputPet = document.getElementById('pet');
  const inputPhone = document.getElementById('phone');
  const inputService = document.getElementById('service');
  const inputDate = document.getElementById('date');
  const inputTime = document.getElementById('time');

  const listManha = document.getElementById('list-manha');
  const listTarde = document.getElementById('list-tarde');
  const listNoite = document.getElementById('list-noite');

  if (!dateInput || !newBtn || !dialog || !modalClose || !form || !inputTutor || !inputDate || !inputTime) {
    console.error('Elementos essenciais do DOM não encontrados. Verifique os ids no HTML.');
    return;
  }

  const SESSIONS = {
    manha: { from: '06:00', to: '11:59' },
    tarde: { from: '12:00', to: '17:59' },
    noite: { from: '18:00', to: '23:59' }
  };
  const STORAGE_KEY = 'agenda_appts_v1';

  function todayISO() {
    const d = new Date();
    const tz = d.getTimezoneOffset() * 60000;
    const local = new Date(d - tz);
    return local.toISOString().slice(0, 10);
  }
  function loadAll() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch (e) { console.error('Erro ao ler storage', e); return {}; }
  }
  function saveAll(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch(e) { console.error('Erro ao salvar storage', e); }
  }
  function timeToMinutes(t) { if (!t) return null; const [hh, mm] = t.split(':').map(Number); return hh * 60 + mm; }
  function getSectionForTime(time) {
    const m = timeToMinutes(time); if (m === null) return null;
    for (const key of Object.keys(SESSIONS)) {
      const s = SESSIONS[key];
      if (m >= timeToMinutes(s.from) && m <= timeToMinutes(s.to)) return key;
    }
    return null;
  }
  function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

  function clearLists() {
    listManha.innerHTML = '';
    listTarde.innerHTML = '';
    listNoite.innerHTML = '';
  }

  function createApptElement(appt, dateKey) {
    const el = document.createElement('div');
    el.className = 'appointment';
    el.dataset.id = appt.id;

    const left = document.createElement('div');
    left.className = 'appt-left';
    const time = document.createElement('div');
    time.className = 'appt-time';
    time.textContent = appt.time;
    const details = document.createElement('div');
    details.className = 'appt-details';
    const pet = document.createElement('div');
    pet.className = 'pet';
    pet.textContent = appt.pet;
    const tutor = document.createElement('div');
    tutor.className = 'tutor';
    tutor.textContent = appt.tutor;
    const service = document.createElement('div');
    service.className = 'appt-service';
    service.textContent = appt.service;

    details.appendChild(pet);
    details.appendChild(tutor);
    details.appendChild(service);
    left.appendChild(time);
    left.appendChild(details);

    const actions = document.createElement('div');
    actions.className = 'appt-actions';
    const del = document.createElement('button');
    del.className = 'btn-delete';
    del.type = 'button';
    del.textContent = 'Remover';
    del.addEventListener('click', () => {
      // confirmação simples
      if (confirm('Remover este agendamento?')) {
        removeAppointmentById(dateKey, appt.id);
      }
    });
    actions.appendChild(del);

    el.appendChild(left);
    el.appendChild(actions);
    return el;
  }

  function renderForDate(dateKey) {
    clearLists();
    const all = loadAll();
    const appts = all[dateKey] ? [...all[dateKey]] : [];
    appts.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
    const sections = { manha: [], tarde: [], noite: [] };
    appts.forEach(a => {
      const s = getSectionForTime(a.time);
      if (s) sections[s].push(a);
    });

    function appendList(key, container) {
      if (sections[key].length === 0) {
        const p = document.createElement('div');
        p.className = 'small';
        p.textContent = 'Nenhum agendamento';
        container.appendChild(p);
        return;
      }
      sections[key].forEach(item => container.appendChild(createApptElement(item, dateKey)));
    }

    appendList('manha', listManha);
    appendList('tarde', listTarde);
    appendList('noite', listNoite);
  }

  function addAppointment(dateKey, appt) {
    const all = loadAll();
    const arr = all[dateKey] || [];
    if (arr.some(a => a.time === appt.time)) {
      throw new Error('Já existe um agendamento para esse horário na data selecionada.');
    }
    if (!getSectionForTime(appt.time)) {
      throw new Error('Horário fora das janelas válidas.');
    }
    appt.id = genId();
    arr.push(appt);
    all[dateKey] = arr;
    saveAll(all);
    return appt.id;
  }

  function removeAppointmentById(dateKey, id) {
    const all = loadAll();
    if (!all[dateKey]) return;
    const idx = all[dateKey].findIndex(a => a.id === id);
    if (idx === -1) return;
    all[dateKey].splice(idx, 1);
    saveAll(all);
    renderForDate(dateKey);
  }

  function showError(forField, msg) {
    const el = form.querySelector(`.error[data-for="${forField}"]`);
    if (el) el.textContent = msg || '';
  }
  function clearErrors() { Array.from(form.querySelectorAll('.error')).forEach(e => e.textContent = ''); }

  function validateForm(values) {
    clearErrors();
    let ok = true;
    if (!values.tutor.trim()) { showError('tutor', 'Informe o nome do tutor.'); ok = false; }
    if (!values.pet.trim()) { showError('pet', 'Informe o nome do pet.'); ok = false; }
    if (!values.phone.trim()) { showError('phone', 'Informe um telefone.'); ok = false; } else {
      const digits = values.phone.replace(/\D/g, '');
      if (digits.length < 8) { showError('phone', 'Telefone inválido.'); ok = false; }
    }
    if (!values.service.trim()) { showError('service', 'Descreva o serviço.'); ok = false; }
    if (!values.date) { showError('date', 'Escolha uma data.'); ok = false; }
    if (!values.time) { showError('time', 'Escolha uma hora.'); ok = false; } else {
      if (!getSectionForTime(values.time)) { showError('time', 'Hora fora das janelas válidas.'); ok = false; }
    }
    return ok;
  }

  // Modal controls
  function openModal(initialDate) {
    try {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    } catch (e) { dialog.setAttribute('open', ''); }

    inputDate.value = initialDate || dateInput.value || todayISO();
    if (!inputTime.value) inputTime.value = '09:00';

    setTimeout(() => { try { inputTutor.focus(); } catch (e) {} }, 40);
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    try {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    } catch (e) { dialog.removeAttribute('open'); }
    document.body.style.overflow = '';
    form.reset();
    clearErrors();
  }

  newBtn.addEventListener('click', () => openModal());
  modalClose.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && (dialog.open || dialog.hasAttribute('open'))) {
      closeModal();
    }
  });

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const values = {
      tutor: inputTutor.value || '',
      pet: inputPet.value || '',
      phone: inputPhone.value || '',
      service: inputService.value || '',
      date: inputDate.value || '',
      time: inputTime.value || ''
    };
    if (!validateForm(values)) return;
    try {
      addAppointment(values.date, {
        tutor: values.tutor.trim(),
        pet: values.pet.trim(),
        phone: values.phone.trim(),
        service: values.service.trim(),
        time: values.time
      });
    } catch (err) {
      showError('time', err.message || 'Erro ao agendar');
      return;
    }
    if (dateInput.value === values.date) renderForDate(values.date);
    closeModal();
  });

  dateInput.addEventListener('change', () => renderForDate(dateInput.value));

  // init
  (function init() {
    const d = todayISO();
    dateInput.value = d;
    inputDate.value = d;
    renderForDate(d);
  })();

  // expose debug
  window._agenda = { loadAll, saveAll, renderForDate, addAppointment, removeAppointmentById, getSectionForTime };
});