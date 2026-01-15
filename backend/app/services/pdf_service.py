import tempfile
from PyPDF2 import PdfReader
from langchain.text_splitter import CharacterTextSplitter
from typing import List
import os


def extract_text_from_pdf(file_content: bytes) -> str:
    """
    Extract text content from a PDF file.
    
    Args:
        file_content: Raw bytes of the PDF file
        
    Returns:
        Extracted text as a single string
        
    Raises:
        ValueError: If no text could be extracted (image-based PDF)
    """
    text = ""
    
    # Write bytes to a temporary file for PyPDF2 to read
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(file_content)
        tmp_path = tmp.name
    
    try:
        reader = PdfReader(tmp_path)
        
        if len(reader.pages) == 0:
            raise ValueError("PDF has no pages")
        
        for page_num, page in enumerate(reader.pages):
            try:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
            except Exception as e:
                print(f"Warning: Could not extract text from page {page_num + 1}: {e}")
                continue
                
    except Exception as e:
        raise ValueError(f"Could not read PDF file: {str(e)}")
    finally:
        # Clean up temp file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
    
    # Check if we got any meaningful text
    if not text.strip():
        raise ValueError(
            "No text could be extracted from this PDF. "
            "This usually happens with scanned documents or image-based PDFs. "
            "Please upload a PDF with actual text content."
        )
    
    # Check if text is too short to be useful
    if len(text.strip()) < 50:
        raise ValueError(
            f"Very little text extracted ({len(text.strip())} characters). "
            "This PDF may contain mostly images. Please use a text-based PDF."
        )
    
    return text.strip()


def split_text_into_chunks(
    text: str,
    chunk_size: int = 1000,
    chunk_overlap: int = 200
) -> List[str]:
    """
    Split text into overlapping chunks for vector storage.
    
    Args:
        text: The full text to split
        chunk_size: Maximum size of each chunk
        chunk_overlap: Number of characters to overlap between chunks
        
    Returns:
        List of text chunks
    """
    splitter = CharacterTextSplitter(
        separator="\n",
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len
    )
    
    chunks = splitter.split_text(text)
    return chunks


def get_pdf_metadata(file_content: bytes) -> dict:
    """
    Extract metadata from a PDF file.
    
    Args:
        file_content: Raw bytes of the PDF file
        
    Returns:
        Dictionary containing PDF metadata
    """
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(file_content)
        tmp_path = tmp.name
    
    try:
        reader = PdfReader(tmp_path)
        metadata = {
            "num_pages": len(reader.pages),
            "info": reader.metadata if reader.metadata else {}
        }
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
    
    return metadata
