const Tooltip = (() => {
    let el;
    function init() { el = document.getElementById("tooltip"); }
    function show(event, d) {
        if (!el) init();
        el.querySelector(".tooltip-topic").textContent = d.topic || "";
        const s = el.querySelector(".tooltip-stance");
        s.textContent = d.stance || "";
        s.className = `tooltip-stance ${d.stance || ""}`;
        el.querySelector(".tooltip-count").textContent = d.detail || "";
        const q = el.querySelector(".tooltip-quote");
        if (d.quote) { q.textContent = d.quote; q.style.display = "block"; }
        else { q.style.display = "none"; }
        el.classList.remove("hidden");
        move(event);
    }
    function move(e) {
        const pad = 14;
        let x = e.clientX + pad, y = e.clientY - (el.offsetHeight / 2);
        if (x + el.offsetWidth > window.innerWidth) x = e.clientX - el.offsetWidth - pad;
        if (y < pad) y = pad;
        if (y + el.offsetHeight > window.innerHeight - pad) y = window.innerHeight - el.offsetHeight - pad;
        el.style.left = x + "px";
        el.style.top = y + "px";
    }
    function hide() { if (!el) init(); el.classList.add("hidden"); }
    return { init, show, move, hide };
})();
