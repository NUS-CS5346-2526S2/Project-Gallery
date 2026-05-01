/**
 * Sentiment timeline — anti% and pro% over time.
 * Lecture 2: Position (line) for quantitative over time. Dot size for sample count.
 * Lecture 10: Draw-on animation — lines trace left to right (Congruence: time flows right).
 *             Dots fade in after lines finish. 600-800ms per line (Apprehension).
 */
const SentimentTimeline = (() => {
    const C = { anti: "#c62828", pro: "#1565c0" };
    const margin = { top: 20, right: 90, bottom: 40, left: 45 };

    function render(selector, data) {
        const svg = d3.select(selector);
        const w = svg.node().parentElement.getBoundingClientRect().width - margin.left - margin.right;
        const h = 260 - margin.top - margin.bottom;
        svg.attr("width", w + margin.left + margin.right).attr("height", h + margin.top + margin.bottom);
        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        const filtered = data.filter(d => d.year >= 2015 && d.year <= 2025);
        const x = d3.scaleLinear().domain(d3.extent(filtered, d => d.year)).range([0, w]);
        const maxP = d3.max(filtered, d => Math.max(d.antiPct, d.proPct));
        const y = d3.scaleLinear().domain([0, maxP * 1.2]).range([h, 0]);
        const sz = d3.scaleSqrt().domain([0, d3.max(filtered, d => d.total)]).range([3, 7]);

        // Grid
        g.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(4).tickSize(-w).tickFormat(""));

        // --- ANIMATED LINES (draw-on effect) ---
        const mkLine = key => d3.line().x(d => x(d.year)).y(d => y(d[key])).curve(d3.curveMonotoneX);

        function drawLine(lineData, key, color, delay) {
            const path = g.append("path").datum(lineData).attr("d", mkLine(key))
                .attr("fill", "none").attr("stroke", color).attr("stroke-width", 2.5);
            const len = path.node().getTotalLength();
            path.attr("stroke-dasharray", len)
                .attr("stroke-dashoffset", len)
                .transition()
                .delay(delay)
                .duration(800)
                .ease(d3.easeCubicOut)
                .attr("stroke-dashoffset", 0);
        }

        drawLine(filtered, "antiPct", C.anti, 0);
        drawLine(filtered, "proPct", C.pro, 400);  // staggered start

        // --- ANIMATED DOTS (fade in after lines) ---
        filtered.forEach((d, i) => {
            const op = d.total < 50 ? 0.35 : 0.85;
            const dotDelay = 800 + i * 60;  // after lines finish, stagger per dot

            g.append("circle").attr("cx", x(d.year)).attr("cy", y(d.antiPct))
                .attr("r", sz(d.total)).attr("fill", C.anti)
                .attr("opacity", 0)
                .transition().delay(dotDelay).duration(300)
                .attr("opacity", op);

            g.append("circle").attr("cx", x(d.year)).attr("cy", y(d.proPct))
                .attr("r", sz(d.total)).attr("fill", C.pro)
                .attr("opacity", 0)
                .transition().delay(dotDelay).duration(300)
                .attr("opacity", op);
        });

        // --- END LABELS (fade in last) ---
        const last = filtered[filtered.length - 1];
        const labelDelay = 800 + filtered.length * 60 + 200;

        g.append("text").attr("x", x(last.year) + 8).attr("y", y(last.antiPct) + 4)
            .style("font-size", "10px").style("font-weight", "700").style("fill", C.anti)
            .style("opacity", 0)
            .text(last.antiPct + "% concerned")
            .transition().delay(labelDelay).duration(400).style("opacity", 1);

        g.append("text").attr("x", x(last.year) + 8).attr("y", y(last.proPct) + 4)
            .style("font-size", "10px").style("font-weight", "700").style("fill", C.pro)
            .style("opacity", 0)
            .text(last.proPct + "% supportive")
            .transition().delay(labelDelay).duration(400).style("opacity", 1);

        // Note
        g.append("text").attr("x", w / 2).attr("y", h + 30)
            .attr("text-anchor", "middle")
            .style("font-size", "8px").style("fill", "#bbb")
            .text("Faded dots = fewer than 50 posts (low confidence)");

        // Axes (static — appear immediately)
        g.append("g").attr("class", "axis").attr("transform", `translate(0,${h})`)
            .call(d3.axisBottom(x).ticks(filtered.length).tickFormat(d3.format("d")));
        g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(4).tickFormat(d => d + "%"));
    }
    return { render };
})();
