import os
import platform

if os.name == "nt":
    platform.machine = lambda: (
        os.environ.get("PROCESSOR_ARCHITEW6432")
        or os.environ.get("PROCESSOR_ARCHITECTURE")
        or "AMD64"
    )

import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("BACKEND_PORT") or os.environ.get("PORT", "8000"))
    host = os.environ.get("BACKEND_HOST", "0.0.0.0")
    uvicorn.run("app.main:app", host=host, port=port)
