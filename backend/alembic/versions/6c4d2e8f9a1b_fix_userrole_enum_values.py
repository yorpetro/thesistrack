"""Fix userrole enum values

Revision ID: 6c4d2e8f9a1b
Revises: 5bbec546fa1c
Create Date: 2025-01-20 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6c4d2e8f9a1b'
down_revision = '5bbec546fa1c'
branch_labels = None
depends_on = None


def upgrade():
    # Fix the userrole enum values to match the Python code
    # First, we need to add the new enum values
    op.execute("ALTER TYPE userrole ADD VALUE 'student'")
    op.execute("ALTER TYPE userrole ADD VALUE 'professor'") 
    op.execute("ALTER TYPE userrole ADD VALUE 'graduation_assistant'")
    
    # Update existing data to use the new values
    op.execute("UPDATE \"user\" SET role = 'student' WHERE role = 'STUDENT'")
    op.execute("UPDATE \"user\" SET role = 'professor' WHERE role = 'PROFESSOR'")
    op.execute("UPDATE \"user\" SET role = 'graduation_assistant' WHERE role = 'GRADUATION_ASSISTANT'")
    
    # Unfortunately, PostgreSQL doesn't allow removing enum values directly
    # We need to recreate the enum with only the correct values
    
    # Create a new enum with the correct values
    op.execute("CREATE TYPE userrole_new AS ENUM ('student', 'professor', 'graduation_assistant')")
    
    # Update the table to use the new enum
    op.execute("ALTER TABLE \"user\" ALTER COLUMN role TYPE userrole_new USING role::text::userrole_new")
    
    # Drop the old enum and rename the new one
    op.execute("DROP TYPE userrole")
    op.execute("ALTER TYPE userrole_new RENAME TO userrole")


def downgrade():
    # Create the old enum
    op.execute("CREATE TYPE userrole_old AS ENUM ('STUDENT', 'PROFESSOR', 'GRADUATION_ASSISTANT')")
    
    # Update existing data back to uppercase
    op.execute("UPDATE \"user\" SET role = 'STUDENT' WHERE role = 'student'")
    op.execute("UPDATE \"user\" SET role = 'PROFESSOR' WHERE role = 'professor'")
    op.execute("UPDATE \"user\" SET role = 'GRADUATION_ASSISTANT' WHERE role = 'graduation_assistant'")
    
    # Update the table to use the old enum
    op.execute("ALTER TABLE \"user\" ALTER COLUMN role TYPE userrole_old USING role::text::userrole_old")
    
    # Drop the new enum and rename the old one
    op.execute("DROP TYPE userrole")
    op.execute("ALTER TYPE userrole_old RENAME TO userrole")
