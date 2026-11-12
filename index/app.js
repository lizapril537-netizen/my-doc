const $ = id => document.getElementById(id);
const load = (k, f) => { try { return JSON.parse(localStorage.getItem(k)) ?? f; } catch { return f; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const pad = n => String(n).padStart(2, '0');
const dateKey = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const MONTHS_SHORT = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
const WEEKDAYS = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

// Навигация
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    $('page-' + btn.dataset.page).classList.add('active');
  });
});

// Задачи по датам
const getTasks = () => load('tasks', {});
const saveTasks = t => save('tasks', t);

function renderTaskList(container, dateStr) {
  const tasks = getTasks()[dateStr] || [];
  container.innerHTML = '';
  tasks.forEach((task, i) => {
    const div = document.createElement('div');
    div.className = 'task' + (task.done ? ' done' : '');
    div.innerHTML = `<input type="checkbox" ${task.done ? 'checked' : ''}><span>${task.text}</span><button title="Удалить">✕</button>`;
    div.querySelector('input').addEventListener('change', e => {
      const all = getTasks();
      all[dateStr][i].done = e.target.checked;
      saveTasks(all); renderAll();
    });
    div.querySelector('button').addEventListener('click', () => {
      const all = getTasks();
      all[dateStr].splice(i, 1);
      if (!all[dateStr].length) delete all[dateStr];
      saveTasks(all); renderAll();
    });
    container.appendChild(div);
  });
}

function addTaskForm(container, dateStr) {
  const form = document.createElement('div');
  form.className = 'task-form';
  form.innerHTML = `<input placeholder="+ дело"><button>OK</button>`;
  const input = form.querySelector('input');
  const add = () => {
    const text = input.value.trim();
    if (!text) return;
    const all = getTasks();
    (all[dateStr] = all[dateStr] || []).push({ text, done: false });
    saveTasks(all); renderAll();
  };
  form.querySelector('button').addEventListener('click', add);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') add(); });
  container.appendChild(form);
}

// Неделя
let weekOffset = 0;
function getWeekStart(offset) {
  const d = new Date();
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day + offset * 7);
  d.setHours(0,0,0,0);
  return d;
}
function renderWeek() {
  const start = getWeekStart(weekOffset);
  const end = new Date(start); end.setDate(end.getDate() + 6);
  $('weekLabel').textContent = `${start.getDate()} ${MONTHS_SHORT[start.getMonth()]} — ${end.getDate()} ${MONTHS_SHORT[end.getMonth()]} ${end.getFullYear()}`;
  const grid = $('weekGrid'); grid.innerHTML = '';
  const today = dateKey(new Date());
  for (let i = 0; i < 7; i++) {
    const d = new Date(start); d.setDate(d.getDate() + i);
    const key = dateKey(d);
    const cell = document.createElement('div');
    cell.className = 'week-day' + (key === today ? ' today' : '');
    cell.innerHTML = `<h3>${WEEKDAYS[i]}, ${d.getDate()}</h3>`;
    const list = document.createElement('div'); list.className = 'task-list';
    cell.appendChild(list);
    renderTaskList(list, key);
    addTaskForm(cell, key);
    grid.appendChild(cell);
  }
}
$('weekPrev').onclick = () => { weekOffset--; renderWeek(); };
$('weekNext').onclick = () => { weekOffset++; renderWeek(); };

// Месяц
let monthOffset = 0, selectedDay = null;
function renderMonth() {
  const base = new Date(); base.setDate(1); base.setMonth(base.getMonth() + monthOffset);
  const year = base.getFullYear(), month = base.getMonth();
  $('monthLabel').textContent = `${MONTHS[month]} ${year}`;
  const grid = $('monthGrid'); grid.innerHTML = '';
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = dateKey(new Date());
  const tasks = getTasks();
  for (let i = 0; i < firstDay; i++) grid.appendChild(document.createElement('div'));
  for (let day = 1; day <= daysInMonth; day++) {
    const key = dateKey(new Date(year, month, day));
    const cell = document.createElement('div');
    cell.className = 'month-cell' + (key === today ? ' today' : '') + (key === selectedDay ? ' selected' : '');
    const hasTasks = (tasks[key] || []).length > 0;
    cell.innerHTML = `<div class="num">${day}</div>` + (hasTasks ? '<div class="dot"></div>' : '');
    cell.addEventListener('click', () => { selectedDay = key; renderMonth(); });
    grid.appendChild(cell);
  }
  renderMonthDay();
}
function renderMonthDay() {
  const container = $('monthDayTasks'); container.innerHTML = '';
  if (!selectedDay) {
    container.innerHTML = '<p style="color:#888;font-size:0.9rem">Выбери день в календаре</p>';
    return;
  }
  const d = new Date(selectedDay + 'T00:00:00');
  const h = document.createElement('h3');
  h.textContent = `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  h.style.marginBottom = '8px';
  container.appendChild(h);
  const list = document.createElement('div'); list.className = 'task-list';
  container.appendChild(list);
  renderTaskList(list, selectedDay);
  addTaskForm(container, selectedDay);
}
$('monthPrev').onclick = () => { monthOffset--; renderMonth(); };
$('monthNext').onclick = () => { monthOffset++; renderMonth(); };

// Год
let yearOffset = 0;
function renderYear() {
  const year = new Date().getFullYear() + yearOffset;
  $('yearLabel').textContent = year;
  const grid = $('yearGrid'); grid.innerHTML = '';
  const tasks = getTasks();
  for (let m = 0; m < 12; m++) {
    const card = document.createElement('div'); card.className = 'year-month';
    let count = 0; const prefix = `${year}-${pad(m+1)}`;
    Object.keys(tasks).forEach(k => { if (k.startsWith(prefix)) count += tasks[k].length; });
    card.innerHTML = `<h3>${MONTHS[m]}</h3><p style="font-size:0.85rem;color:#666">Дел: ${count}</p>`;
    grid.appendChild(card);
  }
}
$('yearPrev').onclick = () => { yearOffset--; renderYear(); };
$('yearNext').onclick = () => { yearOffset++; renderYear(); };

// Привычки
const getHabits = () => load('habits', []);
const saveHabits = h => save('habits', h);
function renderHabits() {
  const list = $('habitList'); list.innerHTML = '';
  const habits = getHabits();
  if (!habits.length) { list.innerHTML = '<p style="color:#888">Пока нет привычек</p>'; return; }
  const today = new Date(); const days = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(today); d.setDate(d.getDate() - i); days.push(d); }
  habits.forEach((habit, hi) => {
    const card = document.createElement('div'); card.className = 'habit-card';
    card.innerHTML = `<h4>${habit.name} <button data-del="${hi}">✕</button></h4>`;
    const row = document.createElement('div'); row.className = 'habit-days';
    days.forEach(d => {
      const key = dateKey(d);
      const done = (habit.days || []).includes(key);
      const btn = document.createElement('button');
      btn.className = 'habit-day' + (done ? ' done' : '');
      btn.textContent = WEEKDAYS[(d.getDay()+6)%7];
      btn.title = key;
      btn.addEventListener('click', () => {
        habit.days = habit.days || [];
        if (habit.days.includes(key)) habit.days = habit.days.filter(x => x !== key);
        else habit.days.push(key);
        saveHabits(habits); renderHabits();
      });
      row.appendChild(btn);
    });
    card.appendChild(row); list.appendChild(card);
  });
  list.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      const h = getHabits(); h.splice(+btn.dataset.del, 1); saveHabits(h); renderHabits();
    });
  });
}
$('addHabit').onclick = () => {
  const input = $('habitInput'); const name = input.value.trim(); if (!name) return;
  const habits = getHabits(); habits.push({ name, days: [] }); saveHabits(habits);
  input.value = ''; renderHabits();
};

// Предметы
const getSubjects = () => load('subjects', []);
const saveSubjects = s => save('subjects', s);
function renderSubjects() {
  const list = $('subjectList'); list.innerHTML = '';
  const subjects = getSubjects();
  if (!subjects.length) { list.innerHTML = '<p style="color:#888">Пока нет предметов</p>'; return; }
  subjects.forEach((subj, si) => {
    const card = document.createElement('div'); card.className = 'subject-card';
    card.innerHTML = `<h4>${subj.name} <button data-del-subj="${si}">✕</button></h4>`;
    const taskList = document.createElement('div'); taskList.className = 'task-list';
    (subj.tasks || []).forEach((task, ti) => {
      const div = document.createElement('div');
      div.className = 'task' + (task.done ? ' done' : '');
      div.innerHTML = `<input type="checkbox" ${task.done ? 'checked' : ''}><span>${task.text}</span><button>✕</button>`;
      div.querySelector('input').addEventListener('change', e => {
        const s = getSubjects(); s[si].tasks[ti].done = e.target.checked; saveSubjects(s); renderSubjects();
      });
      div.querySelector('button').addEventListener('click', () => {
        const s = getSubjects(); s[si].tasks.splice(ti, 1); saveSubjects(s); renderSubjects();
      });
      taskList.appendChild(div);
    });
    card.appendChild(taskList);
    const form = document.createElement('div'); form.className = 'task-form';
    form.innerHTML = `<input placeholder="+ задание"><button>OK</button>`;
    form.querySelector('button').addEventListener('click', () => {
      const text = form.querySelector('input').value.trim(); if (!text) return;
      const s = getSubjects(); s[si].tasks = s[si].tasks || []; s[si].tasks.push({ text, done: false });
      saveSubjects(s); renderSubjects();
    });
    card.appendChild(form); list.appendChild(card);
  });
  list.querySelectorAll('[data-del-subj]').forEach(btn => {
    btn.addEventListener('click', () => {
      const s = getSubjects(); s.splice(+btn.dataset.delSubj, 1); saveSubjects(s); renderSubjects();
    });
  });
}
$('addSubject').onclick = () => {
  const input = $('subjectInput'); const name = input.value.trim(); if (!name) return;
  const subs = getSubjects(); subs.push({ name, tasks: [] }); saveSubjects(subs);
  input.value = ''; renderSubjects();
};

// Экспорт / Импорт
$('exportBtn').onclick = () => {
  const data = {
    tasks: getTasks(),
    habits: getHabits(),
    subjects: getSubjects()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `planner-backup-${dateKey(new Date())}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
$('importInput').addEventListener('change', e => {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (data.tasks) saveTasks(data.tasks);
      if (data.habits) saveHabits(data.habits);
      if (data.subjects) saveSubjects(data.subjects);
      renderAll();
      alert('Данные загружены!');
    } catch { alert('Ошибка: файл повреждён'); }
  };
  reader.readAsText(file);
  e.target.value = '';
});

// Рендер всего
function renderAll() {
  renderWeek(); renderMonth(); renderYear(); renderHabits(); renderSubjects();
}
renderAll();
