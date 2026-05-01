(function () {
  const COLUMNS = {
    year: "1. What is your year of study?",
    gender: "2. What is your gender?",
    q3: "3. How often do you have difficulty falling asleep at night?",
    q4: "4. On average, how many hours of sleep do you get on a typical day?",
    q5: "5. How often do you wake up during the night and have trouble falling back asleep?",
    q6: "6. How would you rate the overall quality of your sleep?",
    q7: "7. How often do you experience difficulty concentrating during lectures or studying due to lack of sleep?",
    q8: "8. How often do you feel fatigued during the day, affecting your ability to study or attend classes?",
    q9: "9. How often do you miss or skip classes due to sleep-related issues (e.g., insomnia, feeling tired)?",
    q10: "10. How would you describe the impact of insufficient sleep on your ability to complete assignments and meet deadlines?",
    q11: "11. How often do you use electronic devices (e.g., phone, computer) before going to sleep?",
    q12: "12. How often do you consume caffeine (coffee, energy drinks) to stay awake or alert?",
    q13: "13. How often do you engage in physical activity or exercise?",
    q14: "14. How would you describe your stress levels related to academic workload?",
    q15: "15. How would you rate your overall academic performance (GPA or grades) in the past semester?",
  };

  const GROUPS = {
    day: { label: "Daytime signal", short: "Daytime" },
    habit: { label: "Habit", short: "Habit" },
    sleep: { label: "Sleep pattern", short: "Sleep" },
    context: { label: "Context", short: "Context" },
  };

  const FACTORS = [
    {
      key: "fatigue",
      col: COLUMNS.q8,
      label: "Daytime fatigue",
      group: "day",
      scope: "primary",
      order: ["Never", "Rarely", "Sometimes", "Often", "Always"],
      question: COLUMNS.q8,
      summary: "Feeling tired during the day is the clearest student-facing signal in this dataset.",
    },
    {
      key: "device",
      col: COLUMNS.q11,
      label: "Device use before bed",
      group: "habit",
      scope: "primary",
      order: [
        "Never",
        "Rarely (1-2 times a week)",
        "Sometimes (3-4 times a week)",
        "Often (5-6 times a week)",
        "Every night",
      ],
      question: COLUMNS.q11,
      summary: "Frequent pre-sleep screen use aligns with heavier academic disruption.",
    },
    {
      key: "caffeine",
      col: COLUMNS.q12,
      label: "Caffeine use",
      group: "habit",
      scope: "primary",
      order: [
        "Never",
        "Rarely (1-2 times a week)",
        "Sometimes (3-4 times a week)",
        "Often (5-6 times a week)",
        "Every day",
      ],
      question: COLUMNS.q12,
      summary: "Higher caffeine use looks more like compensation than protection in this survey.",
    },
    {
      key: "exercise",
      col: COLUMNS.q13,
      label: "Exercise frequency",
      group: "habit",
      scope: "primary",
      order: [
        "Every day",
        "Often (5-6 times a week)",
        "Sometimes (3-4 times a week)",
        "Rarely (1-2 times a week)",
        "Never",
      ],
      question: COLUMNS.q13,
      summary: "Exercise ranks strongly here, but the direction is counterintuitive in this survey and should be interpreted cautiously.",
    },
    {
      key: "concentration",
      col: COLUMNS.q7,
      label: "Concentration difficulty",
      group: "day",
      scope: "context",
      order: ["Never", "Rarely", "Sometimes", "Often", "Always"],
      question: COLUMNS.q7,
      summary: "Concentration difficulty helps explain how sleep-related strain shows up in study life.",
    },
    {
      key: "awakening",
      col: COLUMNS.q5,
      label: "Night awakenings",
      group: "sleep",
      scope: "context",
      order: [
        "Never",
        "Rarely (1-2 times a week)",
        "Sometimes (3-4 times a week)",
        "Often (5-6 times a week)",
        "Every night",
      ],
      question: COLUMNS.q5,
      summary: "Interrupted sleep still matters, but it is not the strongest headline signal here.",
    },
    {
      key: "stress",
      col: COLUMNS.q14,
      label: "Academic stress",
      group: "context",
      scope: "context",
      order: ["No stress", "Low stress", "High stress", "Extremely high stress"],
      question: COLUMNS.q14,
      summary: "Stress likely works in both directions and should be explained with caution.",
    },
    {
      key: "sleepHours",
      col: COLUMNS.q4,
      label: "Sleep duration",
      group: "sleep",
      scope: "context",
      order: ["More than 8 hours", "7-8 hours", "6-7 hours", "4-5 hours", "Less than 4 hours"],
      question: COLUMNS.q4,
      summary: "Sleep duration matters, but the strongest patterns in this dataset come from daytime and behavior signals.",
    },
  ];

  const OUTCOMES = [
    {
      key: "perf",
      col: COLUMNS.q15,
      label: "Academic performance",
      order: ["Excellent", "Good", "Average", "Below Average", "Poor"],
      question: COLUMNS.q15,
      definition: "Self-rated GPA or grade performance in the past semester.",
    },
    {
      key: "dead",
      col: COLUMNS.q10,
      label: "Assignment impact",
      order: ["No impact", "Minor impact", "Moderate impact", "Major impact", "Severe impact"],
      question: COLUMNS.q10,
      definition: "How much insufficient sleep affects assignment completion and deadlines.",
    },
    {
      key: "skip",
      col: COLUMNS.q9,
      label: "Class skipped due to sleep",
      order: [
        "Never",
        "Rarely (1-2 times a month)",
        "Sometimes (1-2 times a week)",
        "Often (3-4 times a week)",
        "Always",
      ],
      question: COLUMNS.q9,
      definition: "How often sleep-related issues lead to missing or skipping classes.",
    },
  ];

  const YEAR_ORDER = ["First year", "Second year", "Third year", "Graduate student"];
  const GENDER_ORDER = ["Male", "Female"];
  const PRIMARY_FACTOR_KEYS = ["fatigue", "device", "caffeine", "exercise"];
  const SCOPED_FACTOR_KEYS = FACTORS.map((factor) => factor.key);
  const FACTOR_MAP = Object.fromEntries(FACTORS.map((factor) => [factor.key, factor]));
  const OUTCOME_MAP = Object.fromEntries(OUTCOMES.map((outcome) => [outcome.key, outcome]));
  const BENCHMARKS = Array.isArray(window.SleepSignalsBenchmarkRows)
    ? window.SleepSignalsBenchmarkRows
    : [];

  let cachedRows = null;
  let cachedBenchmarks = null;

  async function loadSurveyData() {
    if (cachedRows) return cachedRows;
    const dataset = window.SleepSignalsSurveyRows;
    if (!Array.isArray(dataset) || !dataset.length) {
      throw new Error(
        "Bundled survey data is missing. Make sure data/local-survey-bundle.js is loaded before assets/data.js."
      );
    }
    cachedRows = dataset.map((row) => ({ ...row }));
    return cachedRows;
  }

  async function loadBenchmarkData() {
    if (cachedBenchmarks) return cachedBenchmarks;
    if (!BENCHMARKS.length) {
      throw new Error(
        "Bundled benchmark data is missing. Make sure data/global-sleep-benchmarks.js is loaded before assets/data.js."
      );
    }
    cachedBenchmarks = BENCHMARKS.map((entry) => ({ ...entry }));
    return cachedBenchmarks;
  }

  function getFactor(key) {
    return FACTOR_MAP[key];
  }

  function getOutcome(key) {
    return OUTCOME_MAP[key];
  }

  function getOptions(rows, column, preferredOrder) {
    const values = [...new Set(rows.map((row) => row[column]).filter(Boolean))];
    if (preferredOrder) {
      values.sort((left, right) => {
        const leftIndex = preferredOrder.indexOf(left);
        const rightIndex = preferredOrder.indexOf(right);
        if (leftIndex === -1 && rightIndex === -1) return left.localeCompare(right);
        if (leftIndex === -1) return 1;
        if (rightIndex === -1) return -1;
        return leftIndex - rightIndex;
      });
    } else {
      values.sort((left, right) => left.localeCompare(right));
    }
    return values;
  }

  function filterRows(rows, filters) {
    return rows.filter((row) => {
      if (filters?.year && filters.year !== "All" && row[COLUMNS.year] !== filters.year) return false;
      if (filters?.gender && filters.gender !== "All" && row[COLUMNS.gender] !== filters.gender) return false;
      return true;
    });
  }

  function encodeOrdinal(order, value) {
    const index = order.indexOf(value);
    return index >= 0 ? index : null;
  }

  function ranks(values) {
    const sorted = values.map((value, index) => ({ value, index })).sort((left, right) => left.value - right.value);
    const ranked = new Array(values.length);
    let start = 0;
    while (start < sorted.length) {
      let end = start;
      while (end < sorted.length && sorted[end].value === sorted[start].value) end += 1;
      const average = (start + 1 + end) / 2;
      for (let pointer = start; pointer < end; pointer += 1) {
        ranked[sorted[pointer].index] = average;
      }
      start = end;
    }
    return ranked;
  }

  function spearman(valuesX, valuesY) {
    if (valuesX.length !== valuesY.length || valuesX.length < 3) return null;
    const rankedX = ranks(valuesX);
    const rankedY = ranks(valuesY);
    const meanX = d3.mean(rankedX);
    const meanY = d3.mean(rankedY);
    let numerator = 0;
    let denominatorX = 0;
    let denominatorY = 0;
    for (let index = 0; index < rankedX.length; index += 1) {
      const offsetX = rankedX[index] - meanX;
      const offsetY = rankedY[index] - meanY;
      numerator += offsetX * offsetY;
      denominatorX += offsetX ** 2;
      denominatorY += offsetY ** 2;
    }
    const denominator = Math.sqrt(denominatorX * denominatorY);
    return denominator ? numerator / denominator : null;
  }

  function computeRanking(rows, outcomeKey, factorKeys) {
    const outcome = getOutcome(outcomeKey);
    return (factorKeys || SCOPED_FACTOR_KEYS)
      .map((factorKey) => {
        const factor = getFactor(factorKey);
        const factorValues = [];
        const outcomeValues = [];
        rows.forEach((row) => {
          const factorValue = encodeOrdinal(factor.order, row[factor.col]);
          const outcomeValue = encodeOrdinal(outcome.order, row[outcome.col]);
          if (factorValue !== null && outcomeValue !== null) {
            factorValues.push(factorValue);
            outcomeValues.push(outcomeValue);
          }
        });
        const rho = spearman(factorValues, outcomeValues);
        if (rho === null) return null;
        return {
          factorKey,
          factor,
          rho,
          abs: Math.abs(rho),
          n: factorValues.length,
        };
      })
      .filter(Boolean)
      .sort((left, right) => d3.descending(left.abs, right.abs));
  }

  function computeMatrix(rows, factorKey, outcomeKey) {
    const factor = getFactor(factorKey);
    const outcome = getOutcome(outcomeKey);
    return factor.order.map((factorLevel) => {
      const counts = outcome.order.map((outcomeLevel) => {
        return rows.reduce((total, row) => {
          return total + (row[factor.col] === factorLevel && row[outcome.col] === outcomeLevel ? 1 : 0);
        }, 0);
      });
      const total = d3.sum(counts);
      const percentages = counts.map((count) => (total ? count / total : 0));
      return {
        factorLevel,
        counts,
        percentages,
        total,
      };
    });
  }

  function distribution(rows, column, order) {
    return order.map((label) => {
      const count = rows.reduce((total, row) => total + (row[column] === label ? 1 : 0), 0);
      return {
        label,
        count,
        pct: rows.length ? count / rows.length : 0,
      };
    });
  }

  function aggregateShare(rows, column, values) {
    if (!rows.length) return 0;
    return rows.reduce((total, row) => total + (values.includes(row[column]) ? 1 : 0), 0) / rows.length;
  }

  function summarizeShift(rows, factorKey, outcomeKey) {
    const factor = getFactor(factorKey);
    const outcome = getOutcome(outcomeKey);
    const matrix = computeMatrix(rows, factorKey, outcomeKey);
    const worseOutcomeLabels = outcome.order.slice(-2);
    const rowSummaries = matrix.map((rowSummary) => {
      const worseShare = outcome.order.reduce((total, label, index) => {
        return total + (worseOutcomeLabels.includes(label) ? rowSummary.percentages[index] : 0);
      }, 0);
      return {
        factorLevel: rowSummary.factorLevel,
        total: rowSummary.total,
        worseShare,
      };
    });

    const strongest = rowSummaries.reduce((best, current) => {
      if (!best) return current;
      return current.worseShare > best.worseShare ? current : best;
    }, null);

    const weakest = rowSummaries.reduce((best, current) => {
      if (!best) return current;
      return current.worseShare < best.worseShare ? current : best;
    }, null);

    return {
      strongest,
      weakest,
      worseOutcomeLabels,
      delta: strongest && weakest ? strongest.worseShare - weakest.worseShare : 0,
    };
  }

  function percentageString(value, digits) {
    return `${(value * 100).toFixed(digits ?? 0)}%`;
  }

  function associationStrength(absRho) {
    if (absRho >= 0.4) return "Strong";
    if (absRho >= 0.25) return "Moderate";
    if (absRho >= 0.12) return "Mild";
    return "Light";
  }

  function computeHeadlineStats(rows) {
    return [
      {
        label: "Responses",
        value: rows.length.toLocaleString(),
        copy: "Online survey responses collected in Oct to Nov 2024.",
      },
      {
        label: "Poor or below-average performance",
        value: percentageString(
          aggregateShare(rows, COLUMNS.q15, ["Below Average", "Poor"]),
          0
        ),
        copy: "Self-rated academic performance is heavily concentrated in the lower categories.",
      },
      {
        label: "High or extreme stress",
        value: percentageString(
          aggregateShare(rows, COLUMNS.q14, ["High stress", "Extremely high stress"]),
          0
        ),
        copy: "Academic stress is widespread and needs to be treated as both context and risk.",
      },
      {
        label: "Major or severe deadline impact",
        value: percentageString(
          aggregateShare(rows, COLUMNS.q10, ["Major impact", "Severe impact"]),
          0
        ),
        copy: "Insufficient sleep is already showing up in assignment completion and deadlines.",
      },
    ];
  }

  function computeStoryFindings(rows) {
    const fatigueSubset = rows.filter((row) => ["Often", "Always"].includes(row[COLUMNS.q8]));
    const deviceSubset = rows.filter((row) =>
      ["Often (5-6 times a week)", "Every night"].includes(row[COLUMNS.q11])
    );
    const caffeineSubset = rows.filter((row) =>
      ["Often (5-6 times a week)", "Every day"].includes(row[COLUMNS.q12])
    );
    const exerciseRanking = computeRanking(rows, "dead", ["exercise"])[0];

    return [
      {
        title: "Daytime fatigue is the clearest class-skipping signal",
        chip: "Student story",
        metric: percentageString(
          aggregateShare(fatigueSubset, COLUMNS.q9, ["Often (3-4 times a week)", "Always"]),
          0
        ),
        body:
          "of students who often or always feel fatigued also report skipping class often or always because of sleep-related issues.",
      },
      {
        title: "Night-time screen use travels with deadline strain",
        chip: "Habit signal",
        metric: percentageString(
          aggregateShare(deviceSubset, COLUMNS.q10, ["Major impact", "Severe impact"]),
          1
        ),
        body:
          "of frequent pre-sleep device users report major or severe assignment impact.",
      },
      {
        title: "Caffeine looks more reactive than protective",
        chip: "Habit signal",
        metric: percentageString(
          aggregateShare(caffeineSubset, COLUMNS.q10, ["Major impact", "Severe impact"]),
          1
        ),
        body:
          "of frequent caffeine users also report major or severe deadline disruption.",
      },
      {
        title: "Exercise shows a strong inverse rank pattern",
        chip: "Context for action",
        metric: `ρ = ${exerciseRanking.rho.toFixed(2)}<span class="rho-info" data-tip="Rank correlation (−1 to +1). Positive = worse factor aligns with worse outcome.">?</span>`,
        body:
          "The negative direction comes from the coded order, but the underlying pattern is counterintuitive and should be explained cautiously.",
      },
    ];
  }

  function profileCounts(rows) {
    return {
      year: distribution(rows, COLUMNS.year, YEAR_ORDER),
      gender: distribution(rows, COLUMNS.gender, GENDER_ORDER),
      performance: distribution(rows, COLUMNS.q15, getOutcome("perf").order),
      deadlines: distribution(rows, COLUMNS.q10, getOutcome("dead").order),
      skipping: distribution(rows, COLUMNS.q9, getOutcome("skip").order),
    };
  }

  window.SleepSignalsData = {
    COLUMNS,
    GROUPS,
    FACTORS,
    OUTCOMES,
    BENCHMARKS,
    YEAR_ORDER,
    GENDER_ORDER,
    PRIMARY_FACTOR_KEYS,
    SCOPED_FACTOR_KEYS,
    loadSurveyData,
    loadBenchmarkData,
    getFactor,
    getOutcome,
    getOptions,
    filterRows,
    distribution,
    computeMatrix,
    computeRanking,
    summarizeShift,
    computeHeadlineStats,
    computeStoryFindings,
    profileCounts,
    percentageString,
    associationStrength,
  };
})();

// Global rho-info tooltip (event delegation — works with dynamically rendered content)
(function () {
  const tip = document.createElement("div");
  tip.className = "rho-tip";
  document.body.appendChild(tip);

  document.addEventListener("mousemove", (event) => {
    const el = event.target.closest(".rho-info");
    if (!el) {
      tip.classList.remove("rho-tip-visible");
      return;
    }
    tip.textContent = el.dataset.tip;
    tip.classList.add("rho-tip-visible");
    const pad = 14;
    const box = tip.getBoundingClientRect();
    let left = event.clientX + pad;
    let top = event.clientY - box.height - pad;
    if (left + box.width + 8 > window.innerWidth) left = event.clientX - box.width - pad;
    if (top < 8) top = event.clientY + pad;
    tip.style.left = left + "px";
    tip.style.top = top + "px";
  });
})();
