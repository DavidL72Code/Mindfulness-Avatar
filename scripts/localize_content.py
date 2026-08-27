#!/usr/bin/env python3
"""Create and validate stored UI/session translations for every supported locale."""

import argparse
import json
import os
import re
import subprocess
import time
from pathlib import Path

import google.generativeai as genai
from dotenv import load_dotenv


ROOT = Path(__file__).resolve().parents[1]
APP_JS = ROOT / "Web_mindfulnessconnected" / "app.js"
MOBILE_STRINGS = ROOT / "mobile-app" / "src" / "i18n" / "strings.js"
WEB_LOCALES = ROOT / "Web_mindfulnessconnected" / "locales"
MOBILE_LOCALES = ROOT / "mobile-app" / "src" / "i18n" / "generated"
WEB_BUNDLE = WEB_LOCALES / "bundle.js"
MOBILE_BUNDLE = MOBILE_LOCALES / "content.js"

LOCALES = {
    "en": "English",
    "ko": "Korean",
    "es": "Spanish",
    "fr": "French",
    "ja": "Japanese",
    "zh": "Simplified Chinese",
    "ar": "Arabic",
    "pt": "Brazilian Portuguese",
    "hi": "Hindi",
    "de": "German",
    "vi": "Vietnamese",
}

PRACTICE_RE = re.compile(r'^\s*"([a-z0-9-]+)"\s*:\s*\[\s*$')
SEGMENT_RE = re.compile(
    r'^\s*\{\s*key:\s*("(?:\\.|[^"\\])*")\s*,\s*'
    r'text:\s*("(?:\\.|[^"\\])*")\s*\}\s*,?\s*$'
)
CATALOG_ENTRY_RE = re.compile(
    r'\{\s*id:\s*"([^"]+)",\s*title:\s*"([^"]+)",\s*'
    r'description:\s*"([^"]+)",\s*previewDescription:\s*"([^"]+)",\s*'
    r'zodiac:\s*"([^"]+)",\s*kind:\s*"([^"]+)",\s*duration:\s*"([^"]+)"\s*\}',
    re.S,
)


def read_session_scripts():
    sessions = {}
    current_session = None
    in_scripts = False
    for line in APP_JS.read_text(encoding="utf-8").splitlines():
        if line.startswith("const SESSION_SCRIPTS = {"):
            in_scripts = True
            continue
        if not in_scripts:
            continue
        if line == "};":
            break
        practice_match = PRACTICE_RE.match(line)
        if practice_match:
            current_session = practice_match.group(1)
            sessions[current_session] = []
            continue
        segment_match = SEGMENT_RE.match(line)
        if segment_match and current_session:
            sessions[current_session].append({
                "key": json.loads(segment_match.group(1)),
                "text": json.loads(segment_match.group(2)),
            })
    if len(sessions) != 12 or sum(map(len, sessions.values())) < 250:
        raise RuntimeError("Expected all 12 English session scripts")
    return sessions


def read_catalog():
    source = APP_JS.read_text(encoding="utf-8")
    start = source.index("const sessionCatalog = [")
    end = source.index("].map((session", start)
    entries = CATALOG_ENTRY_RE.findall(source[start:end])
    if len(entries) != 12:
        raise RuntimeError(f"Expected 12 catalog entries, found {len(entries)}")
    return {
        session_id: {
            "title": title,
            "description": description,
            "previewDescription": preview,
            "zodiac": zodiac,
            "kind": kind,
            "duration": duration,
        }
        for session_id, title, description, preview, zodiac, kind, duration in entries
    }


def read_mobile_english_strings():
    node_script = r"""
const fs=require('fs'),vm=require('vm');
let source=fs.readFileSync(process.argv[1],'utf8');
source=source.replace(/\/\*\*[\s\S]*?\*\//g,'').replace('export const STRINGS =','STRINGS =');
const context={}; vm.createContext(context); vm.runInContext(source,context);
process.stdout.write(JSON.stringify(context.STRINGS.en));
"""
    result = subprocess.run(
        ["node", "-e", node_script, str(MOBILE_STRINGS)],
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(result.stdout)


def english_ui():
    ui = read_mobile_english_strings()
    ui.update({
        "welcomeBackNamed": "Welcome back, {name}.",
        "welcomeBack": "Welcome back.",
        "homeWelcomeBody": "Settle in and choose a practice. Your guide is ready to assist you.",
        "homeWelcomeQuestion": "How are you feeling today?",
        "beginPractice": "Begin {title}",
        "askGuide": "Ask the guide",
        "dayStreakValue": "{count} day streak",
        "activeDaysValue": "{count} active days",
        "quickCheckIn": "Quick check-in",
        "sevenDayAverage": "7-day average",
        "fortuneMachine": "Fortune machine",
        "fortuneDescription": "Spin for a small thought to carry into your day.",
        "spinFortune": "Spin a fortune",
        "yourMessageToday": "Your message for today",
        "yourActivity": "Your activity",
        "recommendedStartingPoint": "Recommended starting point",
        "exploreAllPractices": "Explore all practices",
        "availableCount": "{count} available",
        "start": "Start",
        "endSession": "End session",
        "statusNotStarted": "Not started",
        "sessionActive": "Session active",
        "next": "Next",
        "finish": "Finish",
        "passageProgress": "Passage {current} of {total}",
        "welcomeGuideNamed": "Welcome back, {name}. Settle in and choose a practice. Your guide is ready to assist you. How are you feeling today?",
        "welcomeGuide": "Welcome back. Settle in and choose a practice. Your guide is ready to assist you. How are you feeling today?",
        "assistantWelcome": "Hello, I’m your mindfulness assistant. I’m here to support you. How are you doing today?",
        "assistantReady": "Your mindfulness guide is here.",
        "moodLow": "Low",
        "moodTender": "Tender",
        "moodSteady": "Steady",
        "moodGood": "Good",
        "moodBright": "Bright",
        "moodSaved": "Saved for today.",
        "loadingTranslations": "Loading your language…",
        "translationFallback": "This content is not available in your language yet. Showing English.",
        "guideButton": "Guide",
        "mindfulnessAssistant": "Mindfulness assistant",
        "hideGuide": "Hide guide",
        "sessionCompleteTitle": "You made space for yourself",
        "sessionLength": "Session length: {duration}",
        "sessionReflection": "Notice what feels different before you move on.",
        "returnHome": "Return home",
        "mindfulnessChat": "Mindfulness chat",
        "assistantStatus": "Assistant: {status}",
        "typeMessage": "Type a message…",
        "send": "Send",
        "completed": "Completed",
        "continuePractice": "Continue your practice",
        "practiceStillActive": "{title} is still active.",
        "guideFollowUpReady": "Your guide is ready with a follow-up.",
        "tapFeeling": "Tap a feeling to check in with your guide.",
        "guidePreparingFollowUp": "Your guide is preparing a follow-up.",
        "chooseClosestFeeling": "Choose the feeling that is closest to where you are right now.",
        "spinning": "Spinning…",
        "voicePlayback": "Voice playback",
        "enterSendHint": "Enter to send · Shift+Enter for a new line",
        "listening": "Listening…",
        "generatingVoice": "Generating voice…",
        "speaking": "Speaking…",
        "voiceUnavailable": "Voice unavailable. Try again.",
        "preparingVoice": "Preparing voice…",
        "typing": "Typing…",
        "preparingWelcome": "Preparing welcome…",
        "tapToTalk": "Tap to talk",
        "loadingTexture": "Loading avatar texture {current} of {total}…",
        "cachingGeometry": "Caching avatar geometry…",
        "loadError": "The avatar could not load.",
        "compactGuideSubtitle": "A compact avatar guide with voice and quick chat.",
        "viewActivity": "View your activity",
        "backToSessions": "Back to sessions",
        "sessions": "Sessions",
        "templateReserved": "Template reserved",
        "closeLanguageSelector": "Close language selector",
        "dailyMindfulnessTools": "Daily mindfulness tools",
        "chooseFeeling": "Choose how you feel today",
        "feelingLabel": "Feeling {feeling}",
        "previousMonth": "Previous month",
        "nextMonth": "Next month",
        "calendarLabel": "{month} activity calendar",
        "toggleTheme": "Toggle theme",
        "toggleNotifications": "Toggle notifications",
        "stopRecording": "Stop recording",
        "startVoiceInput": "Start voice input",
        "chatPlaceholder": "Ask about mindfulness, app features, or this session…",
        "openMindfulnessChat": "Open mindfulness chat",
        "chat": "Chat",
        "loadingAvatar": "Loading avatar…",
        "collapse": "Collapse",
        "expand": "Expand",
        "ready": "Ready",
        "thinking": "Thinking…",
        "offlineFallback": "Offline fallback",
        "contextSession": "Context: {title}",
        "contextGeneral": "Context: general app help",
        "guidedSession": "Guided session",
        "assistantLedSession": "Assistant-led session",
        "finishSession": "Finish session",
        "nextPassage": "Next passage",
        "startNamed": "Start {title}",
        "personMeditating": "Person meditating",
        "brandLogo": "Multi-Language Wellness",
        "useLanguageOption": "Use {language}",
        "languageCurrent": "Language: {language}",
        "opensLanguageSelector": "Opens the language selector",
        "moodPromptLow": "What’s weighing on you today? You don’t have to solve it all at once.",
        "moodPromptTender": "What feels a little harder than usual today?",
        "moodPromptSteady": "Steady is enough. What would help you stay grounded today?",
        "moodPromptGood": "What’s one thing that helped you feel good today?",
        "moodPromptBright": "What happened that you want to remember from today?",
    })
    return ui


def english_fortunes():
    return [
        "A small pause will reveal the next right step.",
        "Your attention is a form of care—place it somewhere gentle today.",
        "Something ordinary will feel quietly meaningful when you slow down for it.",
        "You do not need a perfect day to make room for one good moment.",
        "Let ease be useful. You are allowed to move at a kinder pace.",
        "The feeling you make space for today will have less power over you tomorrow.",
        "A conversation today may be kinder than you expect.",
        "The answer may arrive after you stop forcing it.",
        "Protecting your energy is also a form of progress.",
        "One honest breath can change the tone of the next hour.",
        "Leave a little room in your plans for something delightful.",
        "A task you have been avoiding may be lighter once you begin.",
        "Someone will appreciate the care you bring to a small moment.",
        "Your quiet effort is building something you cannot see yet.",
        "Choose the next kind step, not the entire staircase.",
        "A clear boundary will create room for something better.",
        "Today favors curiosity over certainty.",
        "The ordinary path may hold the surprise you need.",
        "Rest will return more to you than rushing will.",
        "A simple choice made calmly will carry you forward.",
        "Notice what becomes easier when you stop judging the moment.",
        "You may already know what deserves your attention first.",
        "A familiar place will offer a new perspective today.",
        "Let one unfinished thing remain unfinished without guilt.",
        "A sincere question can open a door that effort cannot.",
        "Give today one small memory worth keeping.",
        "Your pace does not need to match anyone else’s.",
        "Something you release will make the rest feel lighter.",
        "Trust the progress that looks quiet from the outside.",
        "A moment of play may restore more than another hour of work.",
    ]


def english_payload():
    return {
        "locale": "en",
        "name": LOCALES["en"],
        "direction": "ltr",
        "ui": english_ui(),
        "catalog": read_catalog(),
        "sessions": read_session_scripts(),
        "fortunes": english_fortunes(),
    }


def strip_code_fence(text):
    value = (text or "").strip()
    if value.startswith("```"):
        value = re.sub(r"^```(?:json)?\s*", "", value)
        value = re.sub(r"\s*```$", "", value)
    return value.strip()


def translate_json(model, locale, section_name, value, retries=4):
    language = LOCALES[locale]
    prompt = f"""
Translate this mindfulness application's {section_name} JSON from English into {language}.
Return JSON only, with exactly the same object keys, array lengths, segment keys, placeholders
such as {{name}}, {{count}}, {{current}}, {{total}}, punctuation intent, and data types.
Translate user-visible prose naturally and calmly. Do not translate IDs, locale codes, zodiac
names, session IDs, segment keys, the `kind` field, or numeric duration markers. For Arabic,
use natural Modern Standard Arabic. For Chinese, use Simplified Chinese. Do not add commentary.

{json.dumps(value, ensure_ascii=False, separators=(',', ':'))}
""".strip()
    last_error = None
    for attempt in range(retries):
        try:
            response = model.generate_content(
                prompt,
                generation_config={
                    "temperature": 0.1,
                    "response_mime_type": "application/json",
                    "max_output_tokens": 32768,
                },
            )
            cleaned = strip_code_fence(response.text)
            translated, _end = json.JSONDecoder().raw_decode(cleaned)
            return translated
        except Exception as exc:
            last_error = exc
            if attempt + 1 < retries:
                time.sleep(2 ** attempt)
    raise RuntimeError(f"Failed translating {section_name} to {locale}: {last_error}")


def validate_translation(source, translated, locale):
    if set(source["ui"]) != set(translated.get("ui", {})):
        raise RuntimeError(f"{locale}: UI keys do not match English")
    if set(source["catalog"]) != set(translated.get("catalog", {})):
        raise RuntimeError(f"{locale}: catalog sessions do not match English")
    if set(source["sessions"]) != set(translated.get("sessions", {})):
        raise RuntimeError(f"{locale}: session IDs do not match English")
    if len(source["fortunes"]) != len(translated.get("fortunes", [])) or not all(
        isinstance(item, str) and item.strip() for item in translated.get("fortunes", [])
    ):
        raise RuntimeError(f"{locale}: daily fortunes do not match English")
    for session_id, source_segments in source["sessions"].items():
        target_segments = translated["sessions"].get(session_id, [])
        if len(source_segments) != len(target_segments):
            raise RuntimeError(f"{locale}/{session_id}: segment count changed")
        for source_segment, target_segment in zip(source_segments, target_segments):
            if source_segment["key"] != target_segment.get("key") or not target_segment.get("text", "").strip():
                raise RuntimeError(f"{locale}/{session_id}: invalid segment translation")
    placeholder_re = re.compile(r"\{[a-zA-Z0-9_]+\}")
    for key, source_text in source["ui"].items():
        if sorted(placeholder_re.findall(source_text)) != sorted(placeholder_re.findall(translated["ui"][key])):
            raise RuntimeError(f"{locale}/ui/{key}: placeholders changed")


def restore_ui_placeholders(source_ui, translated_ui):
    """Undo model attempts to translate placeholder names while preserving prose."""
    placeholder_re = re.compile(r"\{[a-zA-Z0-9_]+\}")
    any_braced_re = re.compile(r"\{[^{}]+\}")
    restored = dict(translated_ui)
    for key, source_text in source_ui.items():
        expected = placeholder_re.findall(source_text)
        if not expected:
            continue
        current = any_braced_re.findall(restored[key])
        replacements = iter(expected[:len(current)])
        restored[key] = any_braced_re.sub(
            lambda match: next(replacements, match.group(0)),
            restored[key],
        )
        if len(current) < len(expected):
            restored[key] = f"{restored[key].rstrip()} {' '.join(expected[len(current):])}"
    return restored


def write_payload(payload):
    locale = payload["locale"]
    WEB_LOCALES.mkdir(parents=True, exist_ok=True)
    MOBILE_LOCALES.mkdir(parents=True, exist_ok=True)
    rendered = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    (WEB_LOCALES / f"{locale}.json").write_text(rendered, encoding="utf-8")
    (MOBILE_LOCALES / f"{locale}.json").write_text(rendered, encoding="utf-8")


def write_bundles():
    payloads = {
        locale: json.loads((WEB_LOCALES / f"{locale}.json").read_text(encoding="utf-8"))
        for locale in LOCALES
    }
    compact = json.dumps(payloads, ensure_ascii=False, separators=(",", ":"))
    WEB_BUNDLE.write_text(f"window.MC_LOCALES={compact};\n", encoding="utf-8")
    MOBILE_BUNDLE.write_text(
        "/* Generated by scripts/localize_content.py. */\n"
        f"export const LOCALIZED_CONTENT={compact};\n"
        "export const SUPPORTED_LOCALES=Object.keys(LOCALIZED_CONTENT);\n",
        encoding="utf-8",
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--locales", nargs="*", default=list(LOCALES))
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--validate-only", action="store_true")
    parser.add_argument("--allow-partial", action="store_true")
    parser.add_argument("--ui-only", action="store_true")
    parser.add_argument("--missing-ui-only", action="store_true")
    parser.add_argument("--session-batch-size", type=int, default=3)
    args = parser.parse_args()
    invalid = sorted(set(args.locales) - set(LOCALES))
    if invalid:
        parser.error(f"Unsupported locales: {', '.join(invalid)}")
    if args.session_batch_size < 1 or args.session_batch_size > 4:
        parser.error("--session-batch-size must be between 1 and 4")

    source = english_payload()
    write_payload(source)
    if not args.validate_only:
        load_dotenv(ROOT / ".env")
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY or GOOGLE_API_KEY is required")
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(os.getenv("GEMINI_TRANSLATION_MODEL", "gemini-3.1-flash-lite"))
        for locale in args.locales:
            if locale == "en":
                continue
            target_path = WEB_LOCALES / f"{locale}.json"
            checkpoint_path = WEB_LOCALES / f".{locale}.partial.json"
            if args.missing_ui_only:
                if not target_path.exists():
                    raise RuntimeError(f"{locale}: cannot fill UI before the base locale exists")
                existing = json.loads(target_path.read_text(encoding="utf-8"))
                missing_ui = {key: value for key, value in source["ui"].items() if key not in existing.get("ui", {})}
                if missing_ui:
                    additions = translate_json(model, locale, "additional UI messages", missing_ui)
                    existing["ui"].update(restore_ui_placeholders(missing_ui, additions))
                validate_translation(source, existing, locale)
                write_payload(existing)
                print(f"filled     {locale} UI ({len(missing_ui)} keys)", flush=True)
                continue
            if args.ui_only:
                if not target_path.exists():
                    raise RuntimeError(f"{locale}: cannot refresh UI before the base locale exists")
                existing = json.loads(target_path.read_text(encoding="utf-8"))
                sections = translate_json(
                    model,
                    locale,
                    "UI messages and daily fortunes",
                    {"ui": source["ui"], "fortunes": source["fortunes"]},
                )
                existing["ui"] = restore_ui_placeholders(source["ui"], sections["ui"])
                existing["fortunes"] = sections["fortunes"]
                validate_translation(source, existing, locale)
                write_payload(existing)
                print(f"refreshed  {locale} UI", flush=True)
                continue
            if target_path.exists() and not args.force:
                existing = json.loads(target_path.read_text(encoding="utf-8"))
                validate_translation(source, existing, locale)
                write_payload(existing)
                print(f"cached     {locale}", flush=True)
                continue
            if checkpoint_path.exists():
                translated = json.loads(checkpoint_path.read_text(encoding="utf-8"))
                print(f"resuming   {locale}", flush=True)
            else:
                translated = {
                    "locale": locale,
                    "name": LOCALES[locale],
                    "direction": "rtl" if locale == "ar" else "ltr",
                    "ui": translate_json(model, locale, "UI messages", source["ui"]),
                    "catalog": translate_json(model, locale, "practice catalog", source["catalog"]),
                    "sessions": {},
                    "fortunes": translate_json(model, locale, "daily fortunes", source["fortunes"]),
                }
                translated["ui"] = restore_ui_placeholders(source["ui"], translated["ui"])
                checkpoint_path.write_text(json.dumps(translated, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            session_items = list(source["sessions"].items())
            for offset in range(0, len(session_items), args.session_batch_size):
                batch = dict(session_items[offset:offset + args.session_batch_size])
                if set(batch).issubset(translated["sessions"]):
                    continue
                translated_batch = translate_json(
                    model,
                    locale,
                    "session transcripts",
                    batch,
                )
                if set(translated_batch) != set(batch):
                    raise RuntimeError(f"{locale}: translated session batch IDs changed")
                translated["sessions"].update(translated_batch)
                checkpoint_path.write_text(json.dumps(translated, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
                print(f"translated {locale}/{' + '.join(batch)}", flush=True)
            validate_translation(source, translated, locale)
            write_payload(translated)
            checkpoint_path.unlink(missing_ok=True)
            print(f"completed  {locale}", flush=True)

    missing_locales = []
    for locale in LOCALES:
        path = WEB_LOCALES / f"{locale}.json"
        if not path.exists():
            missing_locales.append(locale)
            continue
        validate_translation(source, json.loads(path.read_text(encoding="utf-8")), locale)
    if missing_locales:
        if not args.allow_partial:
            raise RuntimeError(f"Missing stored locales: {', '.join(missing_locales)}")
        print(f"Partial run complete; waiting for: {', '.join(missing_locales)}")
    else:
        write_bundles()
        print(f"Validated {len(LOCALES)} locales and wrote web/mobile bundles.")


if __name__ == "__main__":
    main()
