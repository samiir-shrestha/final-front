// ── PDF Report Generator ──────────────────────────────────
// Generates a print-ready HTML report and triggers browser print-to-PDF
// No external library needed — works in all browsers

export function downloadReport(item, userName = "") {
  const date = new Date().toLocaleDateString("en-GB", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>AgriPulse Report - ${item.fertilizer}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a2a1e; background: #fff; }

    .page { max-width: 700px; margin: 0 auto; padding: 40px 48px; }

    /* Header */
    .header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 20px; border-bottom: 3px solid #1a3a2a; margin-bottom: 28px; }
    .brand { display: flex; align-items: center; gap: 10px; }
    .brand-dot { width: 32px; height: 32px; background: #2d6a4f; border-radius: 50%; }
    .brand-name { font-size: 22px; font-weight: 800; color: #1a3a2a; letter-spacing: -0.5px; }
    .brand-name span { color: #52b788; }
    .report-meta { text-align: right; }
    .report-meta p { font-size: 11px; color: #5a7a64; line-height: 1.6; }
    .report-meta strong { color: #1a3a2a; }

    /* Section title */
    .section-title { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #5a7a64; margin-bottom: 12px; }

    /* Recommendation hero */
    .rec-hero { background: #1a3a2a; border-radius: 14px; padding: 24px 28px; margin-bottom: 20px; color: white; }
    .rec-hero .fert-label { font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(183,228,199,0.6); margin-bottom: 4px; }
    .rec-hero h1 { font-size: 34px; font-weight: 800; color: #f0c040; margin-bottom: 4px; }
    .rec-hero .sub { font-size: 13px; color: rgba(183,228,199,0.7); margin-bottom: 16px; }
    .dosage-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .dosage-box { background: rgba(255,255,255,0.08); border-radius: 10px; padding: 12px 14px; }
    .dosage-box .dlabel { font-size: 9px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(183,228,199,0.5); margin-bottom: 3px; }
    .dosage-box .dval { font-size: 22px; font-weight: 800; color: white; }
    .dosage-box .dunit { font-size: 11px; font-weight: 400; color: rgba(255,255,255,0.4); margin-left: 3px; }

    /* Basis */
    .basis-box { background: #f0faf4; border: 1px solid #c8e6d0; border-radius: 10px; padding: 12px 16px; margin-bottom: 20px; display: flex; gap: 10px; }
    .basis-box .icon { font-size: 14px; margin-top: 1px; flex-shrink: 0; }
    .basis-box p { font-size: 11.5px; color: #2d6a4f; line-height: 1.6; }

    /* Two-col layout */
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .card { background: #f9fdf9; border: 1px solid #c8e6d0; border-radius: 12px; padding: 16px; }
    .card .section-title { margin-bottom: 10px; }

    /* Info rows */
    .info-row { display: flex; justify-content: space-between; align-items: baseline; padding: 5px 0; border-bottom: 1px solid #e8f4ee; }
    .info-row:last-child { border-bottom: none; }
    .info-row .key { font-size: 11px; color: #5a7a64; }
    .info-row .val { font-size: 12px; font-weight: 700; color: #1a3a2a; }

    /* NPK bars */
    .npk-row { margin-bottom: 8px; }
    .npk-row:last-child { margin-bottom: 0; }
    .npk-top { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .npk-top .key { font-size: 10px; font-weight: 700; color: #5a7a64; text-transform: uppercase; }
    .npk-top .val { font-size: 11px; font-weight: 700; color: #1a3a2a; }
    .bar-bg { height: 5px; background: #d4edda; border-radius: 3px; overflow: hidden; }
    .bar-fill { height: 100%; background: linear-gradient(90deg, #2d6a4f, #52b788); border-radius: 3px; }

    /* Weather */
    .weather-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
    .w-box { background: #f0f8ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 10px; text-align: center; }
    .w-box .wicon { font-size: 18px; margin-bottom: 4px; }
    .w-box .wval { font-size: 14px; font-weight: 800; color: #1d4ed8; }
    .w-box .wlabel { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #93c5fd; margin-top: 2px; }

    /* Footer */
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #c8e6d0; display: flex; justify-content: space-between; align-items: center; }
    .footer p { font-size: 10px; color: #5a7a64; line-height: 1.6; }
    .footer .source { font-size: 9px; color: #9ab8a0; }

    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .page { padding: 20px 30px; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="brand">
      <div class="brand-dot"></div>
      <div class="brand-name">Agri<span>Pulse</span></div>
    </div>
    <div class="report-meta">
      <p><strong>Fertilizer Recommendation Report</strong></p>
      <p>Generated: ${date}</p>
      ${userName ? `<p>Farmer: <strong>${userName}</strong></p>` : ""}
      <p>Location: <strong>${item.lat || "—"}, ${item.lon || "—"}</strong></p>
    </div>
  </div>

  <!-- Recommendation hero -->
  <div class="rec-hero">
    <p class="fert-label">Recommended Fertilizer</p>
    <h1>${item.fertilizer}</h1>
    <p class="sub">${item.crop || "—"} &nbsp;·&nbsp; ${item.crop_growth_stage || "—"} Stage &nbsp;·&nbsp; ${item.season || "—"}</p>
    <div class="dosage-grid">
      <div class="dosage-box">
        <p class="dlabel">Dosage (Ropani)</p>
        <p class="dval">${item.dosage_ropani}<span class="dunit">kg/ropani</span></p>
      </div>
      <div class="dosage-box">
        <p class="dlabel">Dosage (Hectare)</p>
        <p class="dval">${item.dosage_ha}<span class="dunit">kg/ha</span></p>
      </div>
    </div>
  </div>

  <!-- Basis -->
  <div class="basis-box">
    <span class="icon">📋</span>
    <p>${item.basis || "—"}</p>
  </div>

  <!-- Dates + Location -->
  <div class="two-col">
    <div class="card">
      <p class="section-title">Application Details</p>
      <div class="info-row"><span class="key">Planned Date</span><span class="val">${item.application_date || "—"}</span></div>
      <div class="info-row"><span class="key">Saved On</span><span class="val">${item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}</span></div>
      <div class="info-row"><span class="key">Irrigation</span><span class="val">${item.irrigation_type || "—"}</span></div>
    </div>
    ${item.weather ? `
    <div class="card">
      <p class="section-title">Weather Conditions</p>
      <div class="weather-grid">
        <div class="w-box"><div class="wicon">🌡️</div><div class="wval">${Math.round(item.weather.Temperature)}°C</div><div class="wlabel">Temp</div></div>
        <div class="w-box"><div class="wicon">💧</div><div class="wval">${Math.round(item.weather.Humidity)}%</div><div class="wlabel">Humidity</div></div>
        <div class="w-box"><div class="wicon">🌧️</div><div class="wval">${Math.round(item.weather.Rainfall)}mm</div><div class="wlabel">Rainfall</div></div>
      </div>
    </div>` : ""}
  </div>

  <!-- Soil -->
  ${item.soil ? `
  <div class="card" style="margin-bottom:20px">
    <p class="section-title">Soil Analysis · ${item.soil.Soil_Type}</p>
    ${[
      { key: "Soil pH",         val: item.soil.Soil_pH,           max: 14  },
      { key: "Nitrogen (N)",    val: item.soil.Nitrogen_Level,    max: 200 },
      { key: "Phosphorus (P)",  val: item.soil.Phosphorus_Level,  max: 200 },
      { key: "Potassium (K)",   val: item.soil.Potassium_Level,   max: 200 },
    ].map(({ key, val, max }) => `
    <div class="npk-row">
      <div class="npk-top"><span class="key">${key}</span><span class="val">${val}</span></div>
      <div class="bar-bg"><div class="bar-fill" style="width:${Math.min((parseFloat(val)/max)*100,100)}%"></div></div>
    </div>`).join("")}
  </div>` : ""}

  <!-- Footer -->
  <div class="footer">
    <div>
      <p>AgriPulse &nbsp;·&nbsp; Tribhuvan University &nbsp;·&nbsp; Madan Bhandari Memorial College</p>
      <p class="source">Dosage source: FAO Fertilizer and Plant Nutrition Bulletin 16 (2006); ICAR Package of Practices</p>
    </div>
    <p style="font-size:11px;color:#2d6a4f;font-weight:700;">agripulse.vercel.app</p>
  </div>

</div>
</body>
</html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 500);
}

// ── All recommendations report ────────────────────────────
export function downloadAllReport(history, userName = "") {
  const date = new Date().toLocaleDateString("en-GB", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const rows = history.map((item, i) => `
    <tr style="background:${i % 2 === 0 ? "#f9fdf9" : "#fff"}">
      <td>${i + 1}</td>
      <td><strong>${item.crop}</strong></td>
      <td>${item.fertilizer}</td>
      <td>${item.crop_growth_stage}</td>
      <td>${item.season}</td>
      <td>${item.dosage_ropani} kg/ropani</td>
      <td>${item.dosage_ha} kg/ha</td>
      <td>${item.application_date || "—"}</td>
      <td>${item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>AgriPulse — All Recommendations</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Segoe UI',Arial,sans-serif; color:#1a2a1e; background:#fff; }
    .page { max-width: 900px; margin: 0 auto; padding: 36px 40px; }
    .header { display:flex; align-items:center; justify-content:space-between; padding-bottom:16px; border-bottom:3px solid #1a3a2a; margin-bottom:24px; }
    .brand-name { font-size:22px; font-weight:800; color:#1a3a2a; }
    .brand-name span { color:#52b788; }
    .meta { text-align:right; font-size:11px; color:#5a7a64; line-height:1.6; }
    .meta strong { color:#1a3a2a; }
    h2 { font-size:16px; font-weight:700; color:#1a3a2a; margin-bottom:4px; }
    .sub { font-size:11px; color:#5a7a64; margin-bottom:20px; }
    table { width:100%; border-collapse:collapse; font-size:11.5px; }
    thead tr { background:#1a3a2a; color:white; }
    thead th { padding:10px 10px; text-align:left; font-weight:600; font-size:10px; letter-spacing:0.06em; text-transform:uppercase; }
    tbody td { padding:9px 10px; border-bottom:1px solid #e8f4ee; color:#1a2a1e; }
    .footer { margin-top:28px; padding-top:14px; border-top:1px solid #c8e6d0; display:flex; justify-content:space-between; }
    .footer p { font-size:10px; color:#5a7a64; }
    @media print { body { print-color-adjust:exact; -webkit-print-color-adjust:exact; } }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="brand-name">Agri<span>Pulse</span></div>
    <div class="meta">
      <p><strong>Complete Recommendation History</strong></p>
      <p>Generated: ${date}</p>
      ${userName ? `<p>Farmer: <strong>${userName}</strong></p>` : ""}
      <p>Total Records: <strong>${history.length}</strong></p>
    </div>
  </div>
  <h2>All Fertilizer Recommendations</h2>
  <p class="sub">Full history of recommendations generated by AgriPulse</p>
  <table>
    <thead>
      <tr>
        <th>#</th><th>Crop</th><th>Fertilizer</th><th>Stage</th>
        <th>Season</th><th>Dosage (Ropani)</th><th>Dosage (Ha)</th>
        <th>App. Date</th><th>Saved On</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">
    <p>AgriPulse · Tribhuvan University · Madan Bhandari Memorial College</p>
    <p>Dosage: FAO Bulletin 16 (2006); ICAR Package of Practices</p>
  </div>
</div>
</body>
</html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 500);
}