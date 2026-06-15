import re
import uuid
from pathlib import Path
from fastapi import UploadFile
import aiofiles

SAFE_NAME_REGEX = re.compile(r"[^a-zA-Z0-9_-]+")


def slugify_filename(value: str) -> str:
    stem = Path(value).stem.lower().strip()
    stem = SAFE_NAME_REGEX.sub("-", stem)
    return re.sub(r"-+", "-", stem).strip("-") or "file"


def build_unique_filename(original_name: str, suffix: str) -> str:
    return f"{slugify_filename(original_name)}-{uuid.uuid4().hex[:10]}{suffix}"


async def save_upload_file(upload_file: UploadFile, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    async with aiofiles.open(destination, "wb") as out_file:
        while chunk := await upload_file.read(1024 * 1024):
            await out_file.write(chunk)
    await upload_file.close()
