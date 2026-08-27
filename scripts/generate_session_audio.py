#!/usr/bin/env python3
"""Generate persistent localized MP3 and lip-sync timing assets."""

import argparse
import asyncio
import hashlib
import json
import os
import re
from pathlib import Path

import edge_tts


ROOT = Path(__file__).resolve().parents[1]
LOCALES_DIR = ROOT / "Web_mindfulnessconnected" / "locales"
OUTPUT_DIR = ROOT / "Web_mindfulnessconnected" / "session-audio"
SUPPORTED_VOICES = {
    "en": "en-US-AndrewMultilingualNeural",
    "ko": "ko-KR-InJoonNeural",
    "es": "es-ES-AlvaroNeural",
    "fr": "fr-FR-HenriNeural",
    "ja": "ja-JP-KeitaNeural",
    "zh": "zh-CN-YunxiNeural",
    "ar": "ar-SA-HamedNeural",
    "pt": "pt-BR-AntonioNeural",
    "hi": "hi-IN-MadhurNeural",
    "de": "de-DE-ConradNeural",
    "vi": "vi-VN-NamMinhNeural",
}


def load_segments(locale):
    path = LOCALES_DIR / f"{locale}.json"
    if not path.exists():
        raise RuntimeError(f"Missing translated locale file: {path}")
    payload = json.loads(path.read_text(encoding="utf-8"))
    sessions = payload.get("sessions") or {}
    if len(sessions) != 12 or not sum(map(len, sessions.values())):
        raise RuntimeError(f"Invalid session scripts in {path}")
    return sessions


def metadata_matches(path, text_hash, voice):
    try:
        metadata = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return False
    return metadata.get("text_sha256") == text_hash and metadata.get("voice_name") == voice


async def synthesize_segment(semaphore, locale, session_id, segment, voice, force=False):
    text = segment["text"]
    segment_key = segment["key"]
    text_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()
    session_dir = OUTPUT_DIR / locale / session_id
    audio_path = session_dir / f"{segment_key}.mp3"
    metadata_path = session_dir / f"{segment_key}.json"

    if not force and audio_path.exists() and metadata_matches(metadata_path, text_hash, voice):
        return "cached", locale, session_id, segment_key, None

    last_error = None
    for attempt in range(4):
        audio_chunks = []
        word_boundaries = []
        try:
            async with semaphore:
                communicate = edge_tts.Communicate(text, voice, boundary="WordBoundary")
                async for chunk in communicate.stream():
                    if chunk["type"] == "audio":
                        audio_chunks.append(chunk["data"])
                    elif chunk["type"] == "WordBoundary":
                        word_boundaries.append({
                            "text": chunk.get("text", ""),
                            "offset": chunk.get("offset", 0),
                            "duration": chunk.get("duration", 0),
                        })
            if audio_chunks:
                break
            raise RuntimeError("TTS returned no audio")
        except Exception as exc:
            last_error = exc
            if attempt < 3:
                await asyncio.sleep(1.5 * (2 ** attempt))

    if not audio_chunks:
        return "failed", locale, session_id, segment_key, str(last_error or "TTS returned no audio")

    session_dir.mkdir(parents=True, exist_ok=True)
    audio_tmp = audio_path.with_suffix(".mp3.tmp")
    metadata_tmp = metadata_path.with_suffix(".json.tmp")
    audio_tmp.write_bytes(b"".join(audio_chunks))
    metadata_tmp.write_text(json.dumps({
        "locale": locale,
        "session_id": session_id,
        "segment_key": segment_key,
        "text": text,
        "text_sha256": text_hash,
        "voice_name": voice,
        "word_boundaries": word_boundaries,
        "rhubarb_mouth_cues": [],
        "lipsync_source": "word_boundaries",
    }, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    audio_tmp.replace(audio_path)
    metadata_tmp.replace(metadata_path)
    return "generated", locale, session_id, segment_key, None


async def run(args):
    selected_locales = args.locales or list(SUPPORTED_VOICES)
    selected = [
        (locale, session_id, segment, args.voice or SUPPORTED_VOICES[locale])
        for locale in selected_locales
        for session_id, segments in load_segments(locale).items()
        for segment in segments
        if not args.session or session_id == args.session
    ]
    if args.limit_per_locale:
        limited = []
        counts = {}
        for item in selected:
            locale = item[0]
            if counts.get(locale, 0) >= args.limit_per_locale:
                continue
            limited.append(item)
            counts[locale] = counts.get(locale, 0) + 1
        selected = limited
    if args.limit:
        selected = selected[:args.limit]
    if not selected:
        raise RuntimeError("No matching session segments found")

    semaphore = asyncio.Semaphore(args.concurrency)
    tasks = [
        synthesize_segment(semaphore, locale, session_id, segment, voice, args.force)
        for locale, session_id, segment, voice in selected
    ]
    generated = cached = 0
    failures = []
    for future in asyncio.as_completed(tasks):
        status, locale, session_id, segment_key, error = await future
        generated += status == "generated"
        cached += status == "cached"
        if status == "failed":
            failures.append((session_id, segment_key, error))
            print(f"{status:9} {locale}/{session_id}/{segment_key}: {error}", flush=True)
        else:
            print(f"{status:9} {locale}/{session_id}/{segment_key}", flush=True)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest = {
        "version": 2,
        "locales": {
            locale: {
                "voice_name": args.voice or SUPPORTED_VOICES[locale],
                "sessions": {
                    session_id: [segment["key"] for segment in segments]
                    for session_id, segments in load_segments(locale).items()
                },
            }
            for locale in selected_locales
        },
    }
    (OUTPUT_DIR / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Done: {generated} generated, {cached} already current.")
    if failures:
        raise RuntimeError(f"{len(failures)} session audio assets failed to generate")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--locales", nargs="*", choices=SUPPORTED_VOICES, help="Locales to generate; defaults to all")
    parser.add_argument("--voice", help="Override the locale-specific voice (use with one locale)")
    parser.add_argument("--session", help="Generate one session id only")
    parser.add_argument("--limit", type=int, default=0, help="Generate only the first N matching segments")
    parser.add_argument("--limit-per-locale", type=int, default=0, help="Generate only the first N segments for every locale")
    parser.add_argument("--concurrency", type=int, default=6)
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()
    if args.voice and (not args.locales or len(args.locales) != 1):
        parser.error("--voice requires exactly one --locales value")
    if args.concurrency < 1 or args.concurrency > 12:
        parser.error("--concurrency must be between 1 and 12")
    asyncio.run(run(args))


if __name__ == "__main__":
    main()
