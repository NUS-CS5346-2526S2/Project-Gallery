/**
 * Side-by-side word clouds for anti (concerns) and pro (support) themes.
 * Lecture 2: Size encodes frequency. Color for category (red/blue). Spatial grouping (Gestalt).
 * Rendered as two separate SVGs for clean layout.
 */
const ThemeClouds = (() => {
    function render(antiSelector, proSelector, data) {
        if (!data || !data.anti || !data.pro) return;
        renderCloud(antiSelector, data.anti, "#c62828");
        renderCloud(proSelector, data.pro, "#1565c0");
    }

    function renderCloud(selector, words, color) {
        const svg = d3.select(selector);
        const w = svg.node().parentElement.getBoundingClientRect().width;
        const h = 280;
        svg.attr("width", w).attr("height", h);

        const maxC = d3.max(words, d => d.count);
        const minC = d3.min(words, d => d.count);
        const fontSize = d3.scaleLinear().domain([minC, maxC]).range([11, 26]);
        const opacity = d3.scaleLinear().domain([minC, maxC]).range([0.4, 1]);

        const cx = w / 2, cy = h / 2;

        // Place nodes with force simulation
        const nodes = words.map(d => ({
            text: d.theme, count: d.count, size: fontSize(d.count),
            x: cx + (Math.random() - 0.5) * w * 0.4,
            y: cy + (Math.random() - 0.5) * h * 0.4,
        }));

        const sim = d3.forceSimulation(nodes)
            .force("x", d3.forceX(cx).strength(0.04))
            .force("y", d3.forceY(cy).strength(0.04))
            .force("collide", d3.forceCollide(d => d.size * 2.2))
            .stop();
        for (let i = 0; i < 120; i++) sim.tick();

        svg.selectAll("text").data(nodes).enter()
            .append("text")
            .attr("x", d => d.x).attr("y", d => d.y)
            .attr("text-anchor", "middle").attr("dominant-baseline", "middle")
            .style("font-size", d => d.size + "px")
            .style("font-weight", d => d.count > maxC * 0.5 ? "700" : "400")
            .style("fill", color)
            .style("opacity", d => opacity(d.count))
            .style("cursor", "default")
            .text(d => d.text)
            .on("mouseenter", function(e, d) {
                d3.select(this).style("opacity", 1).style("font-weight", "800");
                Tooltip.show(e, {
                    topic: d.text,
                    stance: color === "#c62828" ? "anti" : "pro",
                    detail: `Mentioned in ${d.count} posts`,
                });
            })
            .on("mousemove", e => Tooltip.move(e))
            .on("mouseleave", function(e, d) {
                d3.select(this).style("opacity", opacity(d.count))
                    .style("font-weight", d.count > maxC * 0.5 ? "700" : "400");
                Tooltip.hide();
            });
    }

    return { render };
})();
