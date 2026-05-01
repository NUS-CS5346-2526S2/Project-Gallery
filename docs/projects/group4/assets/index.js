document.addEventListener("DOMContentLoaded", async () => {
  const statsElement = document.getElementById("heroStats");
  const findingsElement = document.getElementById("findingGrid");

  try {
    const [rows, benchmarkRows] = await Promise.all([
      window.SleepSignalsData.loadSurveyData(),
      window.SleepSignalsData.loadBenchmarkData(),
    ]);
    const stats = window.SleepSignalsData.computeHeadlineStats(rows);
    const findings = window.SleepSignalsData.computeStoryFindings(rows);
    const regions = new Set(benchmarkRows.map((row) => row.region)).size;
    const displayStats = [
      ...stats,
      {
        label: "Benchmark countries",
        value: benchmarkRows.length.toLocaleString(),
        copy: `${regions} regions provide comparative context beyond the local survey.`,
      },
    ];

    statsElement.innerHTML = displayStats
      .map((item) => {
        return `
          <article class="stat-card">
            <div class="stat-label">${item.label}</div>
            <div class="stat-value">${item.value}</div>
            <div class="stat-copy">${item.copy}</div>
          </article>
        `;
      })
      .join("");

    findingsElement.innerHTML = findings
      .map((finding) => {
        return `
          <article class="finding-card">
            <div class="chip-row">
              <span class="chip">${finding.chip}</span>
            </div>
            <div class="metric">${finding.metric}</div>
            <h3>${finding.title}</h3>
            <p>${finding.body}</p>
          </article>
        `;
      })
      .join("");
  } catch (error) {
    const message = window.SleepSignalsCharts.escapeHtml(error.message);
    statsElement.innerHTML = `<div class="error-state">${message}</div>`;
    findingsElement.innerHTML = `<div class="error-state">${message}</div>`;
  }
});
