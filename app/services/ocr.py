import fitz
from PIL import Image
import pytesseract
from io import BytesIO
from pathlib import Path

def image_to_pdf(file, lang = "eng"):
    try:
        image = Image.open(file.path).convert("RGB")

        pdf_bytes = pytesseract.image_to_pdf_or_hocr(
            image,
            extension = "pdf",
            lang = lang
        )

        buffer = BytesIO(pdf_bytes)
        buffer.seek(0)
        return buffer
    
    except Exception as e:
        raise RuntimeError(f"OCR image failed : {e}")
    
def pdf_to_pdf(file, lang = "eng"):
    try:
        with fitz.open(file.path) as doc:
            with fitz.open() as output_pdf:               

                for page in doc:
                    pix = page.get_pixmap(dpi = 200)
                    img_bytes = pix.tobytes("png")

                    image = Image.open(BytesIO(img_bytes)).convert("L")

                    pdf_bytes = pytesseract.image_to_pdf_or_hocr(
                        image,
                        extension = "pdf",
                        lang = lang
                    )

                    ocr_page = fitz.open("pdf", pdf_bytes)
                    output_pdf.insert_pdf(ocr_page)
                    ocr_page.close()

                buffer = BytesIO()
                output_pdf.save(buffer)
                buffer.seek(0)
                
                return buffer
        
    except Exception as e:
        raise RuntimeError(f"OCR pdf failed : {e}")
    
def  ocr_to_pdf(file):
    ext = Path(file.path).suffix.lower()

    if ext in [".jpg", ".jpeg", ".png"]:
        return image_to_pdf(file)
    elif ext == ".pdf":
        return pdf_to_pdf(file)
    else:
        raise RuntimeError("Unsupported file format")
