const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const csvCell = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// Isang listahan ng sections na ginagamit ng CSV at ng PDF
const buildSections = (a) => {
  const s = a.summary || {};
  const p = a.patients || {};
  return [
    {
      title: "Summary",
      headers: ["Metric", "Value"],
      rows: [
        ["Total appointments", s.totalAppointments ?? 0],
        ["Completion rate (%)", s.completionRate ?? 0],
        ["Cancellation rate (%)", s.cancellationRate ?? 0],
        ["Total patients", p.totalPatients ?? 0],
        ["Returning patients", p.returningPatients ?? 0],
        ["One-time patients", p.oneTimePatients ?? 0],
        ["Returning rate (%)", p.returningRate ?? 0],
      ],
    },
    {
      title: "Appointments by status",
      headers: ["Status", "Count"],
      rows: Object.entries(s.byStatus || {}),
    },
    {
      title: "Appointments per month",
      headers: ["Month", "Total", "Completed", "Cancelled"],
      rows: (a.monthly || []).map((m) => [
        m.month,
        m.total,
        m.completed,
        m.cancelled,
      ]),
    },
    {
      title: "Appointments per year",
      headers: ["Year", "Total", "Completed", "Cancelled"],
      rows: (a.yearly || []).map((y) => [
        y.year,
        y.total,
        y.completed,
        y.cancelled,
      ]),
    },
    {
      title: "Busiest hours",
      headers: ["Hour", "Appointments"],
      rows: (a.busiestHours || []).map((h) => [h.label, h.count]),
    },
    {
      title: "Busiest days",
      headers: ["Day", "Appointments"],
      rows: (a.busiestDays || []).map((d) => [d.day, d.count]),
    },
    {
      title: "Patients per day of the week",
      headers: ["Day", "Patients"],
      rows: (a.patientsByDay || []).map((d) => [d.day, d.patients]),
    },
    {
      title: "Patients per month",
      headers: ["Month", "Patients"],
      rows: (a.patientsByMonth || []).map((m) => [m.month, m.patients]),
    },
    {
      title: "Most booked services",
      headers: ["Service", "Bookings", "Completed", "Revenue (PHP)"],
      rows: (a.topServices || []).map((t) => [
        t.name,
        t.bookings,
        t.completed,
        t.revenue,
      ]),
    },
    {
      title: "New patients per month",
      headers: ["Month", "New patients"],
      rows: (a.newPatients || []).map((n) => [n.month, n.count]),
    },
  ];
};

const stamp = (a) => {
  const d = a.generatedAt ? new Date(a.generatedAt) : new Date();
  return d.toISOString().slice(0, 10);
};

/** Download as .csv (opens in Excel) */
export const exportCSV = (analytics) => {
  const lines = [
    "Germino-Punzal Dental Clinic: Analytics Report",
    `Generated: ${new Date(analytics.generatedAt || Date.now()).toLocaleString("en-PH")}`,
    "",
  ];
  buildSections(analytics).forEach((sec) => {
    lines.push(csvCell(sec.title));
    lines.push(sec.headers.map(csvCell).join(","));
    sec.rows.forEach((r) => lines.push(r.map(csvCell).join(",")));
    lines.push("");
  });

  // \uFEFF para tama ang pagbasa ng Excel
  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `clinic-analytics-${stamp(analytics)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

/** Open a clean report page and print it (choose "Save as PDF") */
export const printReport = (analytics) => {
  const w = window.open("", "_blank");
  if (!w) {
    alert("Please allow pop-ups for this site to export the PDF.");
    return;
  }

  const tables = buildSections(analytics)
    .map(
      (sec) => `
      <section>
        <h2>${esc(sec.title)}</h2>
        ${
          sec.rows.length === 0
            ? "<p class='empty'>No data.</p>"
            : `<table>
                <thead><tr>${sec.headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>
                <tbody>${sec.rows
                  .map(
                    (r) =>
                      `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`,
                  )
                  .join("")}</tbody>
              </table>`
        }
      </section>`,
    )
    .join("");

  w.document.write(`<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Clinic Analytics ${esc(stamp(analytics))}</title>
      <style>
        body { font-family: Arial, sans-serif; color: #0f172a; margin: 32px; }
        h1 { font-size: 22px; margin: 0 0 4px; color: #1d4ed8; }
        .meta { color: #64748b; font-size: 12px; margin-bottom: 20px; }
        section { margin-bottom: 18px; break-inside: avoid; }
        h2 { font-size: 14px; margin: 0 0 6px; }
        table { border-collapse: collapse; width: 100%; font-size: 12px; }
        th, td { border: 1px solid #cbd5e1; padding: 5px 8px; text-align: left; }
        th { background: #eff6ff; }
        .empty { color: #64748b; font-size: 12px; }
      </style>
    </head>
    <body>
      <h1>Germino-Punzal Dental Clinic: Analytics Report</h1>
      <p class="meta">Computed with PySpark. Last updated ${esc(
        new Date(analytics.generatedAt || Date.now()).toLocaleString("en-PH"),
      )}</p>
      ${tables}
    </body>
  </html>`);
  w.document.close();
  setTimeout(() => {
    w.focus();
    w.print();
  }, 300);
};
