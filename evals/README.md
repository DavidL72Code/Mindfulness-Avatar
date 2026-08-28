# Evals

Two suites, both runnable against a local server.

| Script | What it measures |
|---|---|
| `scripts/eval_conversation.py` | Reply latency, quality heuristics, a model-graded rubric, and multi-turn flow (`--flow`) |
| `scripts/eval_memory.py` | Whether the stored profile makes replies better, by generating each turn with and without it |
| `scripts/eval_performance.js` | Cold and warm avatar build times against the budgets in `perf_budgets.json` |

## No real user data lives here

Every persona in these fixtures is invented. The profiles describe people who
do not exist — the jobs, the family members, the sleep patterns and the
worries were all written to exercise specific behaviours:

- a recurring pattern the guide should notice without being told again
- a stated preference it should honour silently
- a hard constraint it must never violate
- a low-mood turn where it should *not* reach for stored notes

They read like real disclosures because a fixture that reads as fake does not
test anything useful.

Run outputs are gitignored. They contain full transcripts of the guide
replying to these personas, which look like real session records even though
no user was involved. Regenerate them locally rather than committing them.

## Running

```bash
python3 scripts/eval_conversation.py --judge      # single turns, graded
python3 scripts/eval_conversation.py --flow       # multi-turn threads
python3 scripts/eval_memory.py                    # memory A/B
node scripts/eval_performance.js --runs 3         # avatar build times
```

The free Gemini tier allows 15 requests a minute, so the Python suites pace
themselves and back off on 429. A judged run takes a couple of minutes.
