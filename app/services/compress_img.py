from io import BytesIO

from fastapi import HTTPException
from PIL import Image

from ..models.files import File


def compress_img(file: File, quality: int = 50) -> BytesIO:
    try:
        with Image.open(file.path) as image:
            if image.mode in ("RGBA", "P"):
                image = image.convert("RGB")

            buffer = BytesIO()
            image.save(buffer, format="JPEG", optimize=True, quality=quality)
            buffer.seek(0)
            return buffer
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Processing failed: {exc}") from exc
