import httpx
import openai
import asyncio
from config import settings

async def test():
    client = openai.AsyncOpenAI(
        api_key=settings.openai_api_key,
        http_client=httpx.AsyncClient(
            proxy=None,
            trust_env=False,
            timeout=30.0
        )
    )
    
    print("Testing connection to OpenAI...")
    print(f"Using key: {settings.openai_api_key[:10]}...")
    
    response = await client.embeddings.create(
        model="text-embedding-3-small",
        input=["test"]
    )
    
    print(f"SUCCESS: Got {len(response.data[0].embedding)} dimensions")

asyncio.run(test())