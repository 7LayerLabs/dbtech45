export type NewsSource = {
  label: string;
  url: string;
};

export type NewsStory = {
  headline: string;
  url: string;
  brief: string;
  sources: NewsSource[];
};

export type NewsCategory = {
  name: string;
  stories: NewsStory[];
};

export type DailyNewsBrief = {
  date: string;
  dateTime: string;
  summary: string;
  categories: NewsCategory[];
};

export const dailyNewsBrief: DailyNewsBrief = {
  date: "Friday, July 24, 2026",
  dateTime: "2026-07-24",
  summary:
    "War-driven oil and rate risk is colliding with an acceleration in practical agents, while restaurants are shifting from price increases toward measurable automation and revenue tools.",
  categories: [
    {
      name: "World & Markets",
      stories: [
        {
          headline:
            "The U.S.-Iran conflict is widening across two critical shipping routes",
          url: "https://apnews.com/article/iran-us-hormuz-strait-war-24-july-2026-78c2dbf538f6e61ab816479a4d9bdd85",
          brief:
            "The U.S. completed a 13th consecutive night of strikes as Iran targeted regional U.S. positions and Houthi attacks pulled the Red Sea into the conflict. Brent briefly exceeded $100, Hormuz traffic nearly stopped, and Saudi Arabia has now retaliated against Houthi targets in Yemen. Watch for diplomacy, further shipping disruption, and direct effects on fuel, food, freight, and consumer spending.",
          sources: [
            {
              label: "Associated Press",
              url: "https://apnews.com/article/iran-us-hormuz-strait-war-24-july-2026-78c2dbf538f6e61ab816479a4d9bdd85",
            },
          ],
        },
        {
          headline:
            "Next week is a three-way market stress test: Fed, oil, and AI earnings",
          url: "https://www.marketscreener.com/news/us-stocks-face-tests-from-fed-decision-tech-led-earnings-deluge-ce7f51dfda8eff25",
          brief:
            "Fed futures priced a 36% chance of a July 29 hike after oil and inflation fears pushed the 10-year Treasury above 4.7%. Microsoft, Meta, Amazon, Apple, GDP, and PCE arrive in the same window, with investors newly skeptical about hyperscaler AI spending after Alphabet and Tesla sold off. This is a poor week for undisciplined options exposure.",
          sources: [
            {
              label: "MarketScreener / Reuters",
              url: "https://www.marketscreener.com/news/us-stocks-face-tests-from-fed-decision-tech-led-earnings-deluge-ce7f51dfda8eff25",
            },
          ],
        },
      ],
    },
    {
      name: "AI & Builders",
      stories: [
        {
          headline: "OpenAI adds natural voice control to Codex and Work",
          url: "https://help.openai.com/en/articles/6825453-chatgpt-release-notes",
          brief:
            "Users can now speak, interrupt, and direct tasks inside Codex and Work on the desktop app, including coordinating work across threads. Combined with remote control and multi-folder projects, this moves coding agents closer to persistent operators that can be steered while away from the keyboard.",
          sources: [
            {
              label: "OpenAI release notes",
              url: "https://help.openai.com/en/articles/6825453-chatgpt-release-notes",
            },
          ],
        },
        {
          headline:
            "Cline demonstrates agent-led improvement of its own coding harness",
          url: "https://cline.ghost.io/recursive-self-improvement-for-coding-agents/",
          brief:
            "A 17-hour run used GPT-5.6-Sol to diagnose and patch Cline, taking Kimi K3 on Terminal-Bench 2.1 from 77.5% to 88.8% while cutting the final run cost from $79 to $49.80. The fixes were practical reliability work—retries, loop detection, process handling, and liveness—not model training. Long-running eval-and-repair loops can improve an agent harness more cheaply than repeated manual tuning, provided humans review the final changes.",
          sources: [
            {
              label: "Cline",
              url: "https://cline.ghost.io/recursive-self-improvement-for-coding-agents/",
            },
          ],
        },
        {
          headline: "Cognition buys Poke to make Devin proactive and conversational",
          url: "https://cognition.ai/blog/interaction",
          brief:
            "Poke, a personal agent living in text messages, recorded more than 100 million messages in three months and is reportedly the only AI agent approved for native Apple Messages use. Cognition says its proactive, relationship-like interface is how Devin should eventually feel. Model competence alone is no longer enough; continuity, initiative, and low-friction messaging are becoming acquisition-grade assets.",
          sources: [
            {
              label: "Cognition",
              url: "https://cognition.ai/blog/interaction",
            },
          ],
        },
        {
          headline: "FLUX 3 unifies image, video, audio, and action prediction",
          url: "https://bfl.ai/blog/flux-3",
          brief:
            "Black Forest Labs’ early-access model can generate video with native audio up to 20 seconds, use image and video references, render multilingual dialogue, and chain clips into longer sequences. BFL claims strong preliminary preferences over several competitors, but full benchmarks, pricing, and broad access remain pending.",
          sources: [
            {
              label: "Black Forest Labs",
              url: "https://bfl.ai/blog/flux-3",
            },
          ],
        },
        {
          headline: "An AI lab is shopping for a micro-SaaS company to run with an AI CEO",
          url: "https://betakit.com/canadian-deep-learning-pioneers-are-building-ai-to-replace-ceos/",
          brief:
            "Skyfall AI says it will acquire a micro-B2B-SaaS business for up to $1 million, install a world-model-based operating system, and attempt to double revenue in six months. It is a speculative demonstration, not a proven operating model, but the experiment could create a new buyer class for clean, documented, low-headcount SaaS assets.",
          sources: [
            {
              label: "BetaKit",
              url: "https://betakit.com/canadian-deep-learning-pioneers-are-building-ai-to-replace-ceos/",
            },
          ],
        },
      ],
    },
    {
      name: "Restaurant Business",
      stories: [
        {
          headline:
            "CloudKitchens parent Atoms raises $1.7 billion to automate physical operations",
          url: "https://www.nrn.com/restaurant-technology/cloudkitchens-owner-raises-1-7b-to-automate-restaurants-and-more",
          brief:
            "Travis Kalanick is combining CloudKitchens, Lab37 food robots, and autonomous-vehicle company Pronto under one industrial automation platform. Its first restaurant product, Bowl Builder, is already being tested in CloudKitchens. The capital signals serious pressure coming to standardized, delivery-heavy concepts, although independents still retain advantages in hospitality, flexibility, and brand.",
          sources: [
            {
              label: "Nation’s Restaurant News",
              url: "https://www.nrn.com/restaurant-technology/cloudkitchens-owner-raises-1-7b-to-automate-restaurants-and-more",
            },
          ],
        },
        {
          headline:
            "Restaurant operators report a widening profitability gap around AI adoption",
          url: "https://www.restaurant365.com/guides/2026-state-of-the-restaurant-industry-mid-year-report/",
          brief:
            "In Restaurant365’s survey of more than 420 operators covering nearly 10,000 locations, 87% reported higher food costs and 77% higher labor costs. Back-office AI adoption or pilots rose from roughly 25% to 69%; among active users, 61% reported lower food costs and 62% lower labor costs. Vendor-reported causation deserves caution, but the opportunity is squarely in measurable workflows: reporting, inventory, scheduling, waste, and menu optimization.",
          sources: [
            {
              label: "Restaurant365",
              url: "https://www.restaurant365.com/guides/2026-state-of-the-restaurant-industry-mid-year-report/",
            },
          ],
        },
        {
          headline: "Operators are running out of room for blunt menu-price increases",
          url: "https://www.fastcasual.com/articles/hot-dogs-jump-36-coffee-up-71-toasts-june-price-data/",
          brief:
            "Toast’s June data put median hot coffee at $3.75, up 7.1% year over year; beer reached $6.60, up 2.2%; burgers reached $14.71, also up 2.2%. Restaurant365 separately found only 52% of operators now responding to costs with menu increases, down from 66% at the start of 2026. The stronger move is to find low-friction mix, upsell, and menu-engineering opportunities that protect margin without breaking perceived value.",
          sources: [
            {
              label: "Fast Casual / Toast data",
              url: "https://www.fastcasual.com/articles/hot-dogs-jump-36-coffee-up-71-toasts-june-price-data/",
            },
          ],
        },
      ],
    },
    {
      name: "Sports & Betting",
      stories: [
        {
          headline: "LeBron James signs with Philadelphia and moves the title market",
          url: "https://www.inquirer.com/sixers/lebron-signed-with-philadelphia-sixers-20260724.html",
          brief:
            "James agreed to a two-year, $8 million deal after considering retirement, joining Joel Embiid, Jaylen Brown, Tyrese Maxey, and VJ Edgecombe. Kalshi moved Philadelphia to a 12% championship probability, up three points and third behind Oklahoma City and San Antonio. The obvious counterweight is availability across an older, injury-sensitive core.",
          sources: [
            {
              label: "The Philadelphia Inquirer",
              url: "https://www.inquirer.com/sixers/lebron-signed-with-philadelphia-sixers-20260724.html",
            },
          ],
        },
      ],
    },
    {
      name: "Nashua & New Hampshire",
      stories: [
        {
          headline: "Nashua apartment fire officially ruled suicide-murder arson",
          url: "https://www.doj.nh.gov/news-and-media/autopsy-results-regarding-suicide-murder-arson-nashua-july-21-2026",
          brief:
            "State investigators concluded that Gerald Gutekunst intentionally set the Orange Street fire as an act of self-harm, recklessly causing neighbor Scott Thomas’ death. The eight-unit building fire displaced other residents; the origin investigation is still pending, but officials expect no further public release.",
          sources: [
            {
              label: "New Hampshire Department of Justice",
              url: "https://www.doj.nh.gov/news-and-media/autopsy-results-regarding-suicide-murder-arson-nashua-july-21-2026",
            },
          ],
        },
      ],
    },
  ],
};
