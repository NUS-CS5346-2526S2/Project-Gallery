document.addEventListener("DOMContentLoaded", async () => {
  const {
    OUTCOMES,
    YEAR_ORDER,
    GENDER_ORDER,
    COLUMNS,
    PRIMARY_FACTOR_KEYS,
    loadSurveyData,
    getOptions,
    filterRows,
    computeRanking,
    computeMatrix,
    getOutcome,
    summarizeShift,
    percentageString,
    associationStrength,
  } = window.SleepSignalsData;
  const {
    renderLegend,
    renderStackedOutcomeChart,
    renderWorseShareChart,
    renderOutcomePathChart,
  } = window.SleepSignalsCharts;

  const VIEW_MODES = [
    {
      key: "stacked",
      label: "Stacked split",
      title: (factor, outcome) => `${factor.label} vs ${outcome.label}`,
      copy: (factor, outcome) =>
        `${factor.question} The rows below show how the ${outcome.label.toLowerCase()} split changes across the ordered response levels.`,
      footnote:
        "Cooler tones indicate better outcomes, warmer tones indicate worse outcomes. Read each row from left to right, not as a causal timeline.",
    },
    {
      key: "risk",
      label: "Risk bars",
      title: (factor, outcome) => `${factor.label}: worse ${outcome.label.toLowerCase()} share`,
      copy: (factor, outcome) =>
        `${factor.question} This view collapses the two worst ${outcome.label.toLowerCase()} levels into one bar so the risk gradient is easier to compare.`,
      footnote:
        "Each bar combines the two worst outcome levels. Use the dashed reference line to see which factor levels sit above the visible average risk.",
    },
    {
      key: "paths",
      label: "Outcome paths",
      title: (factor, outcome) => `${factor.label}: outcome paths`,
      copy: (factor, outcome) =>
        `${factor.question} Each line traces one outcome level across the ordered factor scale, making expansion and contraction easier to spot.`,
      footnote:
        "Read the lines left to right across the ordered factor levels. The steepest slopes show where the outcome mix changes fastest.",
    },
  ];

  const outcomeSelect = document.getElementById("studentOutcome");
  const yearSelect = document.getElementById("studentYear");
  const genderSelect = document.getElementById("studentGender");
  const sampleElement = document.getElementById("studentSample");
  const outcomeDefElement = document.getElementById("studentOutcomeDef");
  const cardsElement = document.getElementById("studentCards");
  const chartTitleElement = document.getElementById("studentChartTitle");
  const chartCopyElement = document.getElementById("studentChartCopy");
  const viewModesElement = document.getElementById("studentViewModes");
  const chartElement = document.getElementById("studentChart");
  const legendElement = document.getElementById("studentLegend");
  const footnoteElement = document.getElementById("studentFootnote");
  const summaryElement = document.getElementById("studentSummary");

  const state = {
    rows: [],
    outcomeKey: "perf",
    year: "All",
    gender: "All",
    factorKey: null,
    viewMode: "stacked",
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
        renderStudent();
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

    renderStackedOutcomeChart(chartElement, {
      matrix,
      factor,
      outcome,
    });
  }

  function renderStudent() {
    const filtered = filterRows(state.rows, {
      year: state.year,
      gender: state.gender,
    });
    const ranking = computeRanking(filtered, state.outcomeKey, PRIMARY_FACTOR_KEYS);
    const outcome = getOutcome(state.outcomeKey);

    sampleElement.textContent = `Filtered sample: ${filtered.length.toLocaleString()} responses`;
    outcomeDefElement.textContent = `Outcome: ${outcome.definition}`;
    renderViewModes();

    if (!ranking.length) {
      cardsElement.innerHTML = `<div class="error-state">Not enough data for this selection.</div>`;
      chartElement.innerHTML = `<div class="error-state">Not enough data for this selection.</div>`;
      summaryElement.innerHTML = `<div class="error-state">Try a broader filter.</div>`;
      legendElement.innerHTML = "";
      return;
    }

    if (!state.factorKey || !ranking.some((item) => item.factorKey === state.factorKey)) {
      state.factorKey = ranking[0].factorKey;
    }

    cardsElement.innerHTML = ranking
      .map((item, index) => {
        const factor = item.factor;
        const width = Math.min((item.abs / 0.5) * 100, 100);
        const selectedClass = item.factorKey === state.factorKey ? " selected" : "";
        const filledCells = Math.max(1, Math.round(width / 10));
        const strengthClass = associationStrength(item.abs).toLowerCase();
        const cells = Array.from({ length: 10 }, (_, i) =>
          `<span class="impact-cell${i < filledCells ? " filled" : ""}"></span>`
        ).join("");
        return `
          <article class="insight-card${selectedClass}">
            <button class="insight-button" data-factor="${factor.key}" style="display:flex;flex-direction:column;height:100%">
              <div class="insight-topline">
                <span class="chip">Rank #${index + 1}</span>
                <span class="scope-chip ${factor.scope}">${factor.scope}</span>
              </div>
              <h3 class="insight-title">${factor.label}</h3>
              <p>${factor.summary}</p>
              <div class="pill-row">
                <span class="meta-pill">${associationStrength(item.abs)} association</span>
              </div>
              <div class="impact-meter" style="margin-top:auto;padding-top:12px">
                <div class="impact-cells impact-cells--${strengthClass}">${cells}</div>
              </div>
            </button>
          </article>
        `;
      })
      .join("");

    cardsElement.querySelectorAll("[data-factor]").forEach((button) => {
      button.addEventListener("click", () => {
        state.factorKey = button.dataset.factor;
        renderStudent();
      });
    });

    const selected = ranking.find((item) => item.factorKey === state.factorKey) || ranking[0];
    const matrix = computeMatrix(filtered, state.factorKey, state.outcomeKey);
    const shift = summarizeShift(filtered, state.factorKey, state.outcomeKey);
    const viewMode = VIEW_MODES.find((mode) => mode.key === state.viewMode) || VIEW_MODES[0];

    renderLegendForMode(outcome);
    renderChartForMode(matrix, selected.factor, outcome);

    chartTitleElement.textContent = viewMode.title(selected.factor, outcome);
    chartCopyElement.textContent = viewMode.copy(selected.factor, outcome);
    footnoteElement.textContent = viewMode.footnote;

    const strongest = shift.strongest;
    const weakest = shift.weakest;
    const delta = Math.max(0, Math.round(shift.delta * 100));
    summaryElement.innerHTML = `
      <span class="section-kicker">Selected factor</span>
      <h3>${selected.factor.label}</h3>
      <p>${selected.factor.summary}</p>
      <div class="pill-row">
        <span class="scope-chip ${selected.factor.scope}">${selected.factor.scope}</span>
        <span class="meta-pill">N = ${selected.n.toLocaleString()}</span>
      </div>
      <p class="small-copy">
        The heaviest concentration of worse outcomes appears at <strong>${strongest.factorLevel}</strong>,
        where ${percentageString(strongest.worseShare, 0)} fall into
        ${shift.worseOutcomeLabels.join(" or ")}.
      </p>
      <p class="small-copy">
        At <strong>${weakest.factorLevel}</strong>, that combined worse-outcome share drops to
        ${percentageString(weakest.worseShare, 0)}. That is a ${delta}-point spread inside the filtered sample.
      </p>
      <p class="small-copy">
        Read this as an association pattern, not a promise that changing one behavior will automatically change academic results.
      </p>
    `;
  }

  outcomeSelect.addEventListener("change", (event) => {
    state.outcomeKey = event.target.value;
    renderStudent();
  });

  yearSelect.addEventListener("change", (event) => {
    state.year = event.target.value;
    renderStudent();
  });

  genderSelect.addEventListener("change", (event) => {
    state.gender = event.target.value;
    renderStudent();
  });

  window.addEventListener("resize", () => {
    if (state.rows.length) renderStudent();
  });

  window.addEventListener("sleepSignals:themechange", () => {
    if (state.rows.length) renderStudent();
  });

  try {
    state.rows = await loadSurveyData();
    const yearOptions = ["All", ...getOptions(state.rows, COLUMNS.year, YEAR_ORDER)];
    yearOptions.forEach((year) => {
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
    renderStudent();
  } catch (error) {
    const message = `<div class="error-state">${window.SleepSignalsCharts.escapeHtml(error.message)}</div>`;
    cardsElement.innerHTML = message;
    chartElement.innerHTML = message;
    summaryElement.innerHTML = message;
    sampleElement.textContent = "Filtered sample: unavailable";
    outcomeDefElement.textContent = "Outcome: unavailable";
  }
});