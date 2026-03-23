from fastapi import HTTPException
import fitz
from io import BytesIO

def compress_pdf(file, quality : int):
    try:
        with fitz.open(file.path) as doc:
            buffer = BytesIO()

            doc.scrub(
            metadata=True,        # Clears basic metadata
            xml_metadata=True,    # Removes XML metadata
            attached_files=True,  # Deletes file attachments
            embedded_files=True,  # Deletes embedded files
            thumbnails=True,      # Strips page thumbnails
            reset_fields=True,    # Reverts form fields to their defaults
            reset_responses=True, # Removes annotation replies
            )

            doc.rewrite_images(
            dpi_threshold=100,   # only process images above 100 DPI
            dpi_target=72,       # downsample to 72 DPI
            quality=60,          # JPEG quality level
            lossy=True,          # include / exclude lossy images
            # lossless=True,       # include / exclude lossless images
            # bitonal=True,        # include / exclude monochrome images
            # color=True,          # include / exclude colored images
            # gray=True,           # include / exclude gray-scale images
            # set_to_gray=True,    # convert to gray-scale before conversion
            )


            doc.save(
            buffer,
            garbage=3,       # de-duplicate and drop unreferenced objects
            deflate=True,    # zlib-compress any loose streams
            use_objstms=True # convert text objects into compressible streams
            )

            buffer.seek(0)
            return buffer

    except Exception as e:
        raise HTTPException(500, f"Processing Failed :{e}")
        

