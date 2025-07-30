# Import all the models, so that Base has them before being
# imported by Alembic
from app.db.base_class import Base  # noqa
from app.models.user import User  # noqa
from app.models.thesis import Thesis  # noqa
from app.models.comment import ThesisComment  # noqa
from app.models.attachment import ThesisAttachment  # noqa
from app.models.committee import ThesisCommitteeMember  # noqa
from app.models.event import Event  # noqa
from app.models.deadline import Deadline  # noqa 