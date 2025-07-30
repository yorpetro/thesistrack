from app.schemas.user import User, UserCreate, UserUpdate, UserInDB, UserCreateOAuth
from app.schemas.thesis import Thesis, ThesisCreate, ThesisUpdate, ThesisDetail, UserSimple
from app.schemas.comment import Comment, CommentCreate, CommentUpdate, CommentDetail, CommentBase
from app.schemas.attachment import Attachment, AttachmentCreate, AttachmentUpdate, AttachmentDetail, AttachmentBase
from app.schemas.committee import CommitteeMember, CommitteeMemberCreate, CommitteeMemberUpdate, CommitteeMemberDetail, CommitteeMemberSimple, ThesisSimple
from app.schemas.event import Event, EventCreate, EventUpdate, EventDetail
from app.schemas.request import Request, RequestCreate, RequestUpdate, RequestDetail
from app.schemas.review import ReviewBase, ReviewCreate, ReviewUpdate, ReviewRead, ReviewInDB
from app.schemas.deadline import Deadline, DeadlineCreate, DeadlineUpdate, DeadlineDetail 