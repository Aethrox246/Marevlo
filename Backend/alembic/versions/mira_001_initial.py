"""MIRA v4 initial schema

Creates all MIRA tables. Additive only — touches zero existing tables.

All tables prefixed mira_*. All user-linked tables have ON DELETE CASCADE
foreign keys to users(id) so deleting a user wipes all their MIRA state.

Revision ID: mira_001_initial
Revises: <your_latest_existing_revision>
Create Date: 2026-04-20

To apply:
    cd backend
    alembic upgrade head

To rollback:
    alembic downgrade -1
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic
revision = "mira_001_initial"
down_revision = "e884468cca8e"  # Marevlo's initial schema
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ---------------------------------------------------------------
    # 1. mira_user_profiles
    # Per-user cognitive state. One row per user.
    # ---------------------------------------------------------------
    op.create_table(
        "mira_user_profiles",
        sa.Column("user_id", sa.Integer(), primary_key=True),
        sa.Column(
            "tier",
            sa.String(20),
            nullable=False,
            server_default="free",
        ),
        sa.Column("tier_active_until", sa.TIMESTAMP(timezone=True)),
        sa.Column(
            "quota_used_this_period",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
        sa.Column("quota_period_resets_at", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column(
            "beliefs",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column(
            "bandit_state",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column(
            "personal_prompt",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column(
            "frustration_signals",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "onboarding_completed",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
        sa.Column(
            "preferences",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("idx_mira_profiles_tier", "mira_user_profiles", ["tier"])
    op.create_index(
        "idx_mira_profiles_updated", "mira_user_profiles", ["updated_at"]
    )

    # ---------------------------------------------------------------
    # 2. mira_concept_lattices
    # One lattice per (course_id, module_id). JSONB holds the
    # full Concept graph (concepts + prerequisites).
    # ---------------------------------------------------------------
    op.create_table(
        "mira_concept_lattices",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("course_id", sa.String(255), nullable=False),
        sa.Column("module_id", sa.String(255), nullable=True),
        sa.Column(
            "lattice",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("generated_by", sa.String(50), nullable=False),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint(
            "course_id",
            "module_id",
            "version",
            name="uq_mira_lattices_versioned",
        ),
    )
    op.create_index(
        "idx_mira_lattices_course", "mira_concept_lattices", ["course_id"]
    )

    # ---------------------------------------------------------------
    # 3. mira_rubrics
    # One rubric per (course_id, module_id, section_id, rubric_type).
    # JSONB holds the full structured rubric.
    # ---------------------------------------------------------------
    op.create_table(
        "mira_rubrics",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("course_id", sa.String(255), nullable=False),
        sa.Column("module_id", sa.String(255), nullable=False),
        sa.Column("section_id", sa.String(255), nullable=True),
        sa.Column("rubric_type", sa.String(30), nullable=False),
        sa.Column(
            "rubric_json",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column(
            "human_reviewed",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint(
            "course_id",
            "module_id",
            "section_id",
            "rubric_type",
            "version",
            name="uq_mira_rubrics_versioned",
        ),
    )
    op.create_index(
        "idx_mira_rubrics_lookup",
        "mira_rubrics",
        ["course_id", "module_id", "section_id"],
    )

    # ---------------------------------------------------------------
    # 4. mira_grading_events
    # Append-only grading log. One row per attempt.
    # Used for analytics and gate-status reconstruction.
    # ---------------------------------------------------------------
    op.create_table(
        "mira_grading_events",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("rubric_id", sa.Integer(), nullable=False),
        sa.Column("attempt_num", sa.Integer(), nullable=False),
        sa.Column("answer_text", sa.Text(), nullable=False),
        sa.Column(
            "scores",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column("passed", sa.Boolean(), nullable=False),
        sa.Column("feedback_text", sa.Text()),
        sa.Column("typing_metadata", postgresql.JSONB(astext_type=sa.Text())),
        sa.Column("tokens_in", sa.Integer(), nullable=False),
        sa.Column("tokens_out", sa.Integer(), nullable=False),
        sa.Column("model", sa.String(50), nullable=False),
        sa.Column("cost_inr", sa.Numeric(10, 4), nullable=False),
        sa.Column("latency_ms", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["rubric_id"], ["mira_rubrics.id"]),
    )
    op.create_index(
        "idx_mira_grading_user",
        "mira_grading_events",
        ["user_id", sa.text("created_at DESC")],
    )
    op.create_index(
        "idx_mira_grading_rubric", "mira_grading_events", ["rubric_id"]
    )

    # ---------------------------------------------------------------
    # 5. mira_gate_status
    # Current gate state per (user, course, module, phase).
    # Updated as grading events produce pass/fail outcomes.
    # ---------------------------------------------------------------
    op.create_table(
        "mira_gate_status",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("course_id", sa.String(255), nullable=False),
        sa.Column("module_id", sa.String(255), nullable=False),
        sa.Column("phase_id", sa.String(255), nullable=True),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("passed_at", sa.TIMESTAMP(timezone=True)),
        sa.Column("last_attempt_at", sa.TIMESTAMP(timezone=True)),
        sa.Column(
            "attempt_count",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint(
            "user_id",
            "course_id",
            "module_id",
            "phase_id",
            name="uq_mira_gate_status_scope",
        ),
    )
    op.create_index("idx_mira_gate_user", "mira_gate_status", ["user_id"])

    # ---------------------------------------------------------------
    # 6. mira_episodic
    # Append-only interaction log. Every chat message, feedback,
    # MCQ answer, grading attempt becomes a row here.
    # Hot path query: "recent interactions for this user".
    # ---------------------------------------------------------------
    op.create_table(
        "mira_episodic",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("course_id", sa.String(255), nullable=True),
        sa.Column("module_id", sa.String(255), nullable=True),
        sa.Column("section_id", sa.String(255), nullable=True),
        sa.Column("interaction_type", sa.String(30), nullable=False),
        sa.Column(
            "payload",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column("concept_ids", postgresql.ARRAY(sa.Text())),
        sa.Column("depth", sa.String(20)),
        sa.Column("style_used", sa.String(20)),
        sa.Column("model", sa.String(50)),
        sa.Column("tokens_in", sa.Integer()),
        sa.Column("tokens_out", sa.Integer()),
        sa.Column("cost_inr", sa.Numeric(10, 4)),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index(
        "idx_mira_episodic_user_time",
        "mira_episodic",
        ["user_id", sa.text("created_at DESC")],
    )
    op.create_index(
        "idx_mira_episodic_concepts",
        "mira_episodic",
        ["concept_ids"],
        postgresql_using="gin",
    )

    # ---------------------------------------------------------------
    # 7. mira_semantic_memory
    # Per-user long-term facts that survive episodic deletion.
    # Aggregated nightly from episodic by a background job.
    # ---------------------------------------------------------------
    op.create_table(
        "mira_semantic_memory",
        sa.Column("user_id", sa.Integer(), primary_key=True),
        sa.Column("career_stage", sa.String(50)),
        sa.Column("background", sa.Text()),
        sa.Column("goals", sa.Text()),
        sa.Column(
            "projects_in_progress",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column(
            "preferred_styles",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column(
            "total_concepts_mastered", sa.Integer(), server_default="0"
        ),
        sa.Column(
            "total_concepts_touched", sa.Integer(), server_default="0"
        ),
        sa.Column(
            "common_misconceptions",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column("last_aggregated_at", sa.TIMESTAMP(timezone=True)),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )

    # ---------------------------------------------------------------
    # 8. mira_review_queue
    # Spaced repetition scheduler. SM-2 algorithm.
    # Background job surfaces due items.
    # ---------------------------------------------------------------
    op.create_table(
        "mira_review_queue",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("concept_id", sa.String(255), nullable=False),
        sa.Column("course_id", sa.String(255), nullable=False),
        sa.Column("next_review_at", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column(
            "interval_days", sa.Integer(), nullable=False, server_default="1"
        ),
        sa.Column(
            "ease_factor",
            sa.Numeric(3, 2),
            nullable=False,
            server_default="2.5",
        ),
        sa.Column("last_result", sa.String(20)),
        sa.Column(
            "consecutive_passes",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint(
            "user_id", "concept_id", name="uq_mira_review_user_concept"
        ),
    )
    op.create_index(
        "idx_mira_review_due",
        "mira_review_queue",
        ["user_id", "next_review_at"],
    )

    # ---------------------------------------------------------------
    # 9. mira_appeal_queue
    # Provisional gate passes flagged for human review.
    # ---------------------------------------------------------------
    op.create_table(
        "mira_appeal_queue",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("grading_event_id", sa.BigInteger(), nullable=False),
        sa.Column("student_justification", sa.Text(), nullable=False),
        sa.Column(
            "status", sa.String(20), nullable=False, server_default="pending"
        ),
        sa.Column("reviewer_id", sa.Integer()),
        sa.Column("reviewer_notes", sa.Text()),
        sa.Column("reviewed_at", sa.TIMESTAMP(timezone=True)),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["grading_event_id"], ["mira_grading_events.id"]
        ),
        sa.ForeignKeyConstraint(["reviewer_id"], ["users.id"]),
    )
    op.create_index(
        "idx_mira_appeal_pending",
        "mira_appeal_queue",
        ["status"],
        postgresql_where=sa.text("status = 'pending'"),
    )


def downgrade() -> None:
    """Drop in reverse order of foreign key dependencies."""
    op.drop_table("mira_appeal_queue")
    op.drop_table("mira_review_queue")
    op.drop_table("mira_semantic_memory")
    op.drop_table("mira_episodic")
    op.drop_table("mira_gate_status")
    op.drop_table("mira_grading_events")
    op.drop_table("mira_rubrics")
    op.drop_table("mira_concept_lattices")
    op.drop_table("mira_user_profiles")
