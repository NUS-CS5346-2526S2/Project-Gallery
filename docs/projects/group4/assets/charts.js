(function () {
  const OUTCOME_COLORS_5 = ["#2dd4bf", "#60a5fa", "#94a3b8", "#fb923c", "#f87171"];
  const REGION_COLORS = {
    Asia: "#2dd4bf",
    Europe: "#60a5fa",
    "North America": "#f87171",
    "Latin America": "#fbbf24",
    Africa: "#34d399",
    Oceania: "#a78bfa",
  };

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      }[character];
    });
  }

  function getTooltip() {
    let tooltip = document.getElementById("chartTooltip");
    if (!tooltip) {
      tooltip = document.createElement("div");
      tooltip.id = "chartTooltip";
      tooltip.className = "tooltip";
      document.body.appendChild(tooltip);
    }
    return tooltip;
  }

  function showTooltip(event, html) {
    const tooltip = getTooltip();
    tooltip.innerHTML = html;
    tooltip.classList.add("show");
    const offset = 16;
    const box = tooltip.getBoundingClientRect();
    let left = event.clientX + offset;
    let top = event.clientY + offset;
    if (left + box.width + 16 > window.innerWidth) left = event.clientX - box.width - offset;
    if (top + box.height + 16 > window.innerHeight) top = event.clientY - box.height - offset;
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  function hideTooltip() {
    getTooltip().classList.remove("show");
  }

  function outcomeColors(length) {
    if (length <= OUTCOME_COLORS_5.length) return OUTCOME_COLORS_5.slice(0, length);
    return d3.quantize(d3.interpolateRgbBasis(OUTCOME_COLORS_5), length);
  }

  function themeValue(name, fallback) {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }

  function themeTokens() {
    return {
      axis: themeValue("--chart-axis", "#7a9bbf"),
      label: themeValue("--chart-label", "#c8daf0"),
      muted: themeValue("--chart-muted", "#607996"),
      faint: themeValue("--chart-faint", "#3d5a78"),
      grid: themeValue("--chart-grid", "rgba(255,255,255,0.06)"),
      surfaceMuted: themeValue("--surface-muted", "rgba(255,255,255,0.04)"),
      surfaceBorder: themeValue("--surface-border", "rgba(255,255,255,0.08)"),
      surfaceBorderStrong: themeValue("--surface-border-strong", "rgba(255,255,255,0.16)"),
      labelInverse: themeValue("--chart-label-inverse", "#f8fbff"),
      labelAccent: themeValue("--chart-label-accent", "#0d1520"),
      teal: themeValue("--teal", "#00c4a0"),
      sky: themeValue("--sky", "#60a5fa"),
      rust: themeValue("--rust", "#ef4444"),
      chartSurface: themeValue("--chart-surface", "#0d1a30"),
    };
  }

  function readableTextColor(fillColor, theme) {
    const parsed = d3.color(fillColor);
    if (!parsed) return theme.label;
    const luminance = (0.2126 * parsed.r + 0.7152 * parsed.g + 0.0722 * parsed.b) / 255;
    return luminance > 0.63 ? theme.labelAccent : theme.labelInverse;
  }

  function worseOutcomeSummary(matrix, outcome) {
    const betterCount = Math.min(2, outcome.order.length);
    return matrix.map((rowSummary) => {
      const worseShare = d3.sum(rowSummary.percentages.slice(-2));
      const betterShare = d3.sum(rowSummary.percentages.slice(0, betterCount));
      return {
        ...rowSummary,
        worseShare,
        betterShare,
        balance: worseShare - betterShare,
      };
    });
  }

  function formatBenchmarkValue(value, key) {
    if (value == null || Number.isNaN(value)) return "Unavailable";
    if (key === "avg_sleep_hrs") return `${Number(value).toFixed(1)}h`;
    if (key === "academic_pressure_score") return `${value.toFixed(1)} / 5`;
    return `${value}%`;
  }

  function renderLegend(element, labels) {
    const colors = outcomeColors(labels.length);
    element.innerHTML = labels
      .map((label, index) => {
        return `<span class="legend-item"><span class="legend-swatch" style="background:${colors[index]}"></span>${escapeHtml(label)}</span>`;
      })
      .join("");
  }

  function renderStackedOutcomeChart(element, options) {
    const { matrix, factor, outcome } = options;
    const theme = themeTokens();
    element.innerHTML = "";
    if (!matrix.length) {
      element.innerHTML = `<div class="loading-state">No data available for this filter selection.</div>`;
      return;
    }

    const width = Math.max(element.clientWidth || 720, 620);
    const height = Math.max(360, matrix.length * 74 + 92);
    const margin = { top: 34, right: 42, bottom: 56, left: 240 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const colors = outcomeColors(outcome.order.length);

    const svg = d3
      .select(element)
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("role", "img")
      .attr("aria-label", `${factor.label} versus ${outcome.label}`);

    const root = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const x = d3.scaleLinear().domain([0, 1]).range([0, innerWidth]);
    const y = d3
      .scaleBand()
      .domain(matrix.map((row) => row.factorLevel))
      .range([0, innerHeight])
      .padding(0.22);

    root
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom(x)
          .tickValues([0, 0.25, 0.5, 0.75, 1])
          .tickFormat((value) => `${Math.round(value * 100)}%`)
      )
      .call((group) => {
        group.select(".domain").attr("stroke", theme.surfaceBorderStrong);
        group.selectAll("line").attr("stroke", theme.surfaceBorderStrong);
        group.selectAll("text").attr("fill", theme.axis).attr("font-size", 11);
      });

    root
      .append("g")
      .call(d3.axisLeft(y).tickSize(0))
      .call((group) => {
        group.select(".domain").remove();
        group
          .selectAll("text")
          .attr("fill", theme.label)
          .attr("font-size", 13)
          .attr("font-weight", 600)
          .style("text-transform", "none");
      });

    root
      .append("g")
      .selectAll("line")
      .data([0, 0.25, 0.5, 0.75, 1])
      .join("line")
      .attr("x1", (value) => x(value))
      .attr("x2", (value) => x(value))
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("stroke", theme.grid)
      .attr("stroke-dasharray", "4,4");

    matrix.forEach((rowSummary) => {
      let currentOffset = 0;
      rowSummary.percentages.forEach((percentage, index) => {
        const fill = colors[index];
        const segmentWidth = x(percentage);
        const segment = root
          .append("rect")
          .attr("x", x(currentOffset))
          .attr("y", y(rowSummary.factorLevel))
          .attr("width", Math.max(segmentWidth, 0))
          .attr("height", y.bandwidth())
          .attr("rx", 10)
          .attr("fill", fill);

        const count = rowSummary.counts[index];
        segment
          .on("mousemove", (event) => {
            showTooltip(
              event,
              `<strong>${escapeHtml(rowSummary.factorLevel)}</strong>${escapeHtml(
                outcome.order[index]
              )}<br>${(percentage * 100).toFixed(1)}% of this row<br><span class="muted">${count.toLocaleString()} responses</span>`
            );
          })
          .on("mouseleave", hideTooltip);

        if (percentage >= 0.085) {
          root
            .append("text")
            .attr("x", x(currentOffset) + segmentWidth / 2)
            .attr("y", y(rowSummary.factorLevel) + y.bandwidth() / 2 + 4)
            .attr("text-anchor", "middle")
            .attr("fill", readableTextColor(fill, theme))
            .attr("font-size", 11)
            .attr("font-weight", 700)
            .text(`${Math.round(percentage * 100)}%`);
        }

        currentOffset += percentage;
      });

      root
        .append("text")
        .attr("x", innerWidth + 8)
        .attr("y", y(rowSummary.factorLevel) + y.bandwidth() / 2 + 4)
        .attr("fill", theme.faint)
        .attr("font-size", 11)
        .text(`n=${rowSummary.total}`);
    });

    svg
      .append("text")
      .attr("x", margin.left + innerWidth / 2)
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .attr("fill", theme.muted)
      .attr("font-size", 13)
      .attr("font-weight", 700)
      .text("Share of responses per outcome level (%)");

    svg
      .append("text")
      .attr("transform", `translate(16, ${margin.top + innerHeight / 2}) rotate(-90)`)
      .attr("text-anchor", "middle")
      .attr("fill", theme.muted)
      .attr("font-size", 13)
      .attr("font-weight", 700)
      .text(factor.label);
  }

  function renderHeatmap(element, options) {
    const { matrix, factor, outcome } = options;
    const theme = themeTokens();
    element.innerHTML = "";
    if (!matrix.length) {
      element.innerHTML = `<div class="loading-state">No data available for this filter selection.</div>`;
      return;
    }

    const width = Math.max(element.clientWidth || 780, 680);
    const height = Math.max(380, matrix.length * 78 + 126);
    const margin = { top: 84, right: 90, bottom: 26, left: 240 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const lowColor = theme.chartSurface;
    const highColor = theme.teal;

    const svg = d3
      .select(element)
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("role", "img")
      .attr("aria-label", `${factor.label} heatmap by ${outcome.label}`);

    const root = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const x = d3.scaleBand().domain(outcome.order).range([0, innerWidth]).paddingInner(0.08);
    const y = d3
      .scaleBand()
      .domain(matrix.map((row) => row.factorLevel))
      .range([0, innerHeight])
      .paddingInner(0.08);
    const flat = matrix.flatMap((rowSummary) => {
      return outcome.order.map((outcomeLevel, index) => ({
        factorLevel: rowSummary.factorLevel,
        outcomeLevel,
        count: rowSummary.counts[index],
        pct: rowSummary.percentages[index],
        total: rowSummary.total,
      }));
    });
    const maxPct = d3.max(flat, (cell) => cell.pct) || 1;
    const color = d3.scaleSequential().domain([0, maxPct]).interpolator(d3.interpolateRgb(lowColor, highColor));

    root
      .append("g")
      .call(d3.axisLeft(y).tickSize(0))
      .call((group) => {
        group.select(".domain").remove();
        group.selectAll("text").attr("fill", theme.label).attr("font-size", 13).attr("font-weight", 600);
      });

    root
      .append("g")
      .call(d3.axisTop(x).tickSize(0))
      .call((group) => {
        group.select(".domain").remove();
        group.selectAll("text").attr("fill", theme.label).attr("font-size", 12).attr("font-weight", 700);
      });

    root
      .selectAll("rect")
      .data(flat)
      .join("rect")
      .attr("x", (cell) => x(cell.outcomeLevel))
      .attr("y", (cell) => y(cell.factorLevel))
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .attr("rx", 12)
      .attr("fill", (cell) => color(cell.pct))
      .attr("stroke", theme.surfaceBorder)
      .on("mousemove", (event, cell) => {
        showTooltip(
          event,
          `<strong>${escapeHtml(cell.factorLevel)}</strong>${escapeHtml(
            cell.outcomeLevel
          )}<br>${(cell.pct * 100).toFixed(1)}% of this row<br><span class="muted">${cell.count.toLocaleString()} responses</span>`
        );
      })
      .on("mouseleave", hideTooltip);

    root
      .selectAll("text.cell-value")
      .data(flat)
      .join("text")
      .attr("class", "cell-value")
      .attr("x", (cell) => x(cell.outcomeLevel) + x.bandwidth() / 2)
      .attr("y", (cell) => y(cell.factorLevel) + y.bandwidth() / 2 + 4)
      .attr("text-anchor", "middle")
      .attr("font-size", 11)
      .attr("font-weight", 700)
      .attr("fill", (cell) => readableTextColor(color(cell.pct), theme))
      .text((cell) => (cell.pct >= 0.05 ? `${Math.round(cell.pct * 100)}%` : ""));

    matrix.forEach((rowSummary) => {
      root
        .append("text")
        .attr("x", innerWidth + 12)
        .attr("y", y(rowSummary.factorLevel) + y.bandwidth() / 2 + 4)
        .attr("fill", theme.faint)
        .attr("font-size", 11)
        .text(`n=${rowSummary.total}`);
    });

    const defs = svg.append("defs");
    const gradient = defs
      .append("linearGradient")
      .attr("id", "heatmapLegendGradient")
      .attr("x1", "0%")
      .attr("x2", "100%");
    d3.range(0, 1.01, 0.1).forEach((stop) => {
      gradient
        .append("stop")
        .attr("offset", `${stop * 100}%`)
        .attr("stop-color", color(stop * maxPct));
    });

    const legendWidth = Math.min(220, innerWidth);
    const legendX = width - margin.right - legendWidth;
    const legendY = height - 16;
    svg
      .append("rect")
      .attr("x", legendX)
      .attr("y", legendY)
      .attr("width", legendWidth)
      .attr("height", 10)
      .attr("rx", 999)
      .attr("fill", "url(#heatmapLegendGradient)");
    svg
      .append("text")
      .attr("x", legendX)
      .attr("y", legendY - 6)
      .attr("fill", theme.faint)
      .attr("font-size", 11)
      .text("Lower row share");
    svg
      .append("text")
      .attr("x", legendX + legendWidth)
      .attr("y", legendY - 6)
      .attr("fill", theme.faint)
      .attr("font-size", 11)
      .attr("text-anchor", "end")
      .text("Higher row share");

    svg
      .append("text")
      .attr("x", margin.left + innerWidth / 2)
      .attr("y", 22)
      .attr("text-anchor", "middle")
      .attr("fill", theme.muted)
      .attr("font-size", 13)
      .attr("font-weight", 700)
      .text(outcome.label);

    svg
      .append("text")
      .attr("transform", `translate(16, ${margin.top + innerHeight / 2}) rotate(-90)`)
      .attr("text-anchor", "middle")
      .attr("fill", theme.muted)
      .attr("font-size", 13)
      .attr("font-weight", 700)
      .text(factor.label);
  }

  function renderWorseShareChart(element, options) {
    const { matrix, factor, outcome } = options;
    const theme = themeTokens();
    element.innerHTML = "";
    if (!matrix.length) {
      element.innerHTML = `<div class="loading-state">No data available for this filter selection.</div>`;
      return;
    }

    const summary = worseOutcomeSummary(matrix, outcome);
    const averageShare = d3.mean(summary, (row) => row.worseShare) || 0;
    const worseLabels = outcome.order.slice(-2).join(" + ");
    const width = Math.max(element.clientWidth || 720, 620);
    const height = Math.max(340, summary.length * 64 + 112);
    const margin = { top: 36, right: 52, bottom: 56, left: 240 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const x = d3.scaleLinear().domain([0, 1]).range([0, innerWidth]);
    const y = d3
      .scaleBand()
      .domain(summary.map((row) => row.factorLevel))
      .range([0, innerHeight])
      .padding(0.28);
    const fillScale = d3
      .scaleLinear()
      .domain([0, 1])
      .range([theme.sky, theme.rust])
      .interpolate(d3.interpolateRgb);

    const svg = d3
      .select(element)
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("role", "img")
      .attr("aria-label", `${factor.label} worse outcome share chart`);

    const root = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    root
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom(x)
          .tickValues([0, 0.25, 0.5, 0.75, 1])
          .tickFormat((value) => `${Math.round(value * 100)}%`)
      )
      .call((group) => {
        group.select(".domain").attr("stroke", theme.surfaceBorderStrong);
        group.selectAll("line").attr("stroke", theme.surfaceBorderStrong);
        group.selectAll("text").attr("fill", theme.axis).attr("font-size", 11);
      });

    root
      .append("g")
      .call(d3.axisLeft(y).tickSize(0))
      .call((group) => {
        group.select(".domain").remove();
        group.selectAll("text").attr("fill", theme.label).attr("font-size", 13).attr("font-weight", 600);
      });

    root
      .append("g")
      .selectAll("line")
      .data([0, 0.25, 0.5, 0.75, 1])
      .join("line")
      .attr("x1", (value) => x(value))
      .attr("x2", (value) => x(value))
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("stroke", theme.grid)
      .attr("stroke-dasharray", "4,4");

    root
      .append("line")
      .attr("x1", x(averageShare))
      .attr("x2", x(averageShare))
      .attr("y1", -6)
      .attr("y2", innerHeight)
      .attr("stroke", theme.teal)
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "6,6");

    root
      .append("text")
      .attr("x", x(averageShare) + 6)
      .attr("y", -12)
      .attr("fill", theme.teal)
      .attr("font-size", 11)
      .attr("font-weight", 700)
      .text(`Visible average ${Math.round(averageShare * 100)}%`);

    root
      .selectAll("rect.track")
      .data(summary)
      .join("rect")
      .attr("class", "track")
      .attr("x", 0)
      .attr("y", (row) => y(row.factorLevel))
      .attr("width", innerWidth)
      .attr("height", y.bandwidth())
      .attr("rx", 12)
      .attr("fill", theme.surfaceMuted);

    root
      .selectAll("rect.bar")
      .data(summary)
      .join("rect")
      .attr("class", "bar")
      .attr("x", 0)
      .attr("y", (row) => y(row.factorLevel))
      .attr("width", (row) => x(row.worseShare))
      .attr("height", y.bandwidth())
      .attr("rx", 12)
      .attr("fill", (row) => fillScale(row.worseShare))
      .on("mousemove", (event, row) => {
        showTooltip(
          event,
          `<strong>${escapeHtml(row.factorLevel)}</strong>${escapeHtml(
            worseLabels
          )}<br>${(row.worseShare * 100).toFixed(1)}% combined worse-outcome share<br><span class="muted">Better outcomes: ${(
            row.betterShare * 100
          ).toFixed(1)}%</span>`
        );
      })
      .on("mouseleave", hideTooltip);

    summary.forEach((row) => {
      const fill = fillScale(row.worseShare);
      const barWidth = x(row.worseShare);
      const inside = barWidth > 76;
      root
        .append("text")
        .attr("x", inside ? barWidth - 10 : barWidth + 10)
        .attr("y", y(row.factorLevel) + y.bandwidth() / 2 + 4)
        .attr("text-anchor", inside ? "end" : "start")
        .attr("fill", inside ? readableTextColor(fill, theme) : theme.label)
        .attr("font-size", 11)
        .attr("font-weight", 700)
        .text(`${Math.round(row.worseShare * 100)}%`);
    });

    svg
      .append("text")
      .attr("x", margin.left + innerWidth / 2)
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .attr("fill", theme.muted)
      .attr("font-size", 13)
      .attr("font-weight", 700)
      .text(`Combined share in ${worseLabels}`);

    svg
      .append("text")
      .attr("transform", `translate(16, ${margin.top + innerHeight / 2}) rotate(-90)`)
      .attr("text-anchor", "middle")
      .attr("fill", theme.muted)
      .attr("font-size", 13)
      .attr("font-weight", 700)
      .text(factor.label);
  }

  function renderOutcomePathChart(element, options) {
    const { matrix, factor, outcome } = options;
    const theme = themeTokens();
    element.innerHTML = "";
    if (!matrix.length) {
      element.innerHTML = `<div class="loading-state">No data available for this filter selection.</div>`;
      return;
    }

    const colors = outcomeColors(outcome.order.length);
    const width = Math.max(element.clientWidth || 760, 660);
    const height = 430;
    const margin = { top: 28, right: 132, bottom: 58, left: 72 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const maxPct = Math.max(0.25, d3.max(matrix, (row) => d3.max(row.percentages)) || 0.25);
    const x = d3
      .scalePoint()
      .domain(matrix.map((row) => row.factorLevel))
      .range([0, innerWidth])
      .padding(0.4);
    const y = d3.scaleLinear().domain([0, maxPct]).nice().range([innerHeight, 0]);

    const series = outcome.order.map((label, index) => ({
      label,
      color: colors[index],
      values: matrix.map((row) => ({
        factorLevel: row.factorLevel,
        pct: row.percentages[index],
        count: row.counts[index],
        total: row.total,
      })),
    }));

    const svg = d3
      .select(element)
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("role", "img")
      .attr("aria-label", `${factor.label} outcome trend lines`);

    const root = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    root
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
      .call((group) => {
        group.select(".domain").attr("stroke", theme.surfaceBorderStrong);
        group.selectAll("line").attr("stroke", theme.surfaceBorderStrong);
        group.selectAll("text").attr("fill", theme.label).attr("font-size", 11).attr("font-weight", 600);
      });

    root
      .append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat((value) => `${Math.round(value * 100)}%`))
      .call((group) => {
        group.select(".domain").attr("stroke", theme.surfaceBorderStrong);
        group.selectAll("line").attr("stroke", theme.surfaceBorderStrong);
        group.selectAll("text").attr("fill", theme.axis).attr("font-size", 11);
      });

    root
      .append("g")
      .selectAll("line")
      .data(y.ticks(5))
      .join("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", (value) => y(value))
      .attr("y2", (value) => y(value))
      .attr("stroke", theme.grid)
      .attr("stroke-dasharray", "4,4");

    const line = d3
      .line()
      .x((value) => x(value.factorLevel))
      .y((value) => y(value.pct))
      .curve(d3.curveMonotoneX);

    series.forEach((entry) => {
      root
        .append("path")
        .datum(entry.values)
        .attr("fill", "none")
        .attr("stroke", entry.color)
        .attr("stroke-width", 2.8)
        .attr("d", line);

      root
        .selectAll(`circle.series-${escapeHtml(entry.label).replace(/\s+/g, "-")}`)
        .data(entry.values)
        .join("circle")
        .attr("cx", (value) => x(value.factorLevel))
        .attr("cy", (value) => y(value.pct))
        .attr("r", 5)
        .attr("fill", entry.color)
        .attr("stroke", readableTextColor(entry.color, theme))
        .attr("stroke-width", 1.5)
        .on("mousemove", (event, value) => {
          showTooltip(
            event,
            `<strong>${escapeHtml(value.factorLevel)}</strong>${escapeHtml(
              entry.label
            )}<br>${(value.pct * 100).toFixed(1)}% of this row<br><span class="muted">${value.count.toLocaleString()} responses</span>`
          );
        })
        .on("mouseleave", hideTooltip);
    });

    const endLabels = series
      .map((entry) => {
        const last = entry.values[entry.values.length - 1];
        return {
          label: entry.label,
          color: entry.color,
          y: y(last.pct),
        };
      })
      .sort((left, right) => left.y - right.y);

    let previousY = -Infinity;
    endLabels.forEach((label) => {
      label.adjustedY = Math.max(label.y, previousY + 14);
      previousY = label.adjustedY;
    });

    endLabels.forEach((label) => {
      root
        .append("line")
        .attr("x1", innerWidth)
        .attr("x2", innerWidth + 8)
        .attr("y1", label.y)
        .attr("y2", label.adjustedY)
        .attr("stroke", label.color)
        .attr("stroke-width", 1.5);

      root
        .append("text")
        .attr("x", innerWidth + 12)
        .attr("y", label.adjustedY + 4)
        .attr("fill", label.color)
        .attr("font-size", 11)
        .attr("font-weight", 700)
        .text(label.label);
    });

    svg
      .append("text")
      .attr("x", margin.left + innerWidth / 2)
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .attr("fill", theme.muted)
      .attr("font-size", 13)
      .attr("font-weight", 700)
      .text(factor.label);

    svg
      .append("text")
      .attr("transform", `translate(18, ${margin.top + innerHeight / 2}) rotate(-90)`)
      .attr("text-anchor", "middle")
      .attr("fill", theme.muted)
      .attr("font-size", 13)
      .attr("font-weight", 700)
      .text("Share of each outcome level");
  }

  function renderBarList(element, items, colorLeft, colorRight) {
    element.innerHTML = "";
    if (!items.length) {
      element.innerHTML = `<div class="loading-state">No data available.</div>`;
      return;
    }
    const maxPct = d3.max(items, (item) => item.pct) || 1;
    const background =
      colorLeft === colorRight ? colorLeft : `linear-gradient(90deg, ${colorLeft}, ${colorRight})`;
    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "bar-row";
      row.innerHTML = `
        <div class="bar-topline">
          <span>${escapeHtml(item.label)}</span>
          <span>${Math.round(item.pct * 100)}% <span class="muted">(${item.count})</span></span>
        </div>
        <div class="bar-track">
          <span class="bar-fill" style="width:${(item.pct / maxPct) * 100}%; background:${background};"></span>
        </div>
      `;
      element.appendChild(row);
    });
  }

  function renderBenchmarkScatter(element, options) {
    const { rows, yKey, yLabel, selectedCountry, onSelect } = options;
    const theme = themeTokens();
    element.innerHTML = "";
    if (!rows.length) {
      element.innerHTML = `<div class="loading-state">No benchmark records available for this filter selection.</div>`;
      return;
    }

    const width = Math.max(element.clientWidth || 840, 680);
    const height = 520;
    const margin = { top: 30, right: 30, bottom: 68, left: 72 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const maxStudents = d3.max(rows, (row) => row.n_students) || 1;
    const averageSleep = d3.mean(rows, (row) => row.avg_sleep_hrs) || 0;
    const averageMetric = d3.mean(rows, (row) => row[yKey]) || 0;
    const x = d3
      .scaleLinear()
      .domain(d3.extent(rows, (row) => row.avg_sleep_hrs))
      .nice()
      .range([0, innerWidth]);
    const y = d3
      .scaleLinear()
      .domain(d3.extent(rows, (row) => row[yKey]))
      .nice()
      .range([innerHeight, 0]);
    const size = d3.scaleSqrt().domain([0, maxStudents]).range([7, 24]);

    const svg = d3
      .select(element)
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("role", "img")
      .attr("aria-label", `${yLabel} benchmark scatter plot`);

    const root = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    root
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(6))
      .call((group) => {
        group.select(".domain").attr("stroke", theme.surfaceBorderStrong);
        group.selectAll("line").attr("stroke", theme.surfaceBorderStrong);
        group.selectAll("text").attr("fill", theme.axis).attr("font-size", 11);
      });

    root
      .append("g")
      .call(d3.axisLeft(y).ticks(6))
      .call((group) => {
        group.select(".domain").attr("stroke", theme.surfaceBorderStrong);
        group.selectAll("line").attr("stroke", theme.surfaceBorderStrong);
        group.selectAll("text").attr("fill", theme.axis).attr("font-size", 11);
      });

    root
      .append("g")
      .selectAll("line.x-grid")
      .data(x.ticks(6))
      .join("line")
      .attr("x1", (value) => x(value))
      .attr("x2", (value) => x(value))
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("stroke", theme.grid)
      .attr("stroke-dasharray", "4,4");

    root
      .append("g")
      .selectAll("line.y-grid")
      .data(y.ticks(6))
      .join("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", (value) => y(value))
      .attr("y2", (value) => y(value))
      .attr("stroke", theme.grid)
      .attr("stroke-dasharray", "4,4");

    root
      .append("line")
      .attr("x1", x(averageSleep))
      .attr("x2", x(averageSleep))
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("stroke", theme.teal)
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "6,6");

    root
      .append("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", y(averageMetric))
      .attr("y2", y(averageMetric))
      .attr("stroke", theme.teal)
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "6,6");

    root
      .append("text")
      .attr("x", x(averageSleep) + 6)
      .attr("y", 14)
      .attr("fill", theme.teal)
      .attr("font-size", 11)
      .attr("font-weight", 700)
      .text("Visible mean sleep");

    root
      .append("text")
      .attr("x", innerWidth - 4)
      .attr("y", y(averageMetric) - 8)
      .attr("fill", theme.teal)
      .attr("font-size", 11)
      .attr("font-weight", 700)
      .attr("text-anchor", "end")
      .text("Visible mean burden");

    root
      .selectAll("circle")
      .data(rows)
      .join("circle")
      .attr("cx", (row) => x(row.avg_sleep_hrs))
      .attr("cy", (row) => y(row[yKey]))
      .attr("r", (row) => size(row.n_students))
      .attr("fill", (row) => REGION_COLORS[row.region] || "#4c7a9f")
      .attr("fill-opacity", (row) => (row.country === selectedCountry ? 0.94 : 0.78))
      .attr("stroke", (row) => (row.country === selectedCountry ? theme.teal : theme.surfaceBorderStrong))
      .attr("stroke-width", (row) => (row.country === selectedCountry ? 3 : row.is_primary ? 2.5 : 1.5))
      .style("cursor", "pointer")
      .on("mousemove", (event, row) => {
        showTooltip(
          event,
          `<strong>${escapeHtml(row.country)}</strong>${escapeHtml(row.region)}<br>${escapeHtml(
            yLabel
          )}: ${row[yKey]}<br>Average sleep: ${row.avg_sleep_hrs}h<br><span class="muted">n = ${row.n_students.toLocaleString()} · ${row.year}</span>`
        );
      })
      .on("mouseleave", hideTooltip)
      .on("click", (_, row) => {
        if (typeof onSelect === "function") onSelect(row.country);
      });

    root
      .selectAll("text.point-label")
      .data(rows.filter((row) => row.is_primary || row.country === selectedCountry))
      .join("text")
      .attr("class", "point-label")
      .attr("x", (row) => x(row.avg_sleep_hrs) + size(row.n_students) + 6)
      .attr("y", (row) => y(row[yKey]) + 4)
      .attr("fill", theme.label)
      .attr("font-size", 11)
      .attr("font-weight", 700)
      .text((row) => row.country);

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height - 14)
      .attr("text-anchor", "middle")
      .attr("fill", theme.axis)
      .attr("font-size", 12)
      .attr("font-weight", 600)
      .text("Average sleep hours");

    svg
      .append("text")
      .attr("transform", `translate(18, ${height / 2}) rotate(-90)`)
      .attr("text-anchor", "middle")
      .attr("fill", theme.axis)
      .attr("font-size", 12)
      .attr("font-weight", 600)
      .text(yLabel);

    svg
      .append("text")
      .attr("x", margin.left)
      .attr("y", 18)
      .attr("fill", theme.faint)
      .attr("font-size", 12)
      .text("Bubble size scales with sample size");
  }

  function renderBenchmarkBars(element, options) {
    const { rows, yKey, yLabel, selectedCountry, onSelect } = options;
    const theme = themeTokens();
    element.innerHTML = "";
    if (!rows.length) {
      element.innerHTML = `<div class="loading-state">No benchmark records available for this filter selection.</div>`;
      return;
    }

    const descending = yKey !== "avg_sleep_hrs";
    const sorted = [...rows].sort((left, right) =>
      descending ? d3.descending(left[yKey], right[yKey]) : d3.ascending(left[yKey], right[yKey])
    );
    const width = Math.max(element.clientWidth || 840, 700);
    const height = Math.max(380, sorted.length * 36 + 112);
    const margin = { top: 30, right: 122, bottom: 52, left: 226 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const averageMetric = d3.mean(sorted, (row) => row[yKey]) || 0;
    const x = d3.scaleLinear().domain([0, d3.max(sorted, (row) => row[yKey]) || 1]).nice().range([0, innerWidth]);
    const y = d3
      .scaleBand()
      .domain(sorted.map((row) => row.country))
      .range([0, innerHeight])
      .padding(0.24);

    const svg = d3
      .select(element)
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("role", "img")
      .attr("aria-label", `${yLabel} ranked comparison chart`);

    const root = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    root
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(6))
      .call((group) => {
        group.select(".domain").attr("stroke", theme.surfaceBorderStrong);
        group.selectAll("line").attr("stroke", theme.surfaceBorderStrong);
        group.selectAll("text").attr("fill", theme.axis).attr("font-size", 11);
      });

    root
      .append("g")
      .call(d3.axisLeft(y).tickSize(0))
      .call((group) => {
        group.select(".domain").remove();
        group.selectAll("text").attr("fill", theme.label).attr("font-size", 12).attr("font-weight", 600);
      });

    root
      .append("g")
      .selectAll("line")
      .data(x.ticks(6))
      .join("line")
      .attr("x1", (value) => x(value))
      .attr("x2", (value) => x(value))
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("stroke", theme.grid)
      .attr("stroke-dasharray", "4,4");

    root
      .append("line")
      .attr("x1", x(averageMetric))
      .attr("x2", x(averageMetric))
      .attr("y1", -6)
      .attr("y2", innerHeight)
      .attr("stroke", theme.teal)
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "6,6");

    root
      .append("text")
      .attr("x", x(averageMetric) + 6)
      .attr("y", -12)
      .attr("fill", theme.teal)
      .attr("font-size", 11)
      .attr("font-weight", 700)
      .text(`Visible average ${formatBenchmarkValue(averageMetric, yKey)}`);

    root
      .selectAll("rect.track")
      .data(sorted)
      .join("rect")
      .attr("x", 0)
      .attr("y", (row) => y(row.country))
      .attr("width", innerWidth)
      .attr("height", y.bandwidth())
      .attr("rx", 12)
      .attr("fill", theme.surfaceMuted);

    root
      .selectAll("rect.bar")
      .data(sorted)
      .join("rect")
      .attr("x", 0)
      .attr("y", (row) => y(row.country))
      .attr("width", (row) => x(row[yKey]))
      .attr("height", y.bandwidth())
      .attr("rx", 12)
      .attr("fill", (row) => REGION_COLORS[row.region] || "#4c7a9f")
      .attr("opacity", (row) => (row.country === selectedCountry ? 1 : 0.82))
      .attr("stroke", (row) => (row.country === selectedCountry ? theme.teal : "none"))
      .attr("stroke-width", (row) => (row.country === selectedCountry ? 3 : 0))
      .style("cursor", "pointer")
      .on("mousemove", (event, row) => {
        showTooltip(
          event,
          `<strong>${escapeHtml(row.country)}</strong>${escapeHtml(row.region)}<br>${escapeHtml(
            yLabel
          )}: ${formatBenchmarkValue(row[yKey], yKey)}<br>Average sleep: ${formatBenchmarkValue(
            row.avg_sleep_hrs,
            "avg_sleep_hrs"
          )}`
        );
      })
      .on("mouseleave", hideTooltip)
      .on("click", (_, row) => {
        if (typeof onSelect === "function") onSelect(row.country);
      });

    sorted.forEach((row) => {
      root
        .append("text")
        .attr("x", x(row[yKey]) + 8)
        .attr("y", y(row.country) + y.bandwidth() / 2 + 4)
        .attr("fill", theme.label)
        .attr("font-size", 11)
        .attr("font-weight", 700)
        .text(formatBenchmarkValue(row[yKey], yKey));

    });

    svg
      .append("text")
      .attr("x", margin.left + innerWidth / 2)
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .attr("fill", theme.muted)
      .attr("font-size", 13)
      .attr("font-weight", 700)
      .text(yLabel);
  }

  function renderBenchmarkQuadrants(element, options) {
    const { rows, yKey, yLabel, selectedCountry, onSelect } = options;
    element.innerHTML = "";
    if (!rows.length) {
      element.innerHTML = `<div class="loading-state">No benchmark records available for this filter selection.</div>`;
      return;
    }

    const averageSleep = d3.mean(rows, (row) => row.avg_sleep_hrs) || 0;
    const averageMetric = d3.mean(rows, (row) => row[yKey]) || 0;

    const quadrants = [
      {
        key: "strain",
        title: "Strain hotspot",
        description: "Shorter sleep and higher burden than the visible average.",
        rows: rows.filter((row) => row.avg_sleep_hrs < averageSleep && row[yKey] >= averageMetric),
      },
      {
        key: "pressure",
        title: "Pressure despite sleep",
        description: "Longer sleep but still above-average burden.",
        rows: rows.filter((row) => row.avg_sleep_hrs >= averageSleep && row[yKey] >= averageMetric),
      },
      {
        key: "shortfall",
        title: "Sleep shortfall",
        description: "Shorter sleep with a lower reported burden than average.",
        rows: rows.filter((row) => row.avg_sleep_hrs < averageSleep && row[yKey] < averageMetric),
      },
      {
        key: "steady",
        title: "Protected pattern",
        description: "Longer sleep and lower burden than the visible average.",
        rows: rows.filter((row) => row.avg_sleep_hrs >= averageSleep && row[yKey] < averageMetric),
      },
    ];

    const note = document.createElement("div");
    note.className = "quadrant-note";
    note.textContent = `Visible averages: ${averageSleep.toFixed(1)}h sleep and ${formatBenchmarkValue(
      averageMetric,
      yKey
    )} on ${yLabel.toLowerCase()}.`;
    element.appendChild(note);

    const wrapper = document.createElement("div");
    wrapper.className = "quadrant-grid";

    quadrants.forEach((quadrant) => {
      const card = document.createElement("article");
      card.className = "quadrant-card";
      const sortedRows = [...quadrant.rows].sort((left, right) => {
        if (left.country === selectedCountry) return -1;
        if (right.country === selectedCountry) return 1;
        return d3.descending(left[yKey], right[yKey]);
      });

      card.innerHTML = `
        <div class="quadrant-topline">
          <div>
            <h4>${escapeHtml(quadrant.title)}</h4>
            <p class="small-copy">${escapeHtml(quadrant.description)}</p>
          </div>
          <span class="quadrant-count">${sortedRows.length}</span>
        </div>
        <div class="quadrant-country-list">
          ${
            sortedRows.length
              ? sortedRows
                  .map((row) => {
                    const selectedClass = row.country === selectedCountry ? " selected" : "";
                    return `<button class="quadrant-country${selectedClass}" type="button" data-country="${escapeHtml(
                      row.country
                    )}" title="${escapeHtml(
                      `${row.country}: ${formatBenchmarkValue(row[yKey], yKey)} and ${row.avg_sleep_hrs}h sleep`
                    )}">${escapeHtml(row.country)}</button>`;
                  })
                  .join("")
              : '<span class="small-copy">No visible countries in this quadrant.</span>'
          }
        </div>
      `;

      wrapper.appendChild(card);
    });

    element.appendChild(wrapper);
    element.querySelectorAll("[data-country]").forEach((button) => {
      button.addEventListener("click", () => {
        if (typeof onSelect === "function") onSelect(button.dataset.country);
      });
    });
  }

  window.SleepSignalsCharts = {
    outcomeColors,
    REGION_COLORS,
    renderLegend,
    renderStackedOutcomeChart,
    renderHeatmap,
    renderWorseShareChart,
    renderOutcomePathChart,
    renderBenchmarkScatter,
    renderBenchmarkBars,
    renderBenchmarkQuadrants,
    renderBarList,
    escapeHtml,
  };
})();
