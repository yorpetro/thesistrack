from typing import Any, List
from datetime import datetime
import uuid
import os

from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form, Depends
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.encoders import jsonable_encoder

from app.core.deps import DB, CurrentActiveUser
from app.models.thesis import Thesis, ThesisStatus
from app.models.attachment import ThesisAttachment
from app.models.user import UserRole
from app.schemas.attachment import (
    Attachment as AttachmentSchema,
    AttachmentCreate,
    AttachmentUpdate,
    AttachmentDetail
)
from app.core.file_utils import (
    save_upload_file, 
    validate_file_type, 
    delete_file, 
    get_file_path,
    extract_text_from_file,
    convert_to_html,
    get_file_preview
)

router = APIRouter()

@router.get("/{thesis_id}/attachments", response_model=List[AttachmentSchema])
async def read_attachments(
    thesis_id: str,
    db: DB,
    current_user: CurrentActiveUser,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve all attachments for a thesis.
    """
    # Check if thesis exists
    thesis = db.query(Thesis).filter(Thesis.id == thesis_id).first()
    if not thesis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thesis not found",
        )
    
    # Check permissions - students can only access their own thesis, professors/assistants can access any
    if (current_user.role == UserRole.STUDENT and 
        current_user.id != thesis.student_id):
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to access this thesis",
        )
    
    # Retrieve attachments
    attachments = db.query(ThesisAttachment).filter(
        ThesisAttachment.thesis_id == thesis_id
    ).offset(skip).limit(limit).all()
    
    return attachments

@router.post("/{thesis_id}/attachments", response_model=AttachmentSchema)
async def create_attachment(
    thesis_id: str,
    db: DB,
    current_user: CurrentActiveUser,
    file: UploadFile = File(...),
    description: str = Form(None),
) -> Any:
    """
    Create new attachment for a thesis.
    """
    # Check if thesis exists
    thesis = db.query(Thesis).filter(Thesis.id == thesis_id).first()
    if not thesis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thesis not found",
        )
    
    # Check permissions (only student who owns the thesis or reviewers can add attachments)
    is_owner = current_user.id == thesis.student_id
    is_reviewer = current_user.role in [UserRole.PROFESSOR, UserRole.GRAD_ASSISTANT]
    
    if not (is_owner or is_reviewer):
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to update this thesis",
        )
    
    # Validate file type
    if not validate_file_type(file.filename):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: pdf, doc, docx, txt",
        )
    
    # Save the file
    try:
        file_path, file_type, file_size = await save_upload_file(file, thesis_id)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save file: {str(e)}",
        )
    
    # Create the attachment record
    attachment_id = str(uuid.uuid4())
    db_attachment = ThesisAttachment(
        id=attachment_id,
        filename=file.filename,
        file_path=file_path,
        file_type=file_type,
        file_size=file_size,
        description=description,
        thesis_id=thesis_id,
        uploaded_by=current_user.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    
    db.add(db_attachment)
    db.commit()
    db.refresh(db_attachment)
    
    # Update thesis updated_at time
    thesis.updated_at = datetime.utcnow()
    db.add(thesis)
    db.commit()
    
    return db_attachment

@router.get("/{thesis_id}/attachments/{attachment_id}", response_model=AttachmentDetail)
async def read_attachment(
    thesis_id: str,
    attachment_id: str,
    db: DB,
    current_user: CurrentActiveUser,
) -> Any:
    """
    Get a specific attachment by ID.
    """
    # Check if thesis exists
    thesis = db.query(Thesis).filter(Thesis.id == thesis_id).first()
    if not thesis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thesis not found",
        )
    
    # Check permissions - students can only access their own thesis, professors/assistants can access any
    if (current_user.role == UserRole.STUDENT and 
        current_user.id != thesis.student_id):
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to access this thesis",
        )
    
    # Retrieve attachment
    attachment = db.query(ThesisAttachment).filter(
        ThesisAttachment.id == attachment_id, 
        ThesisAttachment.thesis_id == thesis_id
    ).first()
    
    if not attachment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attachment not found",
        )
    
    return attachment

@router.get("/{thesis_id}/attachments/{attachment_id}/download")
async def download_attachment(
    thesis_id: str,
    attachment_id: str,
    db: DB,
    current_user: CurrentActiveUser,
    inline: bool = False,
) -> Any:
    """
    Download a specific attachment.
    If inline=true, it will attempt to display in the browser instead of downloading.
    """
    # Check if thesis exists
    thesis = db.query(Thesis).filter(Thesis.id == thesis_id).first()
    if not thesis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thesis not found",
        )
    
    # Check permissions - students can only access their own thesis, professors/assistants can access any
    if (current_user.role == UserRole.STUDENT and 
        current_user.id != thesis.student_id):
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to access this thesis",
        )
    
    # Retrieve attachment
    attachment = db.query(ThesisAttachment).filter(
        ThesisAttachment.id == attachment_id, 
        ThesisAttachment.thesis_id == thesis_id
    ).first()
    
    if not attachment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attachment not found",
        )
    
    # Get the file path
    file_path = get_file_path(attachment.file_path)
    
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on server",
        )
    
    # Set disposition based on inline parameter
    content_disposition = "inline" if inline else "attachment"
    
    return FileResponse(
        path=file_path, 
        filename=attachment.filename,
        media_type=attachment.file_type,
        headers={"Content-Disposition": f"{content_disposition}; filename={attachment.filename}"}
    )

@router.get("/{thesis_id}/attachments/{attachment_id}/preview", response_class=JSONResponse)
async def preview_attachment(
    thesis_id: str,
    attachment_id: str,
    db: DB,
    current_user: CurrentActiveUser,
    format: str = "json"  # "json", "html", or "text"
) -> Any:
    """
    Preview a specific attachment with converted content for display in the browser.
    Returns different formats based on the 'format' parameter:
    - json: Full preview data including HTML and text content (default)
    - html: HTML-only response for direct embedding
    - text: Plain text content for simple display
    """
    # Check if thesis exists
    thesis = db.query(Thesis).filter(Thesis.id == thesis_id).first()
    if not thesis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thesis not found",
        )
    
    # Check permissions - students can only access their own thesis, professors/assistants can access any
    if (current_user.role == UserRole.STUDENT and 
        current_user.id != thesis.student_id):
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to access this thesis",
        )
    
    # Retrieve attachment
    attachment = db.query(ThesisAttachment).filter(
        ThesisAttachment.id == attachment_id, 
        ThesisAttachment.thesis_id == thesis_id
    ).first()
    
    if not attachment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attachment not found",
        )
    
    # Get the file path
    file_path = get_file_path(attachment.file_path)
    
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on server",
        )
    
    # Generate preview data
    preview_data = await get_file_preview(file_path)
    
    # Add metadata to the response
    preview_data["filename"] = attachment.filename
    preview_data["file_size"] = attachment.file_size
    preview_data["description"] = attachment.description
    
    # Return response based on requested format
    if format == "html" and preview_data.get("html"):
        return HTMLResponse(content=preview_data["html"], status_code=200)
    elif format == "text" and preview_data.get("content"):
        return JSONResponse(content={"content": preview_data["content"]}, status_code=200)
    else:
        # Default to JSON with all data
        return JSONResponse(content=jsonable_encoder(preview_data), status_code=200)

@router.put("/{thesis_id}/attachments/{attachment_id}", response_model=AttachmentSchema)
async def update_attachment(
    thesis_id: str,
    attachment_id: str,
    attachment_in: AttachmentUpdate,
    db: DB,
    current_user: CurrentActiveUser,
) -> Any:
    """
    Update an attachment metadata (not the file itself).
    """
    # Check if thesis exists
    thesis = db.query(Thesis).filter(Thesis.id == thesis_id).first()
    if not thesis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thesis not found",
        )
    
    # Get the attachment
    attachment = db.query(ThesisAttachment).filter(
        ThesisAttachment.id == attachment_id,
        ThesisAttachment.thesis_id == thesis_id
    ).first()
    
    if not attachment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attachment not found",
        )
    
    # Check permissions (only owner or uploader can update)
    is_owner = current_user.id == thesis.student_id
    is_uploader = current_user.id == attachment.uploaded_by
    is_reviewer = current_user.role in [UserRole.PROFESSOR, UserRole.GRAD_ASSISTANT]
    
    if not (is_owner or is_uploader or is_reviewer):
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to update this attachment",
        )
    
    # Update fields
    attachment_data = attachment_in.dict(exclude_unset=True)
    for field, value in attachment_data.items():
        setattr(attachment, field, value)
    
    attachment.updated_at = datetime.utcnow()
    
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    
    return attachment

@router.delete("/{thesis_id}/attachments/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_attachment(
    thesis_id: str,
    attachment_id: str,
    db: DB,
    current_user: CurrentActiveUser,
) -> None:
    """
    Delete an attachment.
    """
    # Check if thesis exists
    thesis = db.query(Thesis).filter(Thesis.id == thesis_id).first()
    if not thesis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thesis not found",
        )
    
    # Get the attachment
    attachment = db.query(ThesisAttachment).filter(
        ThesisAttachment.id == attachment_id,
        ThesisAttachment.thesis_id == thesis_id
    ).first()
    
    if not attachment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attachment not found",
        )
    
    # Check permissions (only owner, uploader, or supervisor can delete)
    is_owner = current_user.id == thesis.student_id
    is_uploader = current_user.id == attachment.uploaded_by
    is_supervisor = current_user.id == thesis.supervisor_id
    
    if not (is_owner or is_uploader or is_supervisor):
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to delete this attachment",
        )
    
    # Delete the file from filesystem
    if not delete_file(attachment.file_path):
        # Continue even if file deletion fails, as we still want to remove the DB record
        # But log the error
        print(f"Error: Could not delete file {attachment.file_path}")
    
    # Delete the DB record
    db.delete(attachment)
    db.commit()
    
    return None

@router.post("/{thesis_id}/attachments/{attachment_id}/replace", response_model=AttachmentSchema)
async def replace_attachment(
    thesis_id: str,
    attachment_id: str,
    db: DB,
    current_user: CurrentActiveUser,
    file: UploadFile = File(...),
) -> Any:
    """
    Replace an existing attachment with a new file.
    """
    # Check if thesis exists
    thesis = db.query(Thesis).filter(Thesis.id == thesis_id).first()
    if not thesis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thesis not found",
        )
    
    # Get the attachment
    attachment = db.query(ThesisAttachment).filter(
        ThesisAttachment.id == attachment_id,
        ThesisAttachment.thesis_id == thesis_id
    ).first()
    
    if not attachment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attachment not found",
        )
    
    # Check permissions (only owner or uploader can replace)
    is_owner = current_user.id == thesis.student_id
    is_uploader = current_user.id == attachment.uploaded_by
    
    if not (is_owner or is_uploader):
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to replace this attachment",
        )
    
    # Validate file type
    if not validate_file_type(file.filename):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: pdf, doc, docx, txt",
        )
    
    # Save the old file path for deletion
    old_file_path = attachment.file_path
    
    # Save the new file
    try:
        file_path, file_type, file_size = await save_upload_file(file, thesis_id)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save file: {str(e)}",
        )
    
    # Update the attachment record
    attachment.filename = file.filename
    attachment.file_path = file_path
    attachment.file_type = file_type
    attachment.file_size = file_size
    attachment.updated_at = datetime.utcnow()
    
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    
    # Delete the old file
    delete_file(old_file_path)  # We don't raise an exception if this fails
    
    # Update thesis updated_at time
    thesis.updated_at = datetime.utcnow()
    db.add(thesis)
    db.commit()
    
    return attachment 