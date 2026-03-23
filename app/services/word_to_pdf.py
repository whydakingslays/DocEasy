import shutil
import tempfile
from io import BytesIO
from pathlib import Path

from docx2pdf import convert

TEMP_ROOT = Path("storage/temp")
TEMP_ROOT.mkdir(parents=True, exist_ok=True)


def word_to_pdf(file):
    try:
        with tempfile.TemporaryDirectory(dir=TEMP_ROOT) as tmp_dir:
            temp_dir = Path(tmp_dir)

            word_path = temp_dir / "input.docx"
            pdf_path = temp_dir / "output.pdf"

            with open(file.path, "rb") as source, open(word_path, "wb") as destination:
                shutil.copyfileobj(source, destination)

            convert(str(word_path), str(pdf_path))

            buffer = BytesIO()
            with open(pdf_path, "rb") as generated_pdf:
                shutil.copyfileobj(generated_pdf, buffer)

            buffer.seek(0)
            return buffer
    except Exception as exc:
        raise RuntimeError(f"docx -> pdf failed: {exc}") from exc
