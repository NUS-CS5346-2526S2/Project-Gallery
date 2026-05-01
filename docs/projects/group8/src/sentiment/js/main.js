/**
 * Main orchestrator.
 * Lecture 3: Sequential rendering via scroll — exposition → rising → climax → resolution.
 * Lecture 10: IntersectionObserver triggers charts only when visible (purposeful, not decorative).
 */

function filterTopics(topics) {
    return topics.filter(t => t.total >= 5 && t.topic !== "General");
}

(async function main() {
    try {
        const data = await d3.json("viz_data.json");
        if (!data || !data.perception) return;

        // Hero stat
        document.getElementById("stat-posts").textContent = data.meta.totalPosts.toLocaleString();

        // Auto-generate insight text
        const topAnti = filterTopics(data.perception.byTopic).sort((a, b) => b.antiPct - a.antiPct)[0];
        if (topAnti) {
            const el = document.getElementById("insight-stance");
            if (el) el.textContent = `"${topAnti.topic}" has the highest concern at ${topAnti.antiPct}% — making it the most contested topic in online discourse.`;
        }

        Tooltip.init();
        setupFilters(data);

        // Scroll observer
        const rendered = new Set();
        const observer = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting && !rendered.has(e.target.id)) {
                    rendered.add(e.target.id);
                    renderSection(e.target.id, data);
                }
            });
        }, { threshold: 0.15 });

        document.querySelectorAll(".section").forEach(s => observer.observe(s));

        renderSection("overview", data);
        rendered.add("overview");

    } catch (err) {
        console.error("Failed:", err);
    }
})();

function renderSection(id, data) {
    switch (id) {
        case "overview":
            StanceChart.init("#stance-chart");
            StanceChart.render(filterTopics(data.perception.byTopic), data.perception.samplePosts);
            break;
        case "timeline":
            SentimentTimeline.render("#sentiment-timeline", data.perception.byYear);
            break;
        case "themes":
            if (data.perception.themes) {
                ThemeClouds.render("#cloud-anti", "#cloud-pro", data.perception.themes);
            }
            break;
        case "topics":
            if (data.perception.topicByYear) {
                TopicStream.render("#topic-stream", data.perception.topicByYear);
            }
            break;
    }
}

function setupFilters(data) {
    const container = document.getElementById("source-filters");
    const labels = { reddit: "Reddit", independent_sg: "Independent SG" };

    data.meta.sources.forEach(src => {
        const btn = document.createElement("button");
        btn.className = "filter-btn";
        btn.dataset.source = src;
        btn.textContent = labels[src] || src;
        container.appendChild(btn);
    });

    container.querySelectorAll(".filter-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            container.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            const src = btn.dataset.source;

            let filtered;
            if (src === "all") {
                filtered = data.perception.byTopic;
            } else {
                const raw = data.perception.byTopicAndSource.filter(d => d.source === src);
                const map = {};
                raw.forEach(d => {
                    if (!map[d.topic]) map[d.topic] = { topic: d.topic, anti: 0, pro: 0, neutral: 0, total: 0 };
                    map[d.topic].anti += d.anti; map[d.topic].pro += d.pro;
                    map[d.topic].neutral += d.neutral; map[d.topic].total += d.total;
                });
                filtered = Object.values(map).map(d => ({
                    ...d,
                    antiPct: d.total ? +(d.anti / d.total * 100).toFixed(1) : 0,
                    proPct: d.total ? +(d.pro / d.total * 100).toFixed(1) : 0,
                }));
            }
            d3.select("#stance-chart").selectAll("*").remove();
            StanceChart.init("#stance-chart");
            StanceChart.render(filterTopics(filtered), data.perception.samplePosts);
        });
    });
}
