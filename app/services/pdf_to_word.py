from pathlib import Path
import tempfile
import shutil
from pdf2docx import Converter
from io import BytesIO

TEMP_ROOT = Path("storage/temp")
TEMP_ROOT.mkdir(parents = True, exist_ok = True)

def pdf_to_word(file):
    try:
        with tempfile.TemporaryDirectory(dir = TEMP_ROOT) as tmp_dir:
            tmp_dir = Path(tmp_dir)

            pdf_path = tmp_dir / "input.pdf"
            docx_path = tmp_dir / "output.docx"

            with open(file.path, "rb") as f, open(pdf_path, "wb") as out:
                shutil.copyfileobj(f, out)

            
            cv = Converter(str(pdf_path))
            try:
                cv.convert(str(docx_path))
            finally:
                cv.close()

            buffer = BytesIO()
            with open(docx_path, "rb") as f:
                shutil.copyfileobj(f, buffer)

            buffer.seek(0)
            return buffer

    except Exception as e:
        raise RuntimeError(f"pdf -> docx failed : {e}")