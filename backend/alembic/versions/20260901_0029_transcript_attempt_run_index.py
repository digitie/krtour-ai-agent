"""transcript_attempts 작업 참조 해제용 인덱스.

`crawl_runs` 삭제 시 `run_id` FK의 `SET NULL` 갱신 대상을 빠르게 찾는다.

Revision ID: 20260901_0029
Revises: 20260714_0028
Create Date: 2026-09-01
"""

from __future__ import annotations

from alembic import op

revision = "20260901_0029"
down_revision = "20260714_0028"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "ix_transcript_attempts_run_id",
        "transcript_attempts",
        ["run_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_transcript_attempts_run_id",
        table_name="transcript_attempts",
    )
