/**
 * ═══════════════════════════════════════════════════════════════
 *  CONTENT.JS — All editable text lives here.
 *  Edit freely; you won't break any visualization code.
 *
 *  Rules:
 *    • Keep each value as a plain string (wrap in backticks `` for multi-line).
 *    • HTML tags are OK inside strings (e.g. <span>, <br>, <strong>).
 *    • Do NOT rename the keys (left side of the colon).
 * ═══════════════════════════════════════════════════════════════
 */
const CONTENT = {

  // ── HERO ──
  hero: {
    overline: "",
    title: "Are Singaporeans Being Replaced by Foreign Labour?",
    subtitle: `It's the question that dominates online forums, dinner-table debates,
      and policy discussions. We analysed 4,000+ online posts, three decades of
      government employment data, and UN migration records to find out.`,
    scrollCue: "↓ Scroll to explore",
  },

  // ── VIZ 1: Stance Chart ──
  stance: {
    num: "Part 1 · The Perception",
    title: "What Are People Actually Saying?",
    desc: `We classified 4,063 online posts (Reddit + The Independent SG, 2015 – 2025) by
      stance: <span class="inline-anti">concerned</span>,
      <span class="inline-pro">supportive</span>, or neutral. Most discourse is measured,
      but the vocal minority is sharply split — and fear of displacement is the loudest signal.`,
  },

  // ── VIZ 2: Word Clouds ──
  clouds: {
    num: "Part 2 · The Divide",
    title: "The Language of Division",
    desc: `So what exactly are people worried about — and what do supporters actually praise?
      Both sides invoke the same reality — foreign workers in daily life — but frame it
      in opposing terms. The concerned camp speaks of "job displacement" and
      "CECA criticism" (the Comprehensive Economic Cooperation Agreement with India);
      supporters counter with "cultural integration" and "economic growth".`,
    labelAnti: "Concerns",
    labelPro: "Support",
  },

  // ── VIZ 3: Globe ──
  globe: {
    num: "Part 3 · The Origins",
    title: "Where Do They Come From?",
    desc: `These debates often single out specific nationalities — Indian professionals,
      Bangladeshi construction workers, Chinese immigrants. But Singapore draws migrants from
      15+ countries, and the mix has shifted dramatically since 1990. Scroll to watch three
      decades of migration unfold. Hover for sparklines; drag to rotate.`,
  },

  // ── VIZ 4: Labor Share ──
  laborShare: {
    num: "Part 4 · The Evidence",
    title: "The Changing Face of Singapore's Workforce",
    desc: `Now we know what people think and where the workers come from.
      The critical question remains: did their arrival come at the expense
      of Singaporean jobs — or alongside them? Scroll through 36 years of
      government employment data to find out.`,
  },

  // ── CONCLUSION ──
  conclusion: {
    title: "So, Are Singaporeans Being Replaced?",
    answer: `No — but the data reveals something arguably more important:
      Singapore's economy has become structurally dependent on foreign labour,
      and that dependence looks very different depending on where you look.`,

    ev1Label: "What people feel",
    ev1: `Public concern is real: <strong>23%</strong> of 4,063 online posts express worry about
      foreign workers, with <strong>Identity &amp; Culture</strong> the most contested topic
      (46% concerned). The language is telling — "job displacement" and "CECA criticism" dominate
      the concerned camp, while supporters speak of "cultural integration" and "economic growth".
      These aren't fringe voices; they reflect a genuine tension between lived experience
      and economic reality.`,

    ev2Label: "Who they are",
    ev2: `Singapore's migrant workforce isn't monolithic. <strong>Malaysia</strong> has always
      been the largest source (1.1M by 2020), but the fastest growth came from
      <strong>South Asia</strong> — India and Pakistan each grew ~930% since 1990, and
      Bangladesh ~800%. The composition shifted from a Malaysia–China base toward a far more
      diverse mix, mirroring the economy's own diversification from manufacturing toward
      services and construction.`,

    ev3Label: "What the numbers say",
    ev3: `In 36 years, total employment nearly tripled from <strong>1.48M to 4.12M</strong>.
      Critically, <strong>resident employment also grew</strong> — from 1.13M to 2.38M (+111%).
      But non-resident employment grew faster (+397%), pushing the foreign share from
      <strong>24% to 42%</strong>. The story is radically different by sector: Construction
      runs on <strong>82% foreign labour</strong>; Info &amp; Comms went from 15% to 26% foreign
      in just 16 years. The 2020 COVID shock — when 173,000 non-residents left in a single year
      — didn't free up jobs for residents. It exposed structural dependence.`,

    ev4Label: "The real question",
    ev4: `Aggregate resident employment has grown every decade — net replacement did not happen
      at the macro level. But the economy's growth model now requires nearly
      <strong>twice as many foreign workers</strong> as it did a generation ago.
      Construction cannot function without them. Knowledge sectors are increasingly
      recruiting internationally. The question isn't whether foreigners replaced Singaporeans
      — it's whether this level of dependency is sustainable, and whether the benefits are
      reaching the Singaporeans who feel most anxious about it.`,

    closing: `The data doesn't give us a simple yes or no.
      It gives us something more useful: a clear-eyed picture of what actually changed,
      where, and how fast — so the conversation can move beyond headlines.`,
  },

  // ── FOOTER ──
  footer: "",
};
