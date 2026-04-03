import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
if not GOOGLE_API_KEY:
    raise RuntimeError("Missing GOOGLE_API_KEY or GEMINI_API_KEY environment variable.")
genai.configure(api_key=GOOGLE_API_KEY)

SYSTEM_PROMPT = (
    "You are a mindfulness virtual assistant for a multilingual mindfulness session. "
    "Respond with calm, supportive, and practical guidance while keeping continuity "
    "with the conversation so far."
)


def build_chat_prompt(user_message, history=None, summary=""):
    history = history or []
    sections = [SYSTEM_PROMPT]

    if summary:
        sections.append(f"Conversation summary so far:\n{summary}")

    if history:
        transcript = "\n".join(
            f"{item['role'].capitalize()}: {item['content']}" for item in history
        )
        sections.append(f"Recent conversation:\n{transcript}")

    sections.append(f"User: {user_message}")
    sections.append("Assistant:")
    return "\n\n".join(sections)


def summarize_history(history, prior_summary="", model="gemini-2.5-flash"):
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


def build_session_recap(summary="", history=None, model="gemini-2.5-flash"):
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

def call_gemini(prompt, model="gemini-3.1-flash-lite-preview", temperature=0.7):
    model_obj = genai.GenerativeModel(model)

    generation_config = genai.types.GenerationConfig(
        temperature=temperature,
        top_p=0.95,
        top_k=40,
        max_output_tokens=8192,
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
