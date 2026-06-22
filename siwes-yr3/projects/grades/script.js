const STORAGE_KEY = "srps_v1";

/* ── Grading logic ── */
function getGrade(score) {
  if (score >= 70) return "A";
  if (score >= 60) return "B";
  if (score >= 50) return "C";
  if (score >= 45) return "D";
  return "F";
}

function isPassing(score) {
  return score >= 50;
}

/* ── Storage ── */
function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/* ── Render ── */
function render() {
  const students = load();
  const tbody = document.getElementById("results-body");
  const table = document.getElementById("results-table");
  const empty = document.getElementById("empty-state");
  const total = students.length;

  /* toggle empty state vs table */
  if (total === 0) {
    empty.style.display = "block";
    table.style.display = "none";
  } else {
    empty.style.display = "none";
    table.style.display = "table";
  }

  /* rebuild rows */
  tbody.innerHTML = "";
  students.forEach((s, i) => {
    const grade = getGrade(s.score);
    const pass = isPassing(s.score);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="num">${i + 1}</td>
      <td class="name">${esc(s.name)}</td>
      <td>${s.score}</td>
      <td><span class="grade-badge">${grade}</span></td>
      <td><span class="status-badge ${pass ? "pass" : "fail"}">${pass ? "✓ Pass" : "✗ Fail"}</span></td>
    `;
    tbody.appendChild(tr);
  });

  /* update stats */
  document.getElementById("stat-total").textContent = total;
  document.getElementById("count-pill").textContent =
    `${total} student${total !== 1 ? "s" : ""}`;

  if (total === 0) {
    document.getElementById("stat-top-score").textContent = "—";
    document.getElementById("stat-top-name").textContent = "No entries yet";
    document.getElementById("stat-pass-rate").textContent = "—";
    return;
  }

  const top = students.reduce((a, b) => (b.score > a.score ? b : a));
  const passed = students.filter((s) => isPassing(s.score)).length;

  document.getElementById("stat-top-score").textContent = top.score;
  document.getElementById("stat-top-name").textContent = top.name;
  document.getElementById("stat-pass-rate").textContent =
    `${Math.round((passed / total) * 100)}%`;
}

/* ── Add student ── */
function addStudent() {
  const nameEl = document.getElementById("inp-name");
  const scoreEl = document.getElementById("inp-score");
  const errEl = document.getElementById("error-msg");

  const name = nameEl.value.trim();
  const score = parseFloat(scoreEl.value);

  // This RegEx expression that checks if name contains actual numbers or any special charcters and triggers if so
  if (/[^a-zA-Z\s]/.test(name)) {
    errEl.textContent = "Name can only contain letters and spaces.";
    errEl.classList.add("show");
    return;
  }
  
  if (
    !name ||
    isNaN(score) ||
    score < 0 ||
    score > 100
  ) {
    errEl.textContent =
      "Please enter a valid name and a score between 0 and 100.";
    errEl.classList.add("show");
    return;
  }

  errEl.classList.remove("show");

  const students = load();
  students.push({ name, score: Math.round(score) });
  save(students);

  nameEl.value = "";
  scoreEl.value = "";
  nameEl.focus();

  render();
}

/* ── Clear all ── */
function clearAll() {
  const students = load();
  if (students.length === 0) return;
  if (!confirm("Clear all student records?")) return;
  save([]);
  render();
}

/* ── XSS safety ── */
function esc(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

/* ── Events ── */
document.getElementById("btn-add").addEventListener("click", addStudent);
document.getElementById("btn-clear").addEventListener("click", clearAll);

document.getElementById("inp-score").addEventListener("keydown", (e) => {
  if (e.key === "Enter") addStudent();
});
document.getElementById("inp-name").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("inp-score").focus();
});

/* ── Init ── */
render();
