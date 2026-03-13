"""
test_chat.py
Quick test script to verify the chat endpoint works end to end.
Run with: python test_chat.py
"""

import requests
import json

BASE_URL = "http://localhost:8000"


def ask_question(question: str, session_id: str = None):
    print(f"\n❓ Question: {question}")
    print("🤖 Answer: ", end="", flush=True)

    payload = {"question": question}
    if session_id:
        payload["session_id"] = session_id

    response = requests.post(
        f"{BASE_URL}/chat/message",
        json=payload,
        stream=True
    )

    full_answer = ""
    current_session_id = session_id

    for line in response.iter_lines():
        if line:
            line = line.decode("utf-8")
            if line.startswith("data: "):
                data = json.loads(line[6:])

                if "token" in data:
                    print(data["token"], end="", flush=True)
                    full_answer += data["token"]

                if "session_id" in data and not current_session_id:
                    current_session_id = data["session_id"]

                if data.get("done"):
                    print()  # New line after answer

    return current_session_id, full_answer


def main():
    print("=" * 50)
    print("SupportAI Chat Test")
    print("=" * 50)

    # Test 1: Basic question in knowledge base
    session_id, _ = ask_question("What is your refund policy?")

    # Test 2: Follow-up question (same session)
    ask_question("How do I request it?", session_id)

    # Test 3: Question NOT in knowledge base
    ask_question("What is the price of your premium plan?", session_id)

    # Test 4: Business hours
    ask_question("What are your business hours?", session_id)

    print("\n" + "=" * 50)
    print(f"Session ID: {session_id}")
    print("All tests complete!")


if __name__ == "__main__":
    main()