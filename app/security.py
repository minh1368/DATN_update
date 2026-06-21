import hashlib
import hmac
import os
import base64
import json
import time


PASSWORD_PREFIX = "pbkdf2_sha256"
ITERATIONS = 120_000
TOKEN_TTL_SECONDS = 60 * 60 * 24


def hash_password(password: str) -> str:
    salt = os.urandom(16).hex()
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt), ITERATIONS)
    return f"{PASSWORD_PREFIX}${ITERATIONS}${salt}${digest.hex()}"


def verify_password(password: str, stored_password: str | None) -> bool:
    if not stored_password:
        return False
    if not stored_password.startswith(f"{PASSWORD_PREFIX}$"):
        return hmac.compare_digest(stored_password, password)
    try:
        _, iterations, salt, expected = stored_password.split("$", 3)
        digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt), int(iterations))
    except (TypeError, ValueError):
        return False
    return hmac.compare_digest(digest.hex(), expected)


def is_password_hash(value: str | None) -> bool:
    return bool(value and value.startswith(f"{PASSWORD_PREFIX}$"))


def _token_secret() -> str:
    return os.getenv("APP_SECRET_KEY", "dev-secret-change-me")


def create_access_token(payload: dict, ttl_seconds: int = TOKEN_TTL_SECONDS) -> str:
    data = {
        **payload,
        "exp": int(time.time()) + ttl_seconds,
    }
    raw = json.dumps(data, separators=(",", ":"), sort_keys=True).encode("utf-8")
    encoded = base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")
    signature = hmac.new(
        _token_secret().encode("utf-8"),
        encoded.encode("ascii"),
        hashlib.sha256,
    ).hexdigest()
    return f"{encoded}.{signature}"


def verify_access_token(token: str | None) -> dict | None:
    if not token or "." not in token:
        return None
    encoded, signature = token.rsplit(".", 1)
    expected = hmac.new(
        _token_secret().encode("utf-8"),
        encoded.encode("ascii"),
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(signature, expected):
        return None
    try:
        padded = encoded + "=" * (-len(encoded) % 4)
        payload = json.loads(base64.urlsafe_b64decode(padded.encode("ascii")).decode("utf-8"))
    except (ValueError, json.JSONDecodeError):
        return None
    if int(payload.get("exp", 0)) < int(time.time()):
        return None
    return payload
