"""Initial database schema

Revision ID: 001
Revises: 
Create Date: 2025-01-20 15:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create user table with correct enum values
    op.create_table('user',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=True),
        sa.Column('hashed_password', sa.String(), nullable=True),
        sa.Column('role', sa.Enum('student', 'professor', 'graduation_assistant', name='userrole'), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('is_verified', sa.Boolean(), nullable=True, default=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('profile_picture', sa.String(), nullable=True),
        sa.Column('oauth_provider', sa.String(), nullable=True),
        sa.Column('oauth_id', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_email'), 'user', ['email'], unique=True)
    op.create_index(op.f('ix_user_id'), 'user', ['id'], unique=False)
    
    # Create thesis table
    op.create_table('thesis',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('abstract', sa.Text(), nullable=True),
        sa.Column('status', sa.Enum('draft', 'submitted', 'under_review', 'approved', 'declined', 'revision_required', name='thesisstatus'), nullable=False),
        sa.Column('student_id', sa.String(), nullable=False),
        sa.Column('supervisor_id', sa.String(), nullable=True),
        sa.Column('assistant_id', sa.String(), nullable=True),
        sa.Column('document_path', sa.String(), nullable=True),
        sa.Column('document_type', sa.String(), nullable=True),
        sa.Column('document_size', sa.Integer(), nullable=True),
        sa.Column('submission_date', sa.DateTime(), nullable=True),
        sa.Column('approval_date', sa.DateTime(), nullable=True),
        sa.Column('defense_date', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['assistant_id'], ['user.id'], ),
        sa.ForeignKeyConstraint(['student_id'], ['user.id'], ),
        sa.ForeignKeyConstraint(['supervisor_id'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_thesis_id'), 'thesis', ['id'], unique=False)
    
    # Create thesisattachment table
    op.create_table('thesisattachment',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('filename', sa.String(), nullable=False),
        sa.Column('file_path', sa.String(), nullable=False),
        sa.Column('file_type', sa.String(), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('thesis_id', sa.String(), nullable=False),
        sa.Column('uploaded_by', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['thesis_id'], ['thesis.id'], ),
        sa.ForeignKeyConstraint(['uploaded_by'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_thesisattachment_id'), 'thesisattachment', ['id'], unique=False)
    
    # Create thesiscomment table
    op.create_table('thesiscomment',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('thesis_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('parent_id', sa.String(), nullable=True),
        sa.Column('is_resolved', sa.Boolean(), nullable=True, default=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
        sa.ForeignKeyConstraint(['parent_id'], ['thesiscomment.id'], ),
        sa.ForeignKeyConstraint(['thesis_id'], ['thesis.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_thesiscomment_id'), 'thesiscomment', ['id'], unique=False)
    
    # Create review table
    op.create_table('review',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('thesis_id', sa.String(), nullable=False),
        sa.Column('assistant_id', sa.String(), nullable=False),
        sa.Column('status', sa.Enum('pending', 'in_progress', 'completed', name='reviewstatus'), nullable=False),
        sa.Column('comments', sa.Text(), nullable=True),
        sa.Column('grade', sa.Float(), nullable=True),
        sa.Column('assigned_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['assistant_id'], ['user.id'], ),
        sa.ForeignKeyConstraint(['thesis_id'], ['thesis.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_review_id'), 'review', ['id'], unique=False)
    
    # Create thesiscommitteemember table
    op.create_table('thesiscommitteemember',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('thesis_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('role', sa.Enum('chair', 'reviewer', 'advisor', 'external', name='committeememberrole'), nullable=False),
        sa.Column('has_approved', sa.Boolean(), nullable=True, default=False),
        sa.Column('approval_date', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
        sa.ForeignKeyConstraint(['thesis_id'], ['thesis.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_thesiscommitteemember_id'), 'thesiscommitteemember', ['id'], unique=False)
    
    # Create event table
    op.create_table('event',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('event_date', sa.DateTime(), nullable=False),
        sa.Column('location', sa.String(), nullable=True),
        sa.Column('event_type', sa.Enum('defense', 'presentation', 'meeting', 'deadline', name='eventtype'), nullable=False),
        sa.Column('thesis_id', sa.String(), nullable=True),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
        sa.ForeignKeyConstraint(['thesis_id'], ['thesis.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_event_id'), 'event', ['id'], unique=False)
    
    # Create assistantrequest table
    op.create_table('assistantrequest',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('student_id', sa.String(), nullable=False),
        sa.Column('assistant_id', sa.String(), nullable=False),
        sa.Column('thesis_id', sa.String(), nullable=False),
        sa.Column('status', sa.Enum('requested', 'accepted', 'declined', name='requeststatus'), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['assistant_id'], ['user.id'], ),
        sa.ForeignKeyConstraint(['student_id'], ['user.id'], ),
        sa.ForeignKeyConstraint(['thesis_id'], ['thesis.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_assistantrequest_id'), 'assistantrequest', ['id'], unique=False)
    
    # Create deadline table
    op.create_table('deadline',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('location', sa.String(), nullable=True),
        sa.Column('deadline_date', sa.DateTime(), nullable=False),
        sa.Column('deadline_type', sa.Enum('submission', 'review', 'defense', 'revision', name='deadlinetype'), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('is_global', sa.Boolean(), nullable=True, default=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_deadline_id'), 'deadline', ['id'], unique=False)


def downgrade():
    # Drop tables in reverse order to handle foreign key dependencies
    op.drop_index(op.f('ix_deadline_id'), table_name='deadline')
    op.drop_table('deadline')
    
    op.drop_index(op.f('ix_assistantrequest_id'), table_name='assistantrequest')
    op.drop_table('assistantrequest')
    
    op.drop_index(op.f('ix_event_id'), table_name='event')
    op.drop_table('event')
    
    op.drop_index(op.f('ix_thesiscommitteemember_id'), table_name='thesiscommitteemember')
    op.drop_table('thesiscommitteemember')
    
    op.drop_index(op.f('ix_review_id'), table_name='review')
    op.drop_table('review')
    
    op.drop_index(op.f('ix_thesiscomment_id'), table_name='thesiscomment')
    op.drop_table('thesiscomment')
    
    op.drop_index(op.f('ix_thesisattachment_id'), table_name='thesisattachment')
    op.drop_table('thesisattachment')
    
    op.drop_index(op.f('ix_thesis_id'), table_name='thesis')
    op.drop_table('thesis')
    
    op.drop_index(op.f('ix_user_id'), table_name='user')
    op.drop_index(op.f('ix_user_email'), table_name='user')
    op.drop_table('user')
    
    # Drop enums
    op.execute('DROP TYPE IF EXISTS deadlinetype')
    op.execute('DROP TYPE IF EXISTS requeststatus')
    op.execute('DROP TYPE IF EXISTS eventtype')
    op.execute('DROP TYPE IF EXISTS committeememberrole')
    op.execute('DROP TYPE IF EXISTS reviewstatus')
    op.execute('DROP TYPE IF EXISTS thesisstatus')
    op.execute('DROP TYPE IF EXISTS userrole')
