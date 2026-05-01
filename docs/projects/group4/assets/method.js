document.addEventListener("DOMContentLoaded", async () => {
  const {
    FACTORS,
    OUTCOMES,
    loadSurveyData,
    loadBenchmarkData,
    profileCounts,
    computeHeadlineStats,
  } = window.SleepSignalsData;
  const { renderBarList } = window.SleepSignalsCharts;

  const methodStatsElement = document.getElementById("methodStats");
  const dataSourceElement = document.getElementById("dataSourceGrid");
  const benchmarkRegionProfileElement = document.getElementById("benchmarkRegionProfile");
  const yearProfileElement = document.getElementById("yearProfile");
  const genderProfileElement = document.getElementById("genderProfile");
  const performanceProfileElement = document.getElementById("performanceProfile");
  const deadlineProfileElement = document.getElementById("deadlineProfile");
  const glossaryElement = document.getElementById("glossaryGrid");

  try {
    const [rows, benchmarkRows] = await Promise.all([
      loadSurveyData(),
      loadBenchmarkData().catch(() => []),
    ]);
    const stats = computeHeadlineStats(rows);
    const profiles = profileCounts(rows);
    const regionCount = new Set(benchmarkRows.map((row) => row.region)).size;

    methodStatsElement.innerHTML = `
      <span class="section-kicker">Dataset snapshot</span>
      <h2>What this sample can support, and what it cannot.</h2>
      <p>
        The core survey is useful for comparing ordinal patterns across habits, sleep signals, and outcomes.
        It is paired with country-level benchmark records for broader geographic context.
      </p>
      <div class="stat-grid" style="grid-template-columns: repeat(auto-fill, minmax(180px, 1fr))">
        ${stats
          .map((item) => {
            return `
              <article class="stat-card">
                <div class="stat-label">${item.label}</div>
                <div class="stat-value">${item.value}</div>
                <div class="stat-copy">${item.copy}</div>
              </article>
            `;
          })
          .join("")}
        <article class="stat-card">
          <div class="stat-label">Benchmark coverage</div>
          <div class="stat-value">${benchmarkRows.length}</div>
          <div class="stat-copy">${regionCount} regions represented across the benchmark records.</div>
        </article>
      </div>
      <p class="hero-note">
        Year-of-study and gender distributions are both skewed. Keep these imbalances in mind when reading the charts.
        Benchmark records come from different studies, and not every record reports every metric, so they should be read as comparative context rather than a pooled dataset.
      </p>
    `;

    if (benchmarkRows.length) {
      const regionCounts = [...new Set(benchmarkRows.map((row) => row.region))]
        .map((region) => ({
          label: region,
          count: benchmarkRows.filter((row) => row.region === region).length,
        }))
        .sort((left, right) => d3.descending(left.count, right.count))
        .map((entry) => ({
          ...entry,
          pct: entry.count / benchmarkRows.length,
        }));

      dataSourceElement.innerHTML = `
        <span class="section-kicker">Source overview</span>
        <h3 class="panel-title">Survey and benchmark records</h3>
        <div class="bar-list">
          <div class="bar-row">
            <div class="bar-topline">
              <span>Primary survey</span>
              <span>996 responses</span>
            </div>
            <p class="small-copy">
              Used for the ranked factors, student view, and educator heatmap. This remains the main analytic source.
            </p>
          </div>
          <div class="bar-row">
            <div class="bar-topline">
              <span>Benchmark layer</span>
              <span>${benchmarkRows.length} country records</span>
            </div>
            <p class="small-copy">
              Used only for comparative context. These records come from different studies, do not all report the same metrics, and are not treated as one pooled harmonized sample.
            </p>
          </div>
        </div>
      `;
      renderBarList(benchmarkRegionProfileElement, regionCounts, "#d59a52", "#d59a52");
    } else {
      dataSourceElement.innerHTML = `
        <span class="section-kicker">Source overview</span>
        <h3 class="panel-title">Primary survey loaded</h3>
        <p class="small-copy">
          The survey layer is available, but the benchmark layer was not loaded in this run.
        </p>
      `;
      benchmarkRegionProfileElement.innerHTML = `<div class="error-state">Benchmark coverage is unavailable.</div>`;
    }

    renderBarList(yearProfileElement, profiles.year, "#4c7a9f", "#4c7a9f");
    renderBarList(genderProfileElement, profiles.gender, "#4c7a9f", "#4c7a9f");
    renderBarList(performanceProfileElement, profiles.performance, "#b85a3d", "#b85a3d");
    renderBarList(deadlineProfileElement, profiles.deadlines, "#b85a3d", "#b85a3d");

    const glossaryItems = [
      ...FACTORS.map((factor) => ({
        name: factor.label,
        type: factor.scope === "primary" ? "Primary factor" : "Context factor",
        prompt: factor.question,
        scale: `${factor.order[0]} → ${factor.order[factor.order.length - 1]}`,
      })),
      ...OUTCOMES.map((outcome) => ({
        name: outcome.label,
        type: "Outcome",
        prompt: outcome.question,
        scale: `${outcome.order[0]} → ${outcome.order[outcome.order.length - 1]}`,
      })),
    ];

    glossaryElement.innerHTML = glossaryItems
      .map((item) => {
        return `
          <article class="glossary-card">
            <div class="chip-row">
              <span class="chip">${item.type}</span>
            </div>
            <h3>${item.name}</h3>
            <p>${item.prompt}</p>
            <p class="small-copy"><strong>Ordered scale:</strong> ${item.scale}</p>
          </article>
        `;
      })
      .join("");
  } catch (error) {
    const message = `<div class="error-state">${window.SleepSignalsCharts.escapeHtml(error.message)}</div>`;
    methodStatsElement.innerHTML = message;
    dataSourceElement.innerHTML = message;
    benchmarkRegionProfileElement.innerHTML = message;
    yearProfileElement.innerHTML = message;
    genderProfileElement.innerHTML = message;
    performanceProfileElement.innerHTML = message;
    deadlineProfileElement.innerHTML = message;
    glossaryElement.innerHTML = message;
  }
});
