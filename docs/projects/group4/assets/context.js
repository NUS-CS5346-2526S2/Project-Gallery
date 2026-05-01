document.addEventListener("DOMContentLoaded", async () => {
  const { loadBenchmarkData } = window.SleepSignalsData;
  const {
    REGION_COLORS,
    renderBenchmarkScatter,
    renderBenchmarkBars,
    renderBenchmarkQuadrants,
    escapeHtml,
  } = window.SleepSignalsCharts;

  const METRICS = [
    { key: "insomnia_pct", label: "Insomnia prevalence (%)", summary: "Average sleep hours vs insomnia prevalence" },
    { key: "avg_sleep_hrs", label: "Average sleep hours", summary: "Countries ranked by average sleep hours" },
  ];

  const VIEW_MODES = [
    {
      key: "scatter",
      label: "Scatter",
      title: (metric) => metric.summary,
      copy: (selected, metric) =>
        `The selected country is ${selected.country}. Compare how its average sleep hours and ${metric.label.toLowerCase()} sit against the other visible benchmark records.`,
      footnote:
        "These benchmark values come from different studies and should be treated as comparative context rather than a strictly harmonized pooled dataset.",
    },
    {
      key: "ranked",
      label: "Ranked bars",
      title: (metric) => `${metric.label} across visible countries`,
      copy: (selected, metric) =>
        `${selected.country} stays highlighted, while the bars rank the visible benchmark records by ${metric.label.toLowerCase()}.`,
      footnote:
        "The ranking uses the currently visible benchmark records. Treat it as a descriptive comparison, not a pooled estimate.",
    },
    {
      key: "quadrants",
      label: "Pattern map",
      title: (metric) => `Pattern map for ${metric.label.toLowerCase()}`,
      copy: (selected, metric) =>
        `${selected.country} is grouped by whether it sits above or below the visible average for sleep hours and ${metric.label.toLowerCase()}.`,
      footnote:
        "Quadrant positions shift with the selected metric because the split is based on the visible averages, not a fixed threshold.",
    },
  ];

  const statsElement = document.getElementById("contextStats");
  const metricSelect = document.getElementById("contextMetric");
  const chartTitleElement = document.getElementById("contextChartTitle");
  const chartCopyElement = document.getElementById("contextChartCopy");
  const viewModesElement = document.getElementById("contextViewModes");
  const legendElement = document.getElementById("contextLegend");
  const chartElement = document.getElementById("contextChart");
  const footnoteElement = document.getElementById("contextFootnote");
  const detailElement = document.getElementById("contextDetail");
  const rankingTitleElement = document.getElementById("contextRankingTitle");
  const rankingElement = document.getElementById("contextRanking");

  const state = {
    rows: [],
    metricKey: "insomnia_pct",
    selectedCountry: "Bangladesh",
    viewMode: "scatter",
  };

  function rowsWithMetric(metric) {
    return state.rows.filter((row) => row[metric.key] != null);
  }

  function rowsForTwoAxisViews(metric) {
    return rowsWithMetric(metric).filter((row) => row.avg_sleep_hrs != null);
  }

  function isViewEnabled(modeKey, metric) {
    if (modeKey === "ranked") {
      return rowsWithMetric(metric).length > 0;
    }

    if (metric.key === "avg_sleep_hrs") {
      return false;
    }

    const comparableRows = rowsForTwoAxisViews(metric).length;
    if (modeKey === "scatter") return comparableRows >= 3;
    if (modeKey === "quadrants") return comparableRows >= 4;
    return true;
  }

  function buildRegionLegend() {
    legendElement.innerHTML = Object.entries(REGION_COLORS)
      .map(([region, color]) => {
        return `<span class="legend-item"><span class="legend-swatch" style="background:${color}"></span>${escapeHtml(region)}</span>`;
      })
      .join("");
  }

  function renderLegendForMode() {
    if (state.viewMode === "quadrants") {
      legendElement.innerHTML = `
        <span class="legend-item">Quadrants split countries by the visible averages for sleep and the selected burden metric.</span>
      `;
      return;
    }
    buildRegionLegend();
  }

  function renderViewModes(metric) {
    viewModesElement.innerHTML = VIEW_MODES.map((mode) => {
      const activeClass = mode.key === state.viewMode ? " active" : "";
      const isDisabled = !isViewEnabled(mode.key, metric);
      return `<button class="view-toggle${activeClass}" type="button" data-view-mode="${mode.key}"${isDisabled ? " disabled" : ""}>${mode.label}</button>`;
    }).join("");

    viewModesElement.querySelectorAll("[data-view-mode]:not([disabled])").forEach((button) => {
      button.addEventListener("click", () => {
        state.viewMode = button.dataset.viewMode;
        renderContext();
      });
    });
  }

  function renderRanking(rows, metric) {
    const rankable = rows.filter((row) => row[metric.key] != null);
    const descending = metric.key === "insomnia_pct";
    const sorted = [...rankable]
      .sort((a, b) => descending ? d3.descending(a[metric.key], b[metric.key]) : d3.ascending(a[metric.key], b[metric.key]))
      .slice(0, 5);
    rankingTitleElement.textContent = metric.key === "insomnia_pct" ? "Highest insomnia prevalence" : "Shortest average sleep";
    rankingElement.innerHTML = sorted
      .map((row, index) => {
        const value = metric.key === "avg_sleep_hrs" ? `${row[metric.key].toFixed(1)}h` : `${row[metric.key]}%`;
        const supportingMetric =
          metric.key === "avg_sleep_hrs"
            ? row.insomnia_pct != null
              ? `Insomnia prevalence: ${row.insomnia_pct}%`
              : "Insomnia prevalence unavailable"
            : row.avg_sleep_hrs != null
              ? `Average sleep: ${row.avg_sleep_hrs.toFixed(1)}h`
              : "Average sleep unavailable";
        const selectedClass = row.country === state.selectedCountry ? " selected" : "";
        return `
          <button class="context-rank-card${selectedClass}" type="button" data-country="${escapeHtml(row.country)}">
            <div class="context-rank-topline">
              <span class="context-rank-index">#${index + 1}</span>
              <span class="meta-pill">${escapeHtml(row.region)}</span>
            </div>
            <h4 class="context-rank-country">${escapeHtml(row.country)}</h4>
            <div class="context-rank-value">${value}</div>
            <p class="small-copy">${escapeHtml(supportingMetric)}</p>
            <p class="small-copy">${row.year}${row.n_students ? ` · n = ${row.n_students.toLocaleString()}` : ""}</p>
          </button>
        `;
      })
      .join("");

    rankingElement.querySelectorAll("[data-country]").forEach((button) => {
      button.addEventListener("click", () => {
        state.selectedCountry = button.dataset.country;
        renderContext();
      });
    });
  }

  function renderChart(rows, metric) {
    const commonOptions = {
      rows,
      yKey: metric.key,
      yLabel: metric.label,
      selectedCountry: state.selectedCountry,
      onSelect: (country) => {
        state.selectedCountry = country;
        renderContext();
      },
    };

    if (state.viewMode === "ranked") {
      renderBenchmarkBars(chartElement, commonOptions);
      return;
    }

    if (state.viewMode === "quadrants") {
      renderBenchmarkQuadrants(chartElement, commonOptions);
      return;
    }

    renderBenchmarkScatter(chartElement, commonOptions);
  }

  function renderContext() {
    const metric = METRICS.find((item) => item.key === state.metricKey);
    if (!isViewEnabled(state.viewMode, metric)) {
      state.viewMode = "ranked";
    }
    const rows = state.rows.filter((row) => {
      if (row[metric.key] == null) return false;
      if (state.viewMode === "ranked") return true;
      return row.avg_sleep_hrs != null;
    });
    renderViewModes(metric);

    if (!rows.length) {
      chartElement.innerHTML = `<div class="error-state">No benchmark records available.</div>`;
      detailElement.innerHTML = `<div class="error-state">No selected country available.</div>`;
      rankingElement.innerHTML = `<div class="error-state">No ranking available.</div>`;
      legendElement.innerHTML = "";
      return;
    }

    if (!rows.some((row) => row.country === state.selectedCountry)) {
      state.selectedCountry = rows.find((row) => row.is_primary)?.country || rows[0].country;
    }

    const selected = rows.find((row) => row.country === state.selectedCountry) || rows[0];
    const localReference = state.rows.find((row) => row.is_primary) || selected;
    const localDelta = selected[metric.key] != null && localReference[metric.key] != null
      ? selected[metric.key] - localReference[metric.key]
      : null;
    const localDirection = localDelta != null ? (localDelta >= 0 ? "higher" : "lower") : null;
    const viewMode = VIEW_MODES.find((mode) => mode.key === state.viewMode) || VIEW_MODES[0];

    chartTitleElement.textContent = viewMode.title(metric);
    chartCopyElement.textContent = viewMode.copy(selected, metric);
    footnoteElement.textContent = viewMode.footnote;
    renderLegendForMode();
    renderChart(rows, metric);

    detailElement.innerHTML = `
      <span class="section-kicker">Selected country</span>
      <h3>${escapeHtml(selected.country)}</h3>
      <p>${escapeHtml(selected.source)}</p>
      <div class="pill-row">
        <span class="meta-pill">${escapeHtml(selected.region)}</span>
        <span class="meta-pill">${selected.year}</span>
        ${selected.n_students ? `<span class="meta-pill">n = ${selected.n_students.toLocaleString()}</span>` : ""}
        ${selected.is_primary ? '<span class="scope-chip primary">primary dataset</span>' : ""}
      </div>
      ${selected.avg_sleep_hrs != null ? `<p class="small-copy"><strong>Average sleep:</strong> ${selected.avg_sleep_hrs} hours</p>` : ""}
      ${selected.insomnia_pct != null ? `<p class="small-copy"><strong>Insomnia prevalence:</strong> ${selected.insomnia_pct}%</p>` : ""}
      ${localDelta != null && !selected.is_primary ? `
      <p class="small-copy">
        <strong>Compared with ${escapeHtml(localReference.country)}:</strong>
        ${Math.abs(localDelta).toFixed(1)} ${metric.key === "avg_sleep_hrs" ? "hours" : "percentage points"}
        ${localDirection} on ${escapeHtml(metric.label.toLowerCase())}.
      </p>` : ""}
    `;

    renderRanking(rows, metric);
  }

  metricSelect.addEventListener("change", (event) => {
    state.metricKey = event.target.value;
    const metric = METRICS.find((item) => item.key === state.metricKey);
    if (!isViewEnabled(state.viewMode, metric)) {
      state.viewMode = "ranked";
    }
    renderContext();
  });

  window.addEventListener("resize", () => {
    if (state.rows.length) renderContext();
  });

  window.addEventListener("sleepSignals:themechange", () => {
    if (state.rows.length) renderContext();
  });

  try {
    state.rows = await loadBenchmarkData();

    METRICS.forEach((metric) => {
      const option = document.createElement("option");
      option.value = metric.key;
      option.textContent = metric.label;
      metricSelect.appendChild(option);
    });
    metricSelect.value = state.metricKey;

    statsElement.innerHTML = `
      <span class="section-kicker">Benchmark snapshot</span>
      <h2>Multiple datasets, one comparative lens.</h2>
      <p>
        The benchmark layer covers ${state.rows.length} country records drawn from named sources, with the local survey preserved as the primary reference point. Not every record reports every metric, so the visible comparison set changes by view.
      </p>
      <div class="stat-grid">
        <article class="stat-card">
          <div class="stat-label">Countries</div>
          <div class="stat-value">${state.rows.length}</div>
          <div class="stat-copy">Each record is paired with a cited source in the detail card.</div>
        </article>
        <article class="stat-card">
          <div class="stat-label">Primary benchmark</div>
          <div class="stat-value compact">Bangladesh</div>
          <div class="stat-copy">The local survey is still the main story source and remains highlighted.</div>
        </article>
        <article class="stat-card">
          <div class="stat-label">Interactivity</div>
          <div class="stat-value">Click + hover</div>
        </article>
      </div>
    `;

    renderContext();
  } catch (error) {
    const message = `<div class="error-state">${escapeHtml(error.message)}</div>`;
    statsElement.innerHTML = message;
    chartElement.innerHTML = message;
    detailElement.innerHTML = message;
    rankingElement.innerHTML = message;
  }
});
