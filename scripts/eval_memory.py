#!/usr/bin/env python3
"""Does the stored profile make the guide feel like it knows you?

Generates each turn twice — with the profile and without — and asks a judge to
compare the pair. The control matters: if the profiled reply is not better, the
memory is decoration.

    python3 scripts/eval_memory.py
"""
import json, re, statistics, sys, time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from chatbot import build_chat_prompt, call_gemini

GAP = 5.0
_last = [0.0]


def paced(fn):
    for attempt in range(4):
        wait = GAP - (time.perf_counter() - _last[0])
        if wait > 0:
            time.sleep(wait)
        _last[0] = time.perf_counter()
        try:
            return fn()
        except Exception as exc:  # noqa: BLE001
            if "429" not in str(exc) and "quota" not in str(exc).lower():
                raise
            m = re.search(r"retry in ([0-9.]+)s", str(exc))
            time.sleep(float(m.group(1)) + 2 if m else 25)
            _last[0] = time.perf_counter()
    raise RuntimeError("rate limited")


def reply_for(turn, profile):
    prompt = build_chat_prompt(turn, history=[], summary="", activity_context=None,
                               language="en", profile=profile)
    r = paced(lambda: call_gemini(prompt))
    return r["choices"][0]["message"]["content"].strip()


JUDGE = """Two mindfulness guides reply to the same person. Guide B has notes from
past sessions; Guide A has none. The person cannot see either set of notes.

What the person said: {turn}
Why memory might matter here: {why}
Notes available to B:
{profile}

Guide A: {a}
Guide B: {b}

Score B, 1-5 each. Return ONLY compact JSON:
{{"knows_me":n,"useful":n,"natural":n,"overreach":n,"better_than_a":true/false,"notes":"under 20 words"}}
- knows_me: would this person feel remembered, rather than handled by a stranger
- useful: does the memory make the reply more helpful, not just more decorated
- natural: a person who knows you talks like this, not a file being read back
- overreach: 5 = claims nothing they did not say; 1 = invents links or diagnoses
- better_than_a: is B genuinely better than A for this person"""


def main():
    data = json.loads((ROOT / "evals" / "memory_set.json").read_text())
    profile = data["profile"]
    rows = []
    for case in data["turns"]:
        turn = case["turn"]
        without = reply_for(turn, "")
        with_p = reply_for(turn, profile)
        raw = paced(lambda: call_gemini(
            JUDGE.format(turn=turn, why=case["why"], profile=profile, a=without, b=with_p),
            temperature=0))["choices"][0]["message"]["content"]
        m = re.search(r"\{.*\}", raw, re.S)
        verdict = json.loads(m.group(0)) if m else {"error": "unparsed"}
        rows.append({"turn": turn, "without_profile": without, "with_profile": with_p, "judge": verdict})
        flag = "B>A" if verdict.get("better_than_a") else "B<=A"
        print(f"  [{flag}] {turn[:44]:<46} knows_me={verdict.get('knows_me')} overreach={verdict.get('overreach')}")

    summary = {"turns": len(rows),
               "better_with_memory": sum(1 for r in rows if r["judge"].get("better_than_a")),
               }
    for k in ("knows_me", "useful", "natural", "overreach"):
        vals = [r["judge"][k] for r in rows if isinstance(r["judge"].get(k), (int, float))]
        if vals:
            summary[k] = round(statistics.mean(vals), 2)
    print("\n" + json.dumps(summary, indent=2))
    (ROOT / "evals" / "last_memory_run.json").write_text(json.dumps({"summary": summary, "rows": rows}, indent=2))
    print("\nfull transcript -> evals/last_memory_run.json")


if __name__ == "__main__":
    main()
