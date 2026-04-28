"""
Proxy server: forwards all /api/* requests to the Next.js dev server on port 3000.
This is needed because the Emergent platform routes /api/* to port 8001.
"""
import httpx
from fastapi import FastAPI, Request
from fastapi.responses import Response

app = FastAPI()
NEXTJS_BASE = "http://localhost:3000"


@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
async def proxy(request: Request, path: str):
    url = f"{NEXTJS_BASE}/{path}"
    params = dict(request.query_params)
    body = await request.body()

    # Forward all headers except host
    headers = {k: v for k, v in request.headers.items() if k.lower() != "host"}

    async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
        resp = await client.request(
            method=request.method,
            url=url,
            params=params,
            content=body,
            headers=headers,
        )

    # Return the proxied response
    excluded = {"transfer-encoding", "content-encoding"}
    resp_headers = {k: v for k, v in resp.headers.items() if k.lower() not in excluded}
    return Response(
        content=resp.content,
        status_code=resp.status_code,
        headers=resp_headers,
    )
