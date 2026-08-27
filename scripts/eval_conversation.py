#!/usr/bin/env python3
"""Evaluate the mindfulness guide: response latency and how natural it reads.

Runs the same prompt path the server uses (chatbot.build_chat_prompt ->
call_gemini), so latency here is model latency without HTTP/auth overhead.
Pass --stream to also measure time-to-first-token, which is what the user
actually perceives, since speech starts on the first sentence.

    python3 scripts/eval_conversation.py                 # latency + heuristics
    python3 scripts/eval_conversation.py --judge         # + model-graded rubric
    python3 scripts/eval_conversation.py --runs 3        # repeat for stable timing
"""
import argparse, json, os, re, statistics, sys, time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from chatbot import build_chat_prompt, call_gemini, call_gemini_stream


_LAST_CALL = [0.0]
_MIN_GAP = [5.0]   # seconds between API calls; free tier allows 15/min


def paced(work):
    """Wait out the rate-limit gap BEFORE handing control to work().

    work() does its own timing internally, so the pacing sleep is never
    counted as model latency. Getting this wrong inflates every measurement
    to exactly the gap size.
    """
    for attempt in range(4):
        gap = _MIN_GAP[0] - (time.perf_counter() - _LAST_CALL[0])
        if gap > 0:
            time.sleep(gap)
        _LAST_CALL[0] = time.perf_counter()
        try:
            return work()
        except Exception as exc:  # noqa: BLE001
            msg = str(exc)
            if "429" not in msg and "quota" not in msg.lower():
                raise
            wait = 20 * (attempt + 1)
            m = re.search(r"retry in ([0-9.]+)s", msg)
            if m:
                wait = float(m.group(1)) + 2
            print(f"    rate limited, waiting {wait:.0f}s…", flush=True)
            time.sleep(wait)
            _LAST_CALL[0] = time.perf_counter()
    raise RuntimeError("still rate limited after retries")


def reply_text(result):
    """call_gemini returns an OpenAI-shaped dict; unwrap it."""
    if isinstance(result, str):
        return result
    try:
        return result["choices"][0]["message"]["content"] or ""
    except (KeyError, IndexError, TypeError):
        return str(result)

# Openers that make a guide sound like a form letter rather than a person.
CLICHES = [
    "i hear you", "it sounds like", "i'm sorry to hear", "im sorry to hear",
    "that must be", "thank you for sharing", "i understand that",
    "it's completely normal", "its completely normal", "remember that",
    "as a mindfulness", "i'm here to", "im here to",
]
MARKDOWN = re.compile(r"[*_#`]|^\s*[-•]\s", re.M)
# Non-question ways a turn can still hand the floor back. Without one of these
# (or a question) the reply is a dead end and the conversation stalls.
INVITES = re.compile(
    r"\b(tell me|let me know|say the word|if you want|if you'd like|if you like|"
    r"if you are up for|if you're up for|whenever you(?:'re| are) ready|"
    r"when you(?:'re| are) ready|feel free|we could|we can|shall we|want to try|"
    r"would you like|how about|no rush|take your time|"
    r"i(?:'m| am) here|i(?:'m| am) curious|i wonder|or you could|or we could|"
    r"or if you(?:'d| would) prefer)\b", re.I)
SENT_SPLIT = re.compile(r"(?<=[.!?])\s+")

SCRIPT_CONTEXT = {
    "title": "Mindful Breathing",
    "description": "A foundational breath awareness practice you can use anywhere.",
    "steps": [
        "Settle into a comfortable seat and let the shoulders drop.",
        "Breathe in through the nose for a count of four.",
        "Let the exhale be a little longer than the inhale.",
        "Notice where the breath is easiest to feel.",
    ],
    "current_step_index": 2,
}


def analyse(text):
    words = text.split()
    sentences = [s for s in SENT_SPLIT.split(text.strip()) if s]
    lowered = text.lower()
    opener = " ".join(words[:4]).lower()
    return {
        "words": len(words),
        "sentences": len(sentences),
        "avg_sentence_words": round(len(words) / max(1, len(sentences)), 1),
        "ends_with_question": text.strip().endswith("?"),
        "has_invite": bool(INVITES.search(text)),
        "dead_end": not text.strip().endswith("?") and not INVITES.search(text),
        "cliches": [c for c in CLICHES if c in lowered],
        "markdown_leak": bool(MARKDOWN.search(text)),
        "opener": opener,
    }


JUDGE = """You are grading a mindfulness guide's reply for how it would land in a spoken conversation.

User said: {turn}
What the turn is testing: {intent}
Guide replied: {reply}

Score each 1-5 (5 best). Return ONLY compact JSON, no prose:
{{"natural":n,"warmth":n,"brevity":n,"relevance":n,"notes":"under 15 words"}}
- natural: sounds like a person talking, not a wellness script or a chatbot
- warmth: present and kind without being saccharine or clinical
- brevity: right length to be spoken aloud; long lectures score low
- relevance: actually answers what was said"""


def judge(case, reply):
    try:
        prompt = JUDGE.format(turn=case["turn"], intent=case["intent"], reply=reply)
        raw = reply_text(paced(lambda: call_gemini(prompt, temperature=0)))
        m = re.search(r"\{.*\}", raw, re.S)
        return json.loads(m.group(0)) if m else {"error": "unparsed"}
    except Exception as exc:  # noqa: BLE001
        return {"error": str(exc)[:80]}


def run_case(case, stream=False):
    ctx = SCRIPT_CONTEXT if case["mode"] == "scripted" else None
    prompt = build_chat_prompt(case["turn"], history=[], summary="", activity_context=ctx, language="en")

    def work():
        start = time.perf_counter()
        first_token_ms = None
        if stream:
            chunks = []
            for chunk in call_gemini_stream(prompt):
                piece = chunk if isinstance(chunk, str) else reply_text(chunk)
                if not piece:
                    continue
                if first_token_ms is None:
                    first_token_ms = (time.perf_counter() - start) * 1000
                chunks.append(piece)
            reply = "".join(chunks)
        else:
            reply = reply_text(call_gemini(prompt))
        return reply.strip(), (time.perf_counter() - start) * 1000, first_token_ms

    return paced(work)


def pct(values, p):
    if not values:
        return 0.0
    ordered = sorted(values)
    return round(ordered[min(len(ordered) - 1, int(len(ordered) * p / 100))], 1)


FLOW_JUDGE = """You are grading a multi-turn exchange between someone and a mindfulness guide.

What this thread is testing: {expect}

Transcript:
{transcript}

Score each 1-5 (5 best). Return ONLY compact JSON, no prose:
{{"continuity":n,"non_repetitive":n,"respects_constraints":n,"notes":"under 20 words"}}
- continuity: each reply builds on what came before instead of restarting
- non_repetitive: does not reuse the same opener, phrasing or suggestion
- respects_constraints: honours anything the person stated or the profile says; 5 if none applied"""


def run_flow(threads, judge_it=False):
    """Walk each thread turn by turn, carrying history the way the server does."""
    rows = []
    for thread in threads:
        history, turns = [], []
        for turn in thread["turns"]:
            prompt = build_chat_prompt(
                turn, history=history, summary="",
                activity_context=None, language="en",
                profile=thread.get("profile", ""),
            )
            def work(p=prompt):
                # time only the API call — paced() waits before this runs, and
                # counting that wait inflates every reading to the pacing gap
                started = time.perf_counter()
                text = reply_text(call_gemini(p))
                return text, (time.perf_counter() - started) * 1000

            reply, elapsed = paced(work)
            reply = reply.strip()
            history.append({"role": "user", "content": turn})
            history.append({"role": "assistant", "content": reply})
            turns.append({"turn": turn, "reply": reply, "latency_ms": round(elapsed, 1), **analyse(reply)})
            print(f"  {thread['id']:<18} {elapsed:>6.0f}ms  {turn[:34]:<36} -> {reply[:46]}...")

        openers = [t["opener"] for t in turns]
        row = {
            "id": thread["id"],
            "turns": turns,
            "repeated_openers": sorted({o for o in openers if openers.count(o) > 1}),
            "handoff_rate": round(sum(1 for t in turns if not t["dead_end"]) / len(turns), 2),
            "question_rate": round(sum(1 for t in turns if t["ends_with_question"]) / len(turns), 2),
            "cliche_hits": sum(len(t["cliches"]) for t in turns),
        }
        if judge_it:
            transcript = "\n".join(
                f"User: {t['turn']}\nGuide: {t['reply']}" for t in turns
            )
            prompt = FLOW_JUDGE.format(expect=thread["expect"], transcript=transcript)
            try:
                raw = reply_text(paced(lambda: call_gemini(prompt, temperature=0)))
                m = re.search(r"\{.*\}", raw, re.S)
                row["judge"] = json.loads(m.group(0)) if m else {"error": "unparsed"}
            except Exception as exc:  # noqa: BLE001
                row["judge"] = {"error": str(exc)[:80]}
        rows.append(row)
    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--set", default=str(ROOT / "evals" / "conversation_set.json"))
    ap.add_argument("--runs", type=int, default=1, help="repeat each case for stabler timing")
    ap.add_argument("--stream", action="store_true", help="also measure time-to-first-token")
    ap.add_argument("--judge", action="store_true", help="model-graded quality rubric")
    ap.add_argument("--out", default=str(ROOT / "evals" / "last_run.json"))
    ap.add_argument("--rpm", type=int, default=12, help="cap requests/min (free tier is 15)")
    ap.add_argument("--flow", action="store_true", help="run the multi-turn threads instead of single turns")
    ap.add_argument("--flow-set", default=str(ROOT / "evals" / "flow_set.json"))
    args = ap.parse_args()

    _MIN_GAP[0] = 60.0 / max(1, args.rpm)
    if args.flow:
        threads = json.loads(Path(args.flow_set).read_text())["threads"]
        rows = run_flow(threads, judge_it=args.judge)
        summary = {
            "threads": len(rows),
            "handoff_rate": round(statistics.mean([r["handoff_rate"] for r in rows]), 2),
            "question_rate": round(statistics.mean([r["question_rate"] for r in rows]), 2),
            "cliche_hits": sum(r["cliche_hits"] for r in rows),
            "threads_with_repeated_openers": [r["id"] for r in rows if r["repeated_openers"]],
            "latency_ms": {
                "median": round(statistics.median([t["latency_ms"] for r in rows for t in r["turns"]]), 1),
            },
        }
        if args.judge:
            for k in ("continuity", "non_repetitive", "respects_constraints"):
                vals = [r["judge"][k] for r in rows if isinstance(r.get("judge", {}).get(k), (int, float))]
                if vals:
                    summary.setdefault("judge_mean", {})[k] = round(statistics.mean(vals), 2)
        print("\n" + json.dumps(summary, indent=2))
        Path(args.out).write_text(json.dumps({"summary": summary, "threads": rows}, indent=2))
        print(f"\nfull transcript -> {args.out}")
        return

    cases = json.loads(Path(args.set).read_text())["cases"]
    results, latencies, ttfts = [], [], []

    for case in cases:
        per_run = []
        reply = ""
        for _ in range(args.runs):
            reply, total_ms, ttft = run_case(case, stream=args.stream)
            per_run.append(total_ms)
            latencies.append(total_ms)
            if ttft is not None:
                ttfts.append(ttft)
        row = {
            "id": case["id"], "mode": case["mode"], "turn": case["turn"],
            "reply": reply,
            "latency_ms": round(statistics.median(per_run), 1),
            **analyse(reply),
        }
        if args.judge:
            row["judge"] = judge(case, reply)
        results.append(row)
        flag = "!" if (row["cliches"] or row["markdown_leak"]) else " "
        print(f"{flag} {row['id']:<18} {row['latency_ms']:>7.0f}ms  {row['words']:>3}w  {reply[:58]}...")

    openers = [r["opener"] for r in results]
    dupes = {o for o in openers if openers.count(o) > 1}

    summary = {
        "cases": len(results), "runs_each": args.runs,
        "latency_ms": {
            "mean": round(statistics.mean(latencies), 1),
            "median": round(statistics.median(latencies), 1),
            "p95": pct(latencies, 95),
            "min": round(min(latencies), 1), "max": round(max(latencies), 1),
        },
        "words": {
            "mean": round(statistics.mean([r["words"] for r in results]), 1),
            "max": max(r["words"] for r in results),
        },
        "cliche_hits": sum(len(r["cliches"]) for r in results),
        "markdown_leaks": sum(1 for r in results if r["markdown_leak"]),
        "question_rate": round(sum(1 for r in results if r["ends_with_question"]) / len(results), 2),
        "handoff_rate": round(sum(1 for r in results if not r["dead_end"]) / len(results), 2),
        "dead_ends": [r["id"] for r in results if r["dead_end"]],
        "duplicate_openers": sorted(dupes),
    }
    if ttfts:
        summary["first_token_ms"] = {
            "mean": round(statistics.mean(ttfts), 1),
            "median": round(statistics.median(ttfts), 1),
            "p95": pct(ttfts, 95),
        }
    if args.judge:
        for k in ("natural", "warmth", "brevity", "relevance"):
            vals = [r["judge"][k] for r in results if isinstance(r.get("judge", {}).get(k), (int, float))]
            if vals:
                summary.setdefault("judge_mean", {})[k] = round(statistics.mean(vals), 2)

    print("\n" + json.dumps(summary, indent=2))
    Path(args.out).write_text(json.dumps({"summary": summary, "results": results}, indent=2))
    print(f"\nfull transcript -> {args.out}")


if __name__ == "__main__":
    main()
