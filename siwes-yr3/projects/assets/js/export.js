const MODAL_ID = "shared-export-modal";
const STYLE_ID = "shared-export-styles";

function injectExportStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = ``;

  document.head.appendChild(style);
}

function getOrCreateModal() {
  injectExportStyles();

  let modal = document.getElementById(MODAL_ID);
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = MODAL_ID;
  modal.className = "export-overlay";
  modal.innerHTML = `
    <div class="export-modal" role="dialog" aria-modal="true" aria-labelledby="export-modal-title">
      <div class="export-modal-head">
        <div>
          <h2 class="export-modal-title" id="export-modal-title">Export</h2>
          <p class="export-modal-sub" id="export-modal-sub">Choose a format for this report.</p>
        </div>
        <button class="export-close" type="button" data-export-close aria-label="Close export modal">&times;</button>
      </div>
      <div class="export-modal-body">
        <button class="export-option is-new" type="button" disabled>
          <span>
            <span class="export-option-title">Export as PDF</span>
            <span class="export-option-sub">Export student record as PDF file directly into your device</span>
          </span>
          <span class="export-option-tag"></span>
        </button>
        <button class="export-option soon" type="button" disabled>
          <span>
            <span class="export-option-title">Export as DOC</span>
            <span class="export-option-sub">Export student record as a word DOCX file directly into your device</span>
          </span>
          <span class="export-option-tag"></span>
        </button>

        <div class="export-error" id="export-modal-error"></div>

        <div class="export-modal-actions">
          <button class="export-btn secondary" type="button" data-export-close>Cancel</button>
          <button class="export-btn primary" type="button" id="export-modal-submit">Export PDF</button>
        </div>
      </div>
    </div>
  `;

  modal.addEventListener("click", (event) => {
    if (event.target === modal || event.target.closest("[data-export-close]")) {
      closeExportModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("show")) {
      closeExportModal();
    }
  });

  document.body.appendChild(modal);
  return modal;
}

function setExportError(message) {
  const modal = getOrCreateModal();
  const error = modal.querySelector("#export-modal-error");
  error.textContent = message || "";
  error.classList.toggle("show", Boolean(message));
}

function closeExportModal() {
  const modal = document.getElementById(MODAL_ID);
  if (!modal) return;

  modal.classList.remove("show");
  setExportError("");
}

function exportPdf(config) {
  const rows = config.getRows();

  if (!rows.length) {
    setExportError(config.emptyMessage || "There is no data to export yet.");
    return;
  }

  if (!window.jspdf || !window.jspdf.jsPDF) {
    setExportError("PDF tools are not available. Check the jsPDF links.");
    return;
  }

  const doc = new window.jspdf.jsPDF({
    orientation: config.orientation || "portrait",
    unit: "pt",
    format: "a4",
  });

  const marginX = 40;
  const title = config.title || "Export";
  const summary = typeof config.summary === "function" ? config.summary() : [];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text(title, marginX, 44);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, marginX, 62);

  let tableStartY = 84;

  if (summary.length) {
    doc.autoTable({
      startY: 78,
      margin: { left: marginX, right: marginX },
      body: summary,
      theme: "plain",
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 2,
        textColor: 60,
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 110 },
      },
    });

    tableStartY = doc.lastAutoTable.finalY + 16;
  }

  doc.autoTable({
    startY: tableStartY,
    head: [config.columns],
    body: rows,
    margin: { left: marginX, right: marginX },
    theme: "grid",
    headStyles: {
      fillColor: config.accentColor || [99, 102, 241],
      textColor: 255,
      fontStyle: "bold",
    },
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 7,
      overflow: "linebreak",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  doc.save(config.fileName || "export.pdf");
  closeExportModal();
}

export function setupPdfExport(config) {
  const trigger =
    typeof config.trigger === "string"
      ? document.querySelector(config.trigger)
      : config.trigger;

  if (!trigger) return;

  trigger.addEventListener("click", () => {
    const modal = getOrCreateModal();

    modal.querySelector("#export-modal-title").textContent =
      config.modalTitle || "Export";
    modal.querySelector("#export-modal-sub").textContent =
      config.modalDescription || "Choose a format for this report.";
    modal.querySelector("#export-modal-submit").onclick = () =>
      exportPdf(config);

    setExportError("");
    modal.classList.add("show");
  });
}
