import hashlib
import hmac
import os


PASSWORD_PREFIX = "pbkdf2_sha256"
ITERATIONS = 120_000


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
