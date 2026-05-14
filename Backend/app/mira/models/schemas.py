"""MIRA Pydantic schemas.

Two categories:
1. Internal domain types — cognitive state, beliefs, bandit, etc.
   These get serialized into Postgres JSONB columns.

2. API request/response models — for FastAPI endpoints.

Everything is Pydantic v2 (matches your existing FastAPI stack).
"""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


# =========================================================================
# ENUMS
# =========================================================================

class Tier(str, Enum):
    FREE = "free"
    SPARK = "spark"
    STARTER = "starter"
    PLUS = "plus"
    PRO = "pro"
    ELITE = "elite"


class ChatMode(str, Enum):
    PAPER = "paper"
    TUTOR = "tutor"
    DSA = "dsa"


class QuestionDepth(str, Enum):
    SURFACE = "surface"
    STRUCTURAL = "structural"
    RELATIONAL = "relational"
    EVALUATIVE = "evaluative"
    CREATIVE = "creative"


class Granularity(str, Enum):
    ELI5 = "eli5"
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class ExplainStyle(str, Enum):
    ANALOGY = "analogy"
    VISUAL = "visual"
    MATHEMATICAL = "mathematical"
    CODE = "code"
    STORYTELLING = "storytelling"
    SOCRATIC = "socratic"


class MasteryLevel(str, Enum):
    STRUGGLING = "struggling"
    LEARNING = "learning"
    MASTERED = "mastered"


class InteractionType(str, Enum):
    CHAT = "chat"
    FEEDBACK = "feedback"
    MCQ = "mcq"
    GRADE = "grade"
    ONBOARD = "onboard"
    REVIEW = "review"


class GateStatus(str, Enum):
    LOCKED = "locked"
    IN_PROGRESS = "in_progress"
    PASSED = "passed"
    PROVISIONAL = "provisional"
    APPEALED = "appealed"


class RubricType(str, Enum):
    RETRIEVAL = "retrieval"
    SYNTHESIS = "synthesis"
    VIVA = "viva"


# =========================================================================
# INTERNAL DOMAIN TYPES
# (These get stored in JSONB columns)
# =========================================================================

class Concept(BaseModel):
    """One concept in a concept lattice."""
    id: str
    name: str
    description: str
    prerequisites: list[str] = Field(default_factory=list)
    difficulty: float = Field(default=0.5, ge=0.0, le=1.0)
    keywords: list[str] = Field(default_factory=list)
    has_diagram: bool = False
    has_code: bool = False


class ConceptLattice(BaseModel):
    """DAG of concepts for a course/module."""
    concepts: dict[str, Concept] = Field(default_factory=dict)
    root_concepts: list[str] = Field(default_factory=list)


class StyleMemory(BaseModel):
    """Per-concept memory of which styles worked for explaining it."""
    worked: list[str] = Field(default_factory=list)
    failed: list[str] = Field(default_factory=list)
    attempts: int = 0


class ConceptBelief(BaseModel):
    """User's knowledge state for one concept. Stored inside beliefs JSONB."""
    concept_id: str
    p_known: float = Field(default=0.2, ge=0.0, le=1.0)
    interactions: int = 0
    understood_count: int = 0
    not_understood_count: int = 0
    mcq_correct: int = 0
    mcq_wrong: int = 0
    mastery: MasteryLevel = MasteryLevel.LEARNING
    misconceptions: list[str] = Field(default_factory=list)
    style_memory: StyleMemory = Field(default_factory=StyleMemory)
    depth_history: list[QuestionDepth] = Field(default_factory=list)
    last_updated: datetime = Field(default_factory=datetime.utcnow)


class StyleArm(BaseModel):
    """One arm of the Thompson sampling bandit."""
    name: str
    alpha: float = 1.0  # prior successes + 1
    beta_param: float = 1.0  # prior failures + 1
    total_tries: int = 0
    total_success: int = 0


class StyleBanditState(BaseModel):
    """User's Thompson sampling state across all 6 style arms."""
    arms: dict[str, StyleArm] = Field(default_factory=dict)
    blend_threshold: float = 0.15

    def ensure_arms(self) -> None:
        """Populate all 6 arms if missing. Called on profile load."""
        for style in ExplainStyle:
            if style.value not in self.arms:
                self.arms[style.value] = StyleArm(name=style.value)


class PersonalPromptData(BaseModel):
    """Growing persona observations — injected into every LLM call."""
    observations: list[str] = Field(default_factory=list)
    max_observations: int = 30

    def add(self, obs: str) -> None:
        if obs in self.observations:
            return
        self.observations.append(obs)
        if len(self.observations) > self.max_observations:
            # Keep the most recent max_observations
            self.observations = self.observations[-self.max_observations:]

    def build(self) -> str:
        if not self.observations:
            return "New user — no learning history yet."
        return "USER LEARNING PROFILE:\n" + "\n".join(
            f"- {o}" for o in self.observations
        )


# =========================================================================
# RUBRIC SCHEMA
# =========================================================================

class RubricCriterion(BaseModel):
    """One grading criterion within a rubric."""
    id: str  # e.g. "C1"
    name: str
    weight: float = Field(ge=0.0, le=100.0)  # percentage of total score
    description: str
    required_concepts: list[str] = Field(default_factory=list)
    rubric: dict[str, str] = Field(
        default_factory=dict
    )  # keys: excellent/adequate/weak


class Rubric(BaseModel):
    """Full rubric definition. Stored in mira_rubrics.rubric_json."""
    rubric_type: RubricType
    module_id: str | None = None
    section_id: str | None = None
    passing_criteria: dict[str, Any] = Field(default_factory=dict)
    # {"min_total_score": 70, "all_required": ["C1", "C2"]}
    criteria: list[RubricCriterion]
    forbidden_shortcuts: list[str] = Field(default_factory=list)


# =========================================================================
# MCQ SCHEMA
# =========================================================================

class MCQOption(BaseModel):
    text: str
    is_correct: bool = False
    misconception: str | None = None


class MCQ(BaseModel):
    id: str
    question: str
    options: list[MCQOption]
    concept_id: str
    difficulty: str = "medium"  # easy | medium | hard


# =========================================================================
# API REQUEST / RESPONSE
# =========================================================================

class ContextInitRequest(BaseModel):
    """Widget mount: lock to a page."""
    user_id: int
    course_id: str
    module_id: str | None = None
    section_id: str | None = None
    page_url: str | None = None


class ContextInitResponse(BaseModel):
    session_id: str
    tier: Tier
    quota_remaining: int
    quota_period_resets_at: datetime
    concepts_in_scope: list[str]
    onboarding_required: bool


class ChatRequest(BaseModel):
    user_id: int
    session_id: str | None = None
    mode: ChatMode = ChatMode.TUTOR
    course_id: str
    module_id: str | None = None
    section_id: str | None = None
    message: str = Field(min_length=1, max_length=4000)
    image_url: str | None = None  # for Pro/Elite/Spark with vision


class ChatResponse(BaseModel):
    session_id: str
    response: str
    questions_remaining: int
    detected_depth: QuestionDepth
    detected_understanding: float = Field(ge=0.0, le=1.0)
    granularity_used: Granularity
    style_used: ExplainStyle
    blend_style: ExplainStyle | None = None
    matched_concepts: list[str]
    is_rate_limited: bool = False
    upgrade_prompt: str | None = None
    trigger_diagram: bool = False
    is_frustrated: bool = False
    mcqs: list[MCQ] = Field(default_factory=list)


class FeedbackRequest(BaseModel):
    user_id: int
    course_id: str
    mode: ChatMode
    concept_id: str
    style_used: ExplainStyle
    understood: bool


class FeedbackResponse(BaseModel):
    updated_p_known: float
    mastery: MasteryLevel
    next_style_suggestion: ExplainStyle
    message: str


class MCQSubmitRequest(BaseModel):
    user_id: int
    mcq_id: str
    concept_id: str
    selected_index: int


class MCQSubmitResponse(BaseModel):
    correct: bool
    correct_index: int
    misconception: str | None = None
    updated_p_known: float
    mastery: MasteryLevel
    explanation: str


class ProfileResponse(BaseModel):
    """User's cognitive profile for dashboard view."""
    overall_understanding: float
    concept_breakdown: dict[str, float]  # concept_id -> p_known
    dominant_granularity: Granularity
    weak_concepts: list[str]
    strong_concepts: list[str]
    struggling_concepts: list[str] = Field(default_factory=list)
    preferred_style: ExplainStyle | None = None
    frustration_level: int = 0
    bandit_stats: dict[str, dict[str, Any]] = Field(default_factory=dict)
    personal_prompt_preview: str = ""


class QuotaResponse(BaseModel):
    tier: Tier
    questions_used_this_period: int
    questions_remaining: int
    quota_period_resets_at: datetime


# --- Grading ---

class SectionCheckRequest(BaseModel):
    user_id: int
    course_id: str
    module_id: str
    section_id: str
    answer_core_idea: str
    answer_novel_application: str
    answer_contrast: str
    typing_metadata: dict[str, Any] | None = None


class SectionCheckResponse(BaseModel):
    passed: bool
    per_criterion: dict[str, dict[str, Any]]  # criterion_id -> score + feedback
    overall_feedback: str
    attempt_num: int
    remaining_attempts: int
    can_proceed: bool  # soft gate: true even on fail


class SynthesisRequest(BaseModel):
    user_id: int
    course_id: str
    module_id: str
    synthesis_text: str = Field(min_length=150, max_length=3000)
    typing_metadata: dict[str, Any] | None = None


class SynthesisResponse(BaseModel):
    passed: bool
    per_criterion: dict[str, dict[str, Any]]
    overall_feedback: str
    attempt_num: int
    remaining_attempts: int
    can_proceed: bool  # hard gate: false until pass OR provisional
    is_provisional: bool = False
    can_appeal: bool = False


class VivaStartRequest(BaseModel):
    user_id: int
    course_id: str
    module_id: str
    phase_id: str


class VivaStartResponse(BaseModel):
    viva_session_id: str
    question_num: int
    total_questions_estimated: int
    question: str


class VivaAnswerRequest(BaseModel):
    user_id: int
    viva_session_id: str
    answer: str


class VivaAnswerResponse(BaseModel):
    question_num: int
    next_question: str | None = None  # None when viva complete
    completed: bool = False
    passed: bool | None = None  # only set when completed
    overall_feedback: str | None = None


class AppealRequest(BaseModel):
    user_id: int
    grading_event_id: int
    justification: str = Field(min_length=50, max_length=2000)


class AppealResponse(BaseModel):
    appeal_id: int
    status: str  # "pending"
    estimated_review_time: str


class GateStatusItem(BaseModel):
    course_id: str
    module_id: str
    phase_id: str | None = None
    status: GateStatus
    passed_at: datetime | None = None
    attempt_count: int


class GateStatusResponse(BaseModel):
    gates: list[GateStatusItem]


# --- Memory ---

class EpisodicItem(BaseModel):
    id: int
    interaction_type: InteractionType
    course_id: str | None = None
    module_id: str | None = None
    section_id: str | None = None
    summary: str  # not the full payload — just enough for UI
    concept_ids: list[str] | None = None
    created_at: datetime


class EpisodicResponse(BaseModel):
    items: list[EpisodicItem]
    total: int
    page: int
    has_more: bool


class SemanticMemoryResponse(BaseModel):
    career_stage: str | None = None
    background: str | None = None
    goals: str | None = None
    projects_in_progress: list[Any] = Field(default_factory=list)
    preferred_styles: list[Any] = Field(default_factory=list)
    total_concepts_mastered: int = 0
    total_concepts_touched: int = 0
    common_misconceptions: list[Any] = Field(default_factory=list)
    last_aggregated_at: datetime | None = None


class SemanticMemoryUpdate(BaseModel):
    """User-editable fields only (not auto-aggregated ones)."""
    background: str | None = None
    goals: str | None = None
    projects_in_progress: list[Any] | None = None


# --- Spaced repetition ---

class ReviewItem(BaseModel):
    concept_id: str
    course_id: str
    prompt: str
    interval_days: int
    last_result: str | None = None


class ReviewDueResponse(BaseModel):
    items: list[ReviewItem]


class ReviewAnswerRequest(BaseModel):
    user_id: int
    concept_id: str
    answer: str


class ReviewAnswerResponse(BaseModel):
    correct: bool
    feedback: str
    next_review_at: datetime
    interval_days: int


# --- Onboarding ---

class OnboardingStartRequest(BaseModel):
    user_id: int


class OnboardingStartResponse(BaseModel):
    session_id: str
    first_question: str
    options: list[str]
    estimated_questions: int


class OnboardingAnswerRequest(BaseModel):
    user_id: int
    session_id: str
    question_id: str
    answer: str


class OnboardingAnswerResponse(BaseModel):
    question_num: int
    next_question: str | None = None
    next_options: list[str] | None = None
    complete: bool = False
    report: dict[str, Any] | None = None  # career_stage, roadmap, etc


# --- Config bundle returned from various endpoints ---

class TierConfig(BaseModel):
    """Runtime config per tier. Exposed to frontend for UI decisions."""
    tier: Tier
    quota_per_period: int
    period_type: str  # "day" | "month"
    model_quality: str  # "haiku" | "sonnet"
    vision_enabled: bool
    priority_queue: bool


__all__ = [
    # Enums
    "Tier", "ChatMode", "QuestionDepth", "Granularity", "ExplainStyle",
    "MasteryLevel", "InteractionType", "GateStatus", "RubricType",
    # Domain types
    "Concept", "ConceptLattice", "StyleMemory", "ConceptBelief",
    "StyleArm", "StyleBanditState", "PersonalPromptData",
    "RubricCriterion", "Rubric", "MCQOption", "MCQ",
    # Requests
    "ContextInitRequest", "ChatRequest", "FeedbackRequest",
    "MCQSubmitRequest", "SectionCheckRequest", "SynthesisRequest",
    "VivaStartRequest", "VivaAnswerRequest", "AppealRequest",
    "SemanticMemoryUpdate", "ReviewAnswerRequest",
    "OnboardingStartRequest", "OnboardingAnswerRequest",
    # Responses
    "ContextInitResponse", "ChatResponse", "FeedbackResponse",
    "MCQSubmitResponse", "ProfileResponse", "QuotaResponse",
    "SectionCheckResponse", "SynthesisResponse",
    "VivaStartResponse", "VivaAnswerResponse", "AppealResponse",
    "GateStatusItem", "GateStatusResponse",
    "EpisodicItem", "EpisodicResponse", "SemanticMemoryResponse",
    "ReviewItem", "ReviewDueResponse", "ReviewAnswerResponse",
    "OnboardingStartResponse", "OnboardingAnswerResponse",
    "TierConfig",
]
