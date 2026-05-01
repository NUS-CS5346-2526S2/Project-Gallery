/**
 * Diverging horizontal bar chart — anti (left) vs pro (right).
 * Lecture 2: Position (bar length) encodes magnitude. Color only for category (anti/pro).
 * Lecture 4: Sorted by anti% descending — most concerning topic at top.
 */
const StanceChart = (() => {
    const C = { anti: "#c62828", pro: "#1565c0", neutral: "#ccc" };
    const margin = { top: 24, right: 70, bottom: 20, left: 160 };
    let svg, g, width, height;

    function init(selector) {
        svg = d3.select(selector);
        const w = svg.node().parentElement.getBoundingClientRect().width;
        width = w - margin.left - margin.right;
        height = 240;
        svg.attr("width", w).attr("height", height + margin.top + margin.bottom);
        g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    }

    function render(data, samplePosts) {
        g.selectAll("*").remove();
        data = data.filter(d => d.total >= 5 && d.topic !== "General");
        // Lecture 4: Sort by concern level, not alphabetical
        data.sort((a, b) => b.antiPct - a.antiPct);

        const y = d3.scaleBand().domain(data.map(d => d.topic)).range([0, height]).padding(0.3);
        const maxVal = d3.max(data, d => Math.max(d.anti, d.pro));
        const x = d3.scaleLinear().domain([0, maxVal * 1.15]).range([0, width / 2]);

        // Center axis
        g.append("line")
            .attr("x1", width / 2).attr("x2", width / 2)
            .attr("y1", -8).attr("y2", height)
            .attr("stroke", "#e0e0e0");

        // Column headers
        g.append("text").attr("x", width / 4).attr("y", -12)
            .attr("text-anchor", "middle")
            .style("font-size", "10px").style("font-weight", "600").style("fill", C.anti)
            .text("Concerned");
        g.append("text").attr("x", width * 3 / 4).attr("y", -12)
            .attr("text-anchor", "middle")
            .style("font-size", "10px").style("font-weight", "600").style("fill", C.pro)
            .text("Supportive");

        // Y axis labels
        g.append("g").call(d3.axisLeft(y).tickSize(0).tickPadding(10))
            .select(".domain").remove();
        g.selectAll(".tick text").style("font-size", "11px").style("font-weight", "600");

        // Anti bars (left)
        g.selectAll(".bar-a").data(data).enter().append("rect")
            .attr("x", d => width / 2 - x(d.anti))
            .attr("y", d => y(d.topic))
            .attr("width", 0).attr("height", y.bandwidth())
            .attr("rx", 3).attr("fill", C.anti).attr("opacity", 0.8)
            .on("mouseenter", function(e, d) {
                d3.select(this).attr("opacity", 1);
                const q = findQuote(samplePosts, d.topic, "anti");
                Tooltip.show(e, { topic: d.topic, stance: "anti", detail: `${d.anti} posts (${d.antiPct}%)`, quote: q });
            })
            .on("mousemove", e => Tooltip.move(e))
            .on("mouseleave", function() { d3.select(this).attr("opacity", 0.8); Tooltip.hide(); })
            .transition().duration(600).ease(d3.easeCubicOut)
            .attr("width", d => x(d.anti));

        // Pro bars (right)
        g.selectAll(".bar-p").data(data).enter().append("rect")
            .attr("x", width / 2)
            .attr("y", d => y(d.topic))
            .attr("width", 0).attr("height", y.bandwidth())
            .attr("rx", 3).attr("fill", C.pro).attr("opacity", 0.8)
            .on("mouseenter", function(e, d) {
                d3.select(this).attr("opacity", 1);
                const q = findQuote(samplePosts, d.topic, "pro");
                Tooltip.show(e, { topic: d.topic, stance: "pro", detail: `${d.pro} posts (${d.proPct}%)`, quote: q });
            })
            .on("mousemove", e => Tooltip.move(e))
            .on("mouseleave", function() { d3.select(this).attr("opacity", 0.8); Tooltip.hide(); })
            .transition().duration(600).ease(d3.easeCubicOut)
            .attr("width", d => x(d.pro));

        // Count labels
        g.selectAll(null).data(data).enter().append("text")
            .attr("x", d => width / 2 - x(d.anti) - 6)
            .attr("y", d => y(d.topic) + y.bandwidth() / 2 + 4)
            .attr("text-anchor", "end")
            .style("font-size", "10px").style("font-weight", "600").style("fill", C.anti)
            .text(d => d.anti);
        g.selectAll(null).data(data).enter().append("text")
            .attr("x", d => width / 2 + x(d.pro) + 6)
            .attr("y", d => y(d.topic) + y.bandwidth() / 2 + 4)
            .style("font-size", "10px").style("font-weight", "600").style("fill", C.pro)
            .text(d => d.pro);

        // Total sample count note
        const totalN = data.reduce((s, d) => s + d.total, 0);
        g.append("text")
            .attr("x", width / 2).attr("y", height + 14)
            .attr("text-anchor", "middle")
            .style("font-size", "9px").style("fill", "#bbb")
            .text(`Based on ${totalN.toLocaleString()} posts${totalN < 100 ? " (small sample — interpret with caution)" : ""}`);
    }

    function findQuote(posts, topic, stance) {
        if (!posts) return "";
        const m = posts.filter(p => p.topic === topic && p.stance === stance);
        return m.length ? `"${m[Math.floor(Math.random() * m.length)].text}"` : "";
    }

    return { init, render };
})();
