import os
import shutil
from typing import Tuple, List, Optional
from fastapi import UploadFile
import uuid
from datetime import datetime
import mimetypes
from pathlib import Path
import io
import base64

from app.core.config import settings

# Define allowed file extensions
ALLOWED_EXTENSIONS = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain',
}

# Define allowed image extensions for profile pictures
ALLOWED_IMAGE_EXTENSIONS = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg', 
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
}

# Base upload directory
UPLOAD_DIR = Path('/app/uploads')

async def save_upload_file(upload_file: UploadFile, thesis_id: str) -> Tuple[str, str, int]:
    """
    Save an uploaded file to the appropriate directory.
    Returns the file path, mimetype, and size.
    """
    # Create directory structure if it doesn't exist
    thesis_dir = UPLOAD_DIR / thesis_id
    thesis_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate a unique filename to prevent collisions
    filename = upload_file.filename
    base_name, extension = os.path.splitext(filename)
    unique_filename = f"{base_name}_{uuid.uuid4().hex}{extension}"
    file_path = thesis_dir / unique_filename
    
    # Save the file
    with open(file_path, "wb") as buffer:
        content = await upload_file.read()
        buffer.write(content)
        file_size = len(content)
    
    # Determine mimetype
    mimetype, _ = mimetypes.guess_type(filename)
    if not mimetype:
        # Default to binary if type can't be determined
        mimetype = "application/octet-stream"
    
    # Return the relative path from the upload directory
    relative_path = str(file_path.relative_to(UPLOAD_DIR))
    return relative_path, mimetype, file_size

def validate_file_type(filename: str) -> bool:
    """
    Validate if the file type is allowed.
    """
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    return ext in ALLOWED_EXTENSIONS

def validate_image_type(filename: str) -> bool:
    """
    Validate if the image file type is allowed for profile pictures.
    """
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    return ext in ALLOWED_IMAGE_EXTENSIONS

async def save_profile_picture(upload_file: UploadFile, user_id: str) -> Tuple[str, str, int]:
    """
    Save a profile picture to the appropriate directory.
    Returns the file path, mimetype, and size.
    """
    # Create directory structure if it doesn't exist
    profile_dir = UPLOAD_DIR / 'profiles'
    profile_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate a unique filename to prevent collisions
    filename = upload_file.filename
    base_name, extension = os.path.splitext(filename)
    unique_filename = f"{user_id}_profile_{uuid.uuid4().hex}{extension}"
    file_path = profile_dir / unique_filename
    
    # Save the file
    with open(file_path, "wb") as buffer:
        content = await upload_file.read()
        buffer.write(content)
        file_size = len(content)
    
    # Determine mimetype
    mimetype, _ = mimetypes.guess_type(filename)
    if not mimetype:
        # Default to binary if type can't be determined
        mimetype = "application/octet-stream"
    
    # Return the relative path from the upload directory
    relative_path = str(file_path.relative_to(UPLOAD_DIR))
    return relative_path, mimetype, file_size

def delete_file(file_path: str) -> bool:
    """
    Delete a file from the filesystem.
    """
    try:
        full_path = UPLOAD_DIR / file_path
        if full_path.exists():
            full_path.unlink()
            # Check if the directory is empty, and remove it if it is
            if not any(full_path.parent.iterdir()):
                full_path.parent.rmdir()
            return True
        return False
    except Exception:
        return False

def get_file_path(file_path: str) -> Path:
    """
    Get the full file path.
    """
    return UPLOAD_DIR / file_path

async def extract_text_from_file(file_path: Path) -> Optional[str]:
    """
    Extract text content from a file based on its type.
    Returns the text content if possible, None otherwise.
    """
    try:
        ext = file_path.suffix.lower()[1:]  # Remove the leading dot
        
        # For text files, simply read the content
        if ext == 'txt':
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
                
        # For docx files, use python-docx
        elif ext == 'docx':
            try:
                import docx
                doc = docx.Document(file_path)
                return '\n'.join([para.text for para in doc.paragraphs])
            except ImportError:
                return "Text extraction for DOCX files requires the python-docx library."
                
        # For PDF files, use PyPDF2
        elif ext == 'pdf':
            try:
                import PyPDF2
                text = []
                with open(file_path, 'rb') as f:
                    reader = PyPDF2.PdfReader(f)
                    for page_num in range(len(reader.pages)):
                        text.append(reader.pages[page_num].extract_text())
                return '\n'.join(text)
            except ImportError:
                return "Text extraction for PDF files requires the PyPDF2 library."
                
        # For doc files (legacy Word format)
        elif ext == 'doc':
            # This is more complex and would require external libraries like antiword
            return "Text extraction for DOC files is not supported directly. Please convert to DOCX."
        
        return None
    except Exception as e:
        return f"Error extracting text: {str(e)}"

async def convert_to_html(file_path: Path) -> Optional[str]:
    """
    Convert document to HTML for browser rendering.
    Returns HTML content if possible, None otherwise.
    """
    try:
        ext = file_path.suffix.lower()[1:]
        
        # For text files, wrap in pre tags
        if ext == 'txt':
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                # Escape HTML special characters
                import html
                escaped_content = html.escape(content)
                return f'<pre style="white-space: pre-wrap;">{escaped_content}</pre>'
                
        # For docx files, use mammoth
        elif ext == 'docx':
            try:
                import mammoth
                with open(file_path, 'rb') as f:
                    result = mammoth.convert_to_html(f)
                    return result.value
            except ImportError:
                return "<p>HTML conversion for DOCX files requires the mammoth library.</p>"
                
        # For PDF files, embed using object tag
        elif ext == 'pdf':
            # For PDFs, we'll return an HTML snippet that uses an object tag
            # This isn't actual conversion, but a way to embed the PDF
            return f'<object data="/app/uploads/{file_path}" type="application/pdf" width="100%" height="600px"></object>'
                
        # For doc files (legacy Word format)
        elif ext == 'doc':
            return "<p>HTML conversion for DOC files is not supported directly. Please convert to DOCX.</p>"
        
        return None
    except Exception as e:
        return f"<p>Error converting to HTML: {str(e)}</p>"

async def get_file_preview(file_path: Path) -> dict:
    """
    Generate preview data for a file based on its type.
    Returns a dictionary with preview information.
    """
    ext = file_path.suffix.lower()[1:]
    mimetype, _ = mimetypes.guess_type(str(file_path))
    
    result = {
        "type": ext,
        "mimetype": mimetype,
        "content_type": "text",  # Default
        "content": None,
        "html": None
    }
    
    # Text files - return plain text
    if ext == 'txt':
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            result["content"] = content
            result["html"] = f'<pre style="white-space: pre-wrap;">{content}</pre>'
    
    # PDF files - base64 encode for data URI
    elif ext == 'pdf':
        result["content_type"] = "pdf"
        # Object tag for PDF rendering
        result["html"] = f'<object data="data:{mimetype};base64,CONTENT_PLACEHOLDER" type="application/pdf" width="100%" height="600px"></object>'
        
        # Only read the file if needed
        with open(file_path, 'rb') as f:
            file_content = f.read()
            base64_pdf = base64.b64encode(file_content).decode('utf-8')
            # We'll replace CONTENT_PLACEHOLDER with the actual base64 data
            result["html"] = result["html"].replace("CONTENT_PLACEHOLDER", base64_pdf)
    
    # Word documents - extract text and convert to HTML if possible
    elif ext in ['docx', 'doc']:
        result["content_type"] = "document"
        
        # Extract text (simpler fallback)
        result["content"] = await extract_text_from_file(file_path)
        
        # Try to convert to HTML (better rendering)
        try:
            if ext == 'docx':
                import mammoth
                with open(file_path, 'rb') as f:
                    html_result = mammoth.convert_to_html(f)
                    result["html"] = html_result.value
            else:
                result["html"] = f"<p>Preview not available for {ext} files. Download to view.</p>"
        except ImportError:
            result["html"] = f"<p>HTML conversion requires additional libraries.</p>"
        except Exception as e:
            result["html"] = f"<p>Error generating preview: {str(e)}</p>"
    
    return result 