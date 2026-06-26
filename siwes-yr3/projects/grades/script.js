

import { setupPdfExport } from "../assets/js/export.js";

const STORAGE_KEY = "srps_v1";
const THEME_KEY = "srps_theme";
const nameEl = document.getElementById("inp-name");

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
    // document.getElementById("stat-pass-rate").textContent = "—";
    return;
  }

  const top = students.reduce((a, b) => (b.score > a.score ? b : a));
  const passed = students.filter((s) => isPassing(s.score)).length;

  document.getElementById("stat-top-score").textContent = top.score;
  document.getElementById("stat-top-name").textContent = top.name;
  // document.getElementById("stat-pass-rate").textContent =
  //   `${Math.round((passed / total) * 100)}%`;
}

/* ── Add student ── */
function addStudent() {
  const scoreEl = document.getElementById("inp-score");
  const errEl = document.getElementById("error-msg");

  const name = nameEl.value.trim();
  const score = parseFloat(scoreEl.value);

  // This RegEx expression that checks if name contains actual numbers or any special charcters and triggers if so
  if (/[^a-zA-Z\s]/.test(name)) {
    errEl.textContent = "Name can only contain letters and spaces.";
    errEl.classList.add("show");
    nameEl.classList.add("error-inp");
    // Add extra visual weight
    return;
  }

  if (!name || isNaN(score) || score < 0 || score > 100) {
    errEl.textContent =
      "Please enter a valid name and a score between 0 and 100.";
    errEl.classList.add("show");
    return;
  }

  errEl.classList.remove("show");
  nameEl.classList.remove("error-inp");

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
document.getElementById("inp-name").addEventListener("input", () => {
  nameEl.classList.remove("error-inp");
  console.log("type input fired");
});

setupPdfExport({
  trigger: "#btn-export",
  modalTitle: "Export student results",
  modalDescription: "Download the added student results as a PDF report.",
  title: "Student Result Processing",
  fileName: "student-results.pdf",
  emptyMessage: "No student records to export. Add at least one student first.",
  columns: ["#", "Name", "Score", "Grade", "Status"],
  getRows: () =>
    load().map((student, index) => [
      index + 1,
      student.name,
      student.score,
      getGrade(student.score),
      isPassing(student.score) ? "Pass" : "Fail",
    ]),
  summary: () => {
    const students = load();
    const total = students.length;
    const passed = students.filter((student) =>
      isPassing(student.score),
    ).length;
    const failed = total - passed;
    const top = students.reduce(
      (best, student) => (student.score > best.score ? student : best),
      { name: "None", score: 0 },
    );

    return [
      ["Total Students", String(total)],
      ["Highest Score", total ? `${top.name} - ${top.score}` : "None"],
      ["Passed", String(passed)],
      ["Failed", String(failed)],
      ["Pass Benchmark", "Score 50+"],
    ];
  },
});

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const isDark = saved ? saved === "dark" : false;
  applyTheme(isDark);
}

function applyTheme(isDark) {
  if (isDark) {
    document.body.classList.add("dark-theme");
    localStorage.setItem(THEME_KEY, "dark");
  } else {
    document.body.classList.remove("dark-theme");
    localStorage.setItem(THEME_KEY, "light");
  }
  updateThemeIcon();
}

function updateThemeIcon() {
  const btn = document.getElementById("theme-toggle");
  const icon = btn.querySelector("[data-lucide]");
  const isDark = document.body.classList.contains("dark-theme");
  icon.setAttribute("data-lucide", isDark ? "sun" : "moon");
  lucide.createIcons();
}

document.getElementById("theme-toggle").addEventListener("click", () => {
  const isDark = document.body.classList.contains("dark-theme");
  applyTheme(!isDark);
});

/* ── Init ── */
initTheme();
render();
