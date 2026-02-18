# How sk-mockAPI started

A short backstory of why this extension exists.

---

## The problem

A few things were stacking up:

**Access & tools**  
I needed VPN to reach our APIs and internal services. But inside the VPN, the coding agents I relied on were blocked. So it was either “see the APIs” or “use the agent”—not both. That put a real brake on how fast we could move.

**API vs frontend timing**  
On paper, API and frontend work started in parallel. In practice, the frontend was usually waiting. The API often landed on the last day of the sprint—or the day before demos. So instead of building and testing against real contracts, the FE team was stuck with placeholders, guesswork, and last-minute integration.

**Result**  
Developers were struggling to get momentum. We were blocked by access, by tooling, and by the classic “API not ready yet” delay.

---

## The idea

We needed a way to:

- Work **without** depending on VPN or a live backend.
- Let the frontend **move ahead** with realistic request/response shapes.
- Give QA (and devs) a way to **try different data** without creating it in the backend.

So the idea was simple: **mock the APIs in the browser.** No separate server, no deploy, no VPN. Just a small tool that intercepts requests and returns the JSON you define.

---

## How it got built

I couldn’t use the coding agent inside VPN, so I used it **outside** VPN to design and build the first version of this **browser extension**. It was the right fit: it runs locally, doesn’t need any backend, and gives both developers and QA a single place to define and toggle mock APIs.

That’s how **sk-mockAPI** started: from access limits, sprint-time pressure, and the need to keep frontend and QA unblocked—with a little help from a coding agent to turn the idea into a real tool.

---

*If you’re waiting on APIs or fighting VPN/agent restrictions, maybe a browser-based mock can help you too. [Try sk-mockAPI →](index.html#get-it)*
