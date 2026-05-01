/**
 * Stacked area chart — topic proportions over time.
 * Lecture 2: Position (area boundaries) for magnitude. Consistent color per topic.
 * Lecture 10: Sequential build — layers stack one at a time (300ms delay between).
 *             Shows how each topic contributes to the whole. < 6 animated objects.
 *             Congruence: areas grow upward (more = higher).
 */
const TopicStream = (() => {
    const margin = { top: 20, right: 130, bottom: 40, left: 45 };
    const COLORS = {
        "Jobs & Employment": "#c62828",
        "Policy & Government": "#1565c0",
        "Economy & Wages": "#e65100",
        "Worker Welfare & Rights": "#2e7d32",
        "Identity & Culture": "#6a1b9a",
    };

    function render(selector, data) {
        if (!data || data.length === 0) return;

        const svg = d3.select(selector);
        const w = svg.node().parentElement.getBoundingClientRect().width - margin.left - margin.right;
        const h = 280 - margin.top - margin.bottom;
        svg.attr("width", w + margin.left + margin.right).attr("height", h + margin.top + margin.bottom);
        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        const topics = Object.keys(data[0]).filter(k => k !== "year" && COLORS[k]);
        const x = d3.scaleLinear().domain(d3.extent(data, d => d.year)).range([0, w]);

        const stack = d3.stack().keys(topics).order(d3.stackOrderNone).offset(d3.stackOffsetNone);
        const series = stack(data);

        const yMax = d3.max(series[series.length - 1], d => d[1]);
        const y = d3.scaleLinear().domain([0, yMax]).range([h, 0]);

        // Grid
        g.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(4).tickSize(-w).tickFormat(""));

        // --- ANIMATED AREAS — each layer fades in sequentially ---
        const area = d3.area()
            .x(d => x(d.data.year)).y0(d => y(d[0])).y1(d => y(d[1]))
            .curve(d3.curveMonotoneX);

        // Start all areas flat at baseline, then transition to full height
        series.forEach((s, i) => {
            // Flat area (y0 = y1 = baseline of this layer)
            const flatArea = d3.area()
                .x(d => x(d.data.year))
                .y0(d => y(d[0]))
                .y1(d => y(d[0]))  // collapsed
                .curve(d3.curveMonotoneX);

            g.append("path")
                .datum(s)
                .attr("d", flatArea)  // start collapsed
                .attr("fill", COLORS[s.key] || "#ccc")
                .attr("opacity", 0.75)
                .attr("stroke", "#fff")
                .attr("stroke-width", 0.5)
                .transition()
                .delay(i * 300)       // stagger: 300ms between layers
                .duration(600)
                .ease(d3.easeCubicOut)
                .attr("d", area);     // expand to full
        });

        // --- RIGHT-SIDE LABELS (fade in after all areas) ---
        const totalDelay = series.length * 300 + 600;

        series.forEach(s => {
            const last = s[s.length - 1];
            const mid = (y(last[0]) + y(last[1])) / 2;
            if (last[1] - last[0] > 3) {
                g.append("text")
                    .attr("x", w + 8).attr("y", mid + 4)
                    .style("font-size", "9px")
                    .style("fill", COLORS[s.key] || "#666")
                    .style("font-weight", "600")
                    .style("opacity", 0)
                    .text(s.key)
                    .transition()
                    .delay(totalDelay)
                    .duration(400)
                    .style("opacity", 1);
            }
        });

        // Axes (static)
        g.append("g").attr("class", "axis").attr("transform", `translate(0,${h})`)
            .call(d3.axisBottom(x).ticks(data.length).tickFormat(d3.format("d")));
        g.append("g").attr("class", "axis")
            .call(d3.axisLeft(y).ticks(4));
    }
    return { render };
})();
