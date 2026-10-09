import sys
import json
import urllib.request

# Ensure UTF-8 output even in Windows cmd/powershell
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://127.0.0.1:8000/api/assistant/chat"

test_cases = [
    {
        "upload_id": "a0b58020-2150-4545-a2de-3bebd4fff2f2",
        "message": "maine khud khichi hai photo camera se",
        "language": "hinglish"
    },
    {
        "upload_id": "a0b58020-2150-4545-a2de-3bebd4fff2f2",
        "message": "background me kya dikkat hai detail me batao",
        "language": "hinglish"
    },
    {
        "upload_id": "a0b58020-2150-4545-a2de-3bebd4fff2f2",
        "message": "पीछे का बैकग्राउंड क्यों नकली है?",
        "language": "hindi"
    },
    {
        "upload_id": "a0b58020-2150-4545-a2de-3bebd4fff2f2",
        "message": "पाछै का बैकग्राउंड कित तै जोड्या सै?",
        "language": "haryanvi"
    },
    {
        "upload_id": "a0b58020-2150-4545-a2de-3bebd4fff2f2",
        "message": "ई फोटो में का गड़बड़ लउकत बा?",
        "language": "bhojpuri"
    },
    {
        "upload_id": "a0b58020-2150-4545-a2de-3bebd4fff2f2",
        "message": "મેં પોતે કેમેરાથી ફોટો લીધો છે, તો કેમ આવું બતાવે છે?",
        "language": "gujarati"
    },
    {
        "upload_id": "a0b58020-2150-4545-a2de-3bebd4fff2f2",
        "message": "What specific generative tools or inpainting were used?",
        "language": "english"
    },
    {
        "upload_id": "9543ba4b-b113-4200-8206-6a4db96d6284",
        "message": "kya ye video fake hai ya real?",
        "language": "hinglish"
    }
]

for idx, tc in enumerate(test_cases, 1):
    print(f"\n=== Test Case {idx}: [{tc['language'].upper()}] '{tc['message']}' ===")
    req = urllib.request.Request(
        BASE_URL,
        data=json.dumps(tc).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            print("Reply:", res_data.get("reply"))
    except Exception as e:
        print("Error:", e)
