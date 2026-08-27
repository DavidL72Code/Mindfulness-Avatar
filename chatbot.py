import os
import json
import base64
import hashlib
import io
import queue as _queue_mod
import shutil
import subprocess
import tempfile
import wave
import asyncio
import threading
import urllib.request
import urllib.error
from collections import OrderedDict
import edge_tts
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
if not GOOGLE_API_KEY:
    raise RuntimeError("Missing GOOGLE_API_KEY or GEMINI_API_KEY environment variable.")
genai.configure(api_key=GOOGLE_API_KEY)

SYSTEM_PROMPT = (
    "You are a mindfulness guide in a spoken conversation. Be calm, warm and "
    "practical, and keep continuity with what was said before.\n"
    "Talk like a person, not a meditation recording. Use contractions. Answer "
    "what they actually said before offering anything else \u2014 do not open with "
    "an instruction unless they asked for one.\n"
    "Match their length. A greeting or a one-word message gets one short, casual "
    "line and no technique. A real disclosure gets two or three sentences. Never "
    "exceed 70 words unless they ask for detail or a guided exercise.\n"
    "Do not end every turn with a question. Ask one when you actually need to "
    "know something to help, or when you are offering a choice.\n"
    "When you do not ask, still leave them a way back in: name what you noticed "
    "and let them react, offer something you could do together, or invite them "
    "to say more without demanding it. Do not leave the turn on a closed "
    "statement that needs no reply.\n"
    "Vary how you open. Never begin consecutive replies the same way, and avoid "
    "stock openers like 'I hear you', 'It sounds like', 'I'm sorry to hear', "
    "'That must be' and 'Take a slow breath'.\n"
    "This is read aloud: plain sentences, no markdown, lists or emoji."
)
MAX_GEMINI_OUTPUT_TOKENS = max(64, min(1024, int(os.getenv("GEMINI_MAX_OUTPUT_TOKENS", "256"))))
ACTIVITIES_PATH = os.path.join(os.path.dirname(__file__), "mindfulness_activities.json")
GEMINI_TTS_MODEL = os.getenv("GEMINI_TTS_MODEL", "gemini-3.1-flash-tts-preview")
GEMINI_TTS_VOICE = os.getenv("GEMINI_TTS_VOICE", "Iapetus")
GEMINI_TTS_SAMPLE_RATE = 24000
EDGE_TTS_VOICE = os.getenv("EDGE_TTS_VOICE", "en-US-AndrewMultilingualNeural")
RHUBARB_BIN = os.getenv(
    "RHUBARB_BIN",
    os.path.join(os.path.dirname(__file__), "vendor", "rhubarb", "rhubarb"),
)


# Single persistent event loop for all Edge TTS calls — shared across threads,
# avoids the overhead of creating and tearing down a loop per request.
_TTS_LOOP = asyncio.new_event_loop()
threading.Thread(target=_TTS_LOOP.run_forever, daemon=True, name="tts-loop").start()

# LRU cache keyed by (text, voice) — script texts are fixed so they only hit
# Microsoft's servers once per server process.
_TTS_CACHE: "OrderedDict[bytes, dict]" = OrderedDict()
_TTS_CACHE_LOCK = threading.Lock()
_TTS_CACHE_MAX = 300

_LIPSYNC_CACHE: "OrderedDict[bytes, dict]" = OrderedDict()
_LIPSYNC_CACHE_LOCK = threading.Lock()
_LIPSYNC_CACHE_MAX = 120


async def _edge_tts_async(text, voice):
    communicate = edge_tts.Communicate(text, voice)
    chunks = []
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            chunks.append(chunk["data"])
    return b"".join(chunks)


async def _edge_tts_with_word_boundaries_async(text, voice):
    communicate = edge_tts.Communicate(text, voice, boundary="WordBoundary")
    chunks = []
    word_boundaries = []
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            chunks.append(chunk["data"])
        elif chunk["type"] == "WordBoundary":
            word_boundaries.append({
                "text": chunk.get("text", ""),
                "offset": chunk.get("offset", 0),
                "duration": chunk.get("duration", 0),
            })
    return b"".join(chunks), word_boundaries


def synthesize_edge_tts(text, voice=None):
    prompt_text = (text or "").strip()
    if not prompt_text:
        raise ValueError("Missing text for speech synthesis.")

    v = voice or EDGE_TTS_VOICE
    cache_key = hashlib.sha1(f"{v}|{prompt_text}".encode()).digest()

    with _TTS_CACHE_LOCK:
        if cache_key in _TTS_CACHE:
            _TTS_CACHE.move_to_end(cache_key)
            return _TTS_CACHE[cache_key]

    future = asyncio.run_coroutine_threadsafe(_edge_tts_async(prompt_text, v), _TTS_LOOP)
    audio_bytes = future.result(timeout=30)

    result = {"audio_bytes": audio_bytes, "content_type": "audio/mpeg", "voice_name": v}

    with _TTS_CACHE_LOCK:
        _TTS_CACHE[cache_key] = result
        _TTS_CACHE.move_to_end(cache_key)
        if len(_TTS_CACHE) > _TTS_CACHE_MAX:
            _TTS_CACHE.popitem(last=False)

    return result


def synthesize_edge_tts_with_word_boundaries(text, voice=None):
    prompt_text = (text or "").strip()
    if not prompt_text:
        raise ValueError("Missing text for speech synthesis.")

    v = voice or EDGE_TTS_VOICE
    future = asyncio.run_coroutine_threadsafe(
        _edge_tts_with_word_boundaries_async(prompt_text, v),
        _TTS_LOOP,
    )
    audio_bytes, word_boundaries = future.result(timeout=30)

    return {
        "audio_bytes": audio_bytes,
        "content_type": "audio/mpeg",
        "voice_name": v,
        "word_boundaries": word_boundaries,
    }


def _find_rhubarb_binary():
    candidates = [RHUBARB_BIN, shutil.which("rhubarb")]
    for candidate in candidates:
        if candidate and os.path.exists(candidate) and os.access(candidate, os.X_OK):
            return candidate
    return None


def _find_ffmpeg_binary():
    ffmpeg_bin = os.getenv("FFMPEG_BIN") or shutil.which("ffmpeg")
    if ffmpeg_bin:
        return ffmpeg_bin
    try:
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return None


def _run_rhubarb_lipsync(audio_bytes, text):
    rhubarb_bin = _find_rhubarb_binary()
    ffmpeg_bin = _find_ffmpeg_binary()
    if not rhubarb_bin or not ffmpeg_bin:
        return None

    with tempfile.TemporaryDirectory(prefix="rhubarb_lipsync_") as tmp_dir:
        mp3_path = os.path.join(tmp_dir, "speech.mp3")
        wav_path = os.path.join(tmp_dir, "speech.wav")
        dialog_path = os.path.join(tmp_dir, "dialog.txt")
        output_path = os.path.join(tmp_dir, "mouth.json")

        with open(mp3_path, "wb") as file_obj:
            file_obj.write(audio_bytes)
        with open(dialog_path, "w", encoding="utf-8") as file_obj:
            file_obj.write(text or "")

        subprocess.run(
            [
                ffmpeg_bin,
                "-y",
                "-loglevel",
                "error",
                "-i",
                mp3_path,
                "-ac",
                "1",
                "-ar",
                "16000",
                wav_path,
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
            timeout=20,
        )
        subprocess.run(
            [
                rhubarb_bin,
                "--quiet",
                "--recognizer",
                "phonetic",
                "--exportFormat",
                "json",
                "--dialogFile",
                dialog_path,
                "-o",
                output_path,
                wav_path,
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
            timeout=20,
        )

        with open(output_path, "r", encoding="utf-8") as file_obj:
            return json.load(file_obj)


def synthesize_edge_tts_with_lipsync(text, voice=None):
    prompt_text = (text or "").strip()
    if not prompt_text:
        raise ValueError("Missing text for speech synthesis.")

    v = voice or EDGE_TTS_VOICE
    cache_key = hashlib.sha1(f"lipsync|{v}|{prompt_text}".encode()).digest()

    with _LIPSYNC_CACHE_LOCK:
        if cache_key in _LIPSYNC_CACHE:
            _LIPSYNC_CACHE.move_to_end(cache_key)
            return _LIPSYNC_CACHE[cache_key]

    result = synthesize_edge_tts_with_word_boundaries(prompt_text, v)
    try:
        rhubarb_result = _run_rhubarb_lipsync(result["audio_bytes"], prompt_text)
    except Exception:
        rhubarb_result = None

    if rhubarb_result and isinstance(rhubarb_result.get("mouthCues"), list):
        result["rhubarb_mouth_cues"] = rhubarb_result["mouthCues"]
        result["lipsync_source"] = "rhubarb"
    else:
        result["rhubarb_mouth_cues"] = []
        result["lipsync_source"] = "word_boundaries"

    with _LIPSYNC_CACHE_LOCK:
        _LIPSYNC_CACHE[cache_key] = result
        _LIPSYNC_CACHE.move_to_end(cache_key)
        if len(_LIPSYNC_CACHE) > _LIPSYNC_CACHE_MAX:
            _LIPSYNC_CACHE.popitem(last=False)

    return result


def synthesize_edge_tts_streaming(text, voice=None):
    """Generator that yields raw MP3 bytes as they stream from Edge TTS.
    Cache hit: yields the full cached audio in one shot (still instant).
    Cache miss: yields each chunk as it arrives so the caller can forward it
    to the client immediately — first byte in ~300 ms instead of ~2 s."""
    prompt_text = (text or "").strip()
    if not prompt_text:
        return

    v = voice or EDGE_TTS_VOICE
    cache_key = hashlib.sha1(f"{v}|{prompt_text}".encode()).digest()

    with _TTS_CACHE_LOCK:
        if cache_key in _TTS_CACHE:
            _TTS_CACHE.move_to_end(cache_key)
            yield _TTS_CACHE[cache_key]["audio_bytes"]
            return

    chunk_q = _queue_mod.Queue()
    all_chunks = []

    async def _producer():
        try:
            communicate = edge_tts.Communicate(prompt_text, v)
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    chunk_q.put(chunk["data"])
                    all_chunks.append(chunk["data"])
        finally:
            chunk_q.put(None)  # sentinel

    asyncio.run_coroutine_threadsafe(_producer(), _TTS_LOOP)

    while True:
        try:
            data = chunk_q.get(timeout=30)
        except _queue_mod.Empty:
            break
        if data is None:
            break
        yield data

    if all_chunks:
        audio_bytes = b"".join(all_chunks)
        result = {"audio_bytes": audio_bytes, "content_type": "audio/mpeg", "voice_name": v}
        with _TTS_CACHE_LOCK:
            _TTS_CACHE[cache_key] = result
            _TTS_CACHE.move_to_end(cache_key)
            if len(_TTS_CACHE) > _TTS_CACHE_MAX:
                _TTS_CACHE.popitem(last=False)


def pcm_to_wav_bytes(pcm_bytes, channels=1, sample_rate=GEMINI_TTS_SAMPLE_RATE, sample_width=2):
    output = io.BytesIO()
    with wave.open(output, "wb") as wav_file:
        wav_file.setnchannels(channels)
        wav_file.setsampwidth(sample_width)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(pcm_bytes)
    return output.getvalue()


def synthesize_gemini_speech(text, voice_name=None, model=GEMINI_TTS_MODEL):
    prompt_text = (text or "").strip()
    if not prompt_text:
        raise ValueError("Missing text for speech synthesis.")

    payload = {
        "contents": [{"parts": [{"text": prompt_text}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {
                "voiceConfig": {
                    "prebuiltVoiceConfig": {
                        "voiceName": voice_name or GEMINI_TTS_VOICE
                    }
                }
            },
        },
        "model": model,
    }

    request = urllib.request.Request(
        url=f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": GOOGLE_API_KEY,
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            raw_body = response.read()
    except urllib.error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Gemini TTS HTTP {exc.code}: {details}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Gemini TTS request failed: {exc.reason}") from exc

    response_json = json.loads(raw_body.decode("utf-8"))
    candidates = response_json.get("candidates") or []
    if not candidates:
        raise RuntimeError("Gemini TTS returned no candidates.")

    parts = (((candidates[0] or {}).get("content") or {}).get("parts")) or []
    inline_data = (parts[0] or {}).get("inlineData") if parts else None
    audio_b64 = (inline_data or {}).get("data")
    if not audio_b64:
        raise RuntimeError("Gemini TTS returned no audio data.")

    pcm_bytes = base64.b64decode(audio_b64)
    wav_bytes = pcm_to_wav_bytes(pcm_bytes)
    return {
        "audio_bytes": wav_bytes,
        "content_type": "audio/wav",
        "voice_name": voice_name or GEMINI_TTS_VOICE,
        "model": model,
        "sample_rate": GEMINI_TTS_SAMPLE_RATE,
    }


_ACTIVITIES_CACHE = None

def load_mindfulness_activities():
    global _ACTIVITIES_CACHE
    if _ACTIVITIES_CACHE is None:
        with open(ACTIVITIES_PATH, "r", encoding="utf-8") as file_obj:
            _ACTIVITIES_CACHE = json.load(file_obj)
    return _ACTIVITIES_CACHE


def find_activity(activity_id):
    for activity in load_mindfulness_activities():
        if activity["id"] == activity_id:
            return activity
    return None


def build_activity_step_message(activity, step_index):
    total_steps = len(activity["steps"])
    current_step = activity["steps"][step_index]
    return (
        f"{activity['title']}\n"
        f"{activity['description']}\n\n"
        f"Step {step_index + 1} of {total_steps}: {current_step}\n\n"
        "When you are ready, tap the check button so we can move to the next step."
    )


def build_chat_prompt(user_message, history=None, summary="", activity_context=None, language="en", profile=""):
    history = history or []
    lang_map = {
        "en": "English",
        "ko": "Korean", "es": "Spanish", "fr": "French", "ja": "Japanese",
        "zh": "Chinese (Simplified)", "ar": "Arabic", "pt": "Portuguese",
        "hi": "Hindi", "de": "German", "vi": "Vietnamese",
    }
    sections = [SYSTEM_PROMPT]
    if language and language in lang_map:
        sections.append(f"Always respond in {lang_map[language]}. Do not switch languages.")

    if profile:
        # Carried across every session so the guide picks up where the person
        # left off instead of meeting a stranger each time.
        sections.append(
            "What you already know about this person from previous sessions:\n"
            f"{profile}\n"
            "Use it to sound like you remember them. Refer back naturally and only "
            "when it is relevant \u2014 do not recite it or open by listing what you recall."
        )

    if summary:
        sections.append(f"Conversation summary so far:\n{summary}")

    if activity_context:
        activity_details = (
            f"Active mindfulness activity: {activity_context['title']}\n"
            f"Description: {activity_context['description']}\n"
            f"Current step ({activity_context['current_step_index'] + 1}/"
            f"{len(activity_context['steps'])}): {activity_context['steps'][activity_context['current_step_index']]}\n"
            "Stay aligned with this activity and help the user complete the current step calmly "
            "before moving on."
        )
        sections.append(activity_details)

    if history:
        transcript = "\n".join(
            f"{item['role'].capitalize()}: {item['content']}" for item in history
        )
        sections.append(f"Recent conversation:\n{transcript}")

    sections.append(f"User: {user_message}")
    sections.append("Assistant:")
    return "\n\n".join(sections)


PROFILE_PROMPT = (
    "You maintain a short private profile of someone using a mindfulness app, so "
    "their guide can remember them between sessions.\n"
    "Merge the new conversation into the existing profile. Keep what still matters, "
    "drop what has been resolved or superseded.\n"
    "Record only durable things: what they are dealing with, recurring themes, what "
    "has helped or not helped, practices they like, how they prefer to be spoken to, "
    "and anything they asked you to remember.\n"
    "Never drop a hard constraint they stated \u2014 allergies, injuries, health "
    "conditions, things that trigger them, or anything they asked you not to do. "
    "These carry over indefinitely.\n"
    "Prioritise the events and changes in their life \u2014 losses, relationships, "
    "family, work changes, health, therapy or other support, moves, milestones \u2014 "
    "and keep names of people and pets exactly as given.\n"
    "Use their own words for when something happened ('last year', 'three years "
    "ago', 'in February'). Never convert that into a year or a date, and never "
    "compute one: guessing precision they did not give produces false facts.\n"
    "Let dated one-off appointments and deadlines expire once they have passed.\n"
    "Do not record one-off small talk, and do not invent anything they did not say.\n"
    "Write up to 8 terse bullet points, under 160 words total. Output only the bullets."
)


def build_profile_update(transcript, prior_profile="", model="gemini-3.1-flash-lite"):
    """Fold a finished conversation into the durable per-user profile."""
    lines = [
        f"{item.get('role', 'user').capitalize()}: {item.get('text') or item.get('content') or ''}"
        for item in (transcript or [])
        if (item.get("text") or item.get("content"))
    ]
    if not lines:
        return prior_profile
    prompt = "\n\n".join([
        PROFILE_PROMPT,
        f"Existing profile:\n{prior_profile or '(none yet)'}",
        "New conversation:\n" + "\n".join(lines[-60:]),
        "Updated profile:",
    ])
    try:
        result = call_gemini(prompt, model=model, temperature=0.2)
        text = result["choices"][0]["message"]["content"].strip()
        return text or prior_profile
    except Exception:
        return prior_profile


def summarize_history(history, prior_summary="", model="gemini-3.1-flash-lite"):
    if not history:
        return prior_summary

    transcript = "\n".join(
        f"{item['role'].capitalize()}: {item['content']}" for item in history
    )
    prompt = (
        "Summarize the following mindfulness chat for future context. Preserve the user's "
        "goals, emotional state, preferences, key concerns, and useful follow-up items. "
        "Keep it concise and do not invent details.\n\n"
        f"Existing summary:\n{prior_summary or 'None'}\n\n"
        f"New conversation to merge:\n{transcript}\n\n"
        "Updated summary:"
    )
    result = call_gemini(prompt, model=model, temperature=0.3)
    return result["choices"][0]["message"]["content"]


def build_session_recap(summary="", history=None, model="gemini-3.1-flash-lite"):
    history = history or []
    transcript = "\n".join(
        f"{item['role'].capitalize()}: {item['content']}" for item in history
    ) or "No additional recent messages."
    prompt = (
        "Create a short, friendly recap of this mindfulness session. Focus on the main "
        "themes discussed, the user's concerns or goals, and any calming practices or "
        "next steps that came up. Keep it to 3 or 4 sentences.\n\n"
        f"Stored session summary:\n{summary or 'None'}\n\n"
        f"Recent messages:\n{transcript}\n\n"
        "Session recap:"
    )
    result = call_gemini(prompt, model=model, temperature=0.3)
    return result["choices"][0]["message"]["content"]

_MODEL_CACHE = {}


def call_gemini_stream(prompt, model="gemini-3.1-flash-lite", temperature=0.7):
    """Yield text fragments as Gemini streams its response."""
    if model not in _MODEL_CACHE:
        _MODEL_CACHE[model] = genai.GenerativeModel(model)
    model_obj = _MODEL_CACHE[model]
    generation_config = genai.types.GenerationConfig(
        temperature=temperature,
        top_p=0.95,
        top_k=40,
        max_output_tokens=MAX_GEMINI_OUTPUT_TOKENS,
    )
    response = model_obj.generate_content(
        prompt,
        generation_config=generation_config,
        stream=True,
    )
    for chunk in response:
        if chunk.text:
            yield chunk.text


def call_gemini(prompt, model="gemini-3.1-flash-lite", temperature=0.7):
    if model not in _MODEL_CACHE:
        _MODEL_CACHE[model] = genai.GenerativeModel(model)
    model_obj = _MODEL_CACHE[model]

    generation_config = genai.types.GenerationConfig(
        temperature=temperature,
        top_p=0.95,
        top_k=40,
        max_output_tokens=MAX_GEMINI_OUTPUT_TOKENS,
    )

    response = model_obj.generate_content(
        prompt,
        generation_config=generation_config
    )

    return {
        "choices": [{
            "message": {
                "role": "assistant",
                "content": response.text
            },
            "finish_reason": response.candidates[0].finish_reason.name if response.candidates else None
        }],
        "usage": {
            "prompt_tokens": response.usage_metadata.prompt_token_count,
            "completion_tokens": response.usage_metadata.candidates_token_count,
            "total_tokens": response.usage_metadata.total_token_count
        },
        "model": model
    }


def main():
    max_history_messages = 20
    summary_batch_size = 10
    context_history = []
    context_summary = ""
    session_ended = False

    while not session_ended:
        userinput = input("Type a message ...")
        prompt = build_chat_prompt(
            user_message=userinput,
            history=context_history,
            summary=context_summary,
        )
        result = call_gemini(prompt)
        content = result["choices"][0]["message"]["content"]
        print(content)
        context_history.append({"role": "user", "content": userinput})
        context_history.append({"role": "assistant", "content": content})

        if len(context_history) > max_history_messages:
            overflow = len(context_history) - max_history_messages
            batch_size = max(summary_batch_size, overflow)
            batch_to_summarize = context_history[:batch_size]
            context_summary = summarize_history(batch_to_summarize, context_summary)
            context_history = context_history[batch_size:]

        continue_session = input("Continue Session? (y/n) ").strip().lower()
        session_ended = continue_session not in {"y", "yes"}
