document.addEventListener("DOMContentLoaded", async () => {
  const {
    OUTCOMES,
    YEAR_ORDER,
    GENDER_ORDER,
    COLUMNS,
    SCOPED_FACTOR_KEYS,
    loadSurveyData,
    getOptions,
    filterRows,
    computeRanking,
    computeMatrix,
    getOutcome,
    summarizeShift,
    percentageString,
  } = window.SleepSignalsData;
  const {
    renderLegend,
    renderHeatmap,
    renderWorseShareChart,
    renderOutcomePathChart,
  } = window.SleepSignalsCharts;

  const VIEW_MODES = [
    {
      key: "heatmap",
      label: "Heatmap",
      title: (factor, outcome) => `${factor.label} × ${outcome.label}`,
      copy: (factor, outcome) =>
        `${factor.question} The heatmap uses row-normalized percentages so each factor level keeps its own outcome distribution visible.`,
      footnote:
        "Each row is normalized independently, so the point is to compare pattern shape across factor levels. Use the row totals on the right to keep sample size in view.",
    },
    {
      key: "risk",
      label: "Risk bars",
      title: (factor, outcome) => `${factor.label}: worse ${outcome.label.toLowerCase()} share`,
      copy: (factor, outcome) =>
        `${factor.question} This view compresses the two worst outcome levels into one bar, making the strongest risk gradient easier to compare across factor levels.`,
      footnote:
        "Each bar combines the two worst outcome levels for one factor level. The dashed line marks the visible average inside the filtered sample.",
    },
    {
      key: "paths",
      label: "Outcome paths",
      title: (factor, outcome) => `${factor.label}: outcome paths`,
      copy: (factor, outcome) =>
        `${factor.question} Each line tracks one outcome level across the factor order, which helps reveal whether the shift is steady or concentrated at one end.`,
      footnote:
        "All lines are row-normalized shares. Parallel lines imply stability, while widening gaps show where the distribution starts to polarize.",
    },
  ];

  const outcomeSelect = document.getElementById("educatorOutcome");
  const yearSelect = document.getElementById("educatorYear");
  const genderSelect = document.getElementById("educatorGender");
  const sampleElement = document.getElementById("educatorSample");
  const rhoElement = document.getElementById("educatorRho");
  const rankingElement = document.getElementById("rankingList");
  const chartTitleElement = document.getElementById("educatorChartTitle");
  const chartCopyElement = document.getElementById("educatorChartCopy");
  const viewModesElement = document.getElementById("educatorViewModes");
  const chartElement = document.getElementById("educatorChart");
  const legendElement = document.getElementById("educatorLegend");
  const footnoteElement = document.getElementById("educatorFootnote");
  const patternElement = document.getElementById("educatorPattern");

  const state = {
    rows: [],
    outcomeKey: "dead",
    year: "All",
    gender: "All",
    factorKey: null,
    viewMode: "heatmap",
  };

  OUTCOMES.forEach((outcome) => {
    const option = document.createElement("option");
    option.value = outcome.key;
    option.textContent = outcome.label;
    outcomeSelect.appendChild(option);
  });
  outcomeSelect.value = state.outcomeKey;

  function renderViewModes() {
    viewModesElement.innerHTML = VIEW_MODES.map((mode) => {
      const activeClass = mode.key === state.viewMode ? " active" : "";
      return `<button class="view-toggle${activeClass}" type="button" data-view-mode="${mode.key}">${mode.label}</button>`;
    }).join("");

    viewModesElement.querySelectorAll("[data-view-mode]").forEach((button) => {
      button.addEventListener("click", () => {
        state.viewMode = button.dataset.viewMode;
        renderEducator();
      });
    });
  }

  function renderLegendForMode(outcome) {
    if (state.viewMode === "risk") {
      const worseLabels = window.SleepSignalsCharts.escapeHtml(outcome.order.slice(-2).join(" + "));
      legendElement.innerHTML = `
        <span class="legend-item">Focus: ${worseLabels}</span>
        <span class="legend-item">Dashed line = visible average</span>
        <span class="formula-tooltip-wrapper">
          <span class="formula-icon" title="">ⓘ Formula</span>
          <span class="formula-tooltip">
            <span class="formula-label">Risk Score&nbsp;=&nbsp;</span>
            <span class="formula-fraction">
              <span class="formula-numerator">Count of (${worseLabels})</span>
              <span class="formula-denominator">Total respondents in category</span>
            </span>
            <span class="formula-label">&nbsp;×&nbsp;100</span>
          </span>
        </span>
      `;
      return;
    }
    renderLegend(legendElement, outcome.order);
  }

  function renderChartForMode(matrix, factor, outcome) {
    if (state.viewMode === "risk") {
      renderWorseShareChart(chartElement, {
        matrix,
        factor,
        outcome,
      });
      return;
    }

    if (state.viewMode === "paths") {
      renderOutcomePathChart(chartElement, {
        matrix,
        factor,
        outcome,
      });
      return;
    }

    renderHeatmap(chartElement, {
      matrix,
      factor,
      outcome,
    });
  }

  function renderEducator() {
    const filtered = filterRows(state.rows, {
      year: state.year,
      gender: state.gender,
    });
    const ranking = computeRanking(filtered, state.outcomeKey, SCOPED_FACTOR_KEYS);
    const outcome = getOutcome(state.outcomeKey);

    sampleElement.textContent = `Filtered sample: ${filtered.length.toLocaleString()} responses`;
    renderViewModes();

    if (!ranking.length) {
      const message = `<div class="error-state">Not enough data for this selection.</div>`;
      rankingElement.innerHTML = message;
      chartElement.innerHTML = message;
      patternElement.innerHTML = message;
      legendElement.innerHTML = "";
      rhoElement.textContent = "Selected factor: unavailable";
      return;
    }

    if (!state.factorKey || !ranking.some((item) => item.factorKey === state.factorKey)) {
      const preferred = ranking.find((item) => item.rho >= 0) || ranking[0];
      state.factorKey = preferred.factorKey;
    }

    rankingElement.innerHTML = ranking
      .map((item, index) => {
        const selectedClass = item.factor.key === state.factorKey ? " selected" : "";
        return `
          <article class="rank-card${selectedClass}">
            <button class="rank-button" data-factor="${item.factor.key}">
              <div class="rank-topline">
                <span class="chip">Rank #${index + 1}</span>
                <span class="scope-chip ${item.factor.scope}">${item.factor.scope}</span>
              </div>
              <h3 class="rank-title">${item.factor.label}</h3>
              <p>${item.factor.summary}</p>
              <div class="pill-row">
                <span class="meta-pill">ρ = ${item.rho.toFixed(3)}<span class="rho-info" data-tip="Rank correlation (−1 to +1). Positive = worse factor aligns with worse outcome.">?</span></span>
                <span class="meta-pill">N = ${item.n.toLocaleString()}</span>
              </div>
            </button>
          </article>
        `;
      })
      .join("");

    rankingElement.querySelectorAll("[data-factor]").forEach((button) => {
      button.addEventListener("click", () => {
        state.factorKey = button.dataset.factor;
        renderEducator();
      });
    });

    const selected = ranking.find((item) => item.factor.key === state.factorKey) || ranking[0];
    const matrix = computeMatrix(filtered, state.factorKey, state.outcomeKey);
    const shift = summarizeShift(filtered, state.factorKey, state.outcomeKey);
    const viewMode = VIEW_MODES.find((mode) => mode.key === state.viewMode) || VIEW_MODES[0];

    renderLegendForMode(outcome);
    renderChartForMode(matrix, selected.factor, outcome);

    chartTitleElement.textContent = viewMode.title(selected.factor, outcome);
    chartCopyElement.textContent = viewMode.copy(selected.factor, outcome);
    footnoteElement.textContent = viewMode.footnote;
    rhoElement.innerHTML = `Selected factor: ${selected.factor.label} (\u03c1 = ${selected.rho.toFixed(3)}<span class="rho-info" data-tip="Rank correlation (−1 to +1). Positive = worse factor aligns with worse outcome.">?</span>)`;

    patternElement.innerHTML = `
      <span class="section-kicker">Pattern summary</span>
      <h3>${selected.factor.label}</h3>
      <p>
        Within this filtered sample, the highest concentration of worse outcomes appears at
        <strong>${shift.strongest.factorLevel}</strong>, where
        ${percentageString(shift.strongest.worseShare, 0)} fall into
        ${shift.worseOutcomeLabels.join(" or ")}.
      </p>
      <p class="small-copy">
        The lightest concentration of those worse outcomes appears at <strong>${shift.weakest.factorLevel}</strong>,
        at ${percentageString(shift.weakest.worseShare, 0)}. That spread makes the relationship visible even before the exact ρ value is read.
      </p>
      <p class="small-copy">
        Use this page to support explanation and prioritization, not to imply that the selected factor is the sole driver of the outcome.
      </p>
    `;
  }

  outcomeSelect.addEventListener("change", (event) => {
    state.outcomeKey = event.target.value;
    renderEducator();
  });

  yearSelect.addEventListener("change", (event) => {
    state.year = event.target.value;
    renderEducator();
  });

  genderSelect.addEventListener("change", (event) => {
    state.gender = event.target.value;
    renderEducator();
  });

  window.addEventListener("resize", () => {
    if (state.rows.length) renderEducator();
  });

  window.addEventListener("sleepSignals:themechange", () => {
    if (state.rows.length) renderEducator();
  });

  try {
    state.rows = await loadSurveyData();

    ["All", ...getOptions(state.rows, COLUMNS.year, YEAR_ORDER)].forEach((year) => {
      const option = document.createElement("option");
      option.value = year;
      option.textContent = year === "All" ? "All years" : year;
      yearSelect.appendChild(option);
    });

    ["All", ...getOptions(state.rows, COLUMNS.gender, GENDER_ORDER)].forEach((gender) => {
      const option = document.createElement("option");
      option.value = gender;
      option.textContent = gender === "All" ? "All genders" : gender;
      genderSelect.appendChild(option);
    });

    renderEducator();
  } catch (error) {
    const message = `<div class="error-state">${window.SleepSignalsCharts.escapeHtml(error.message)}</div>`;
    rankingElement.innerHTML = message;
    chartElement.innerHTML = message;
    patternElement.innerHTML = message;
    sampleElement.textContent = "Filtered sample: unavailable";
    rhoElement.textContent = "Selected factor: unavailable";
  }
});
