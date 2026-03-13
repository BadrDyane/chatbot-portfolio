import requests
from config import settings

print(f"Using key: {settings.openai_api_key[:15]}...")

response = requests.post(
    "https://api.openai.com/v1/embeddings",
    headers={
        "Authorization": f"Bearer {settings.openai_api_key}",
        "Content-Type": "application/json"
    },
    json={
        "model": "text-embedding-3-small",
        "input": ["test"]
    },
    timeout=30
)

print(f"Status code: {response.status_code}")
print(response.json())