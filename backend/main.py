"""
KEV Backend API
~~~~~~~~~~~~~~~

FastAPI backend for kev.
"""

import os
import sys

# Add the project root (constellation directory) to sys.path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Tuple
import uvicorn
import logging

# Import KEV Core Upgrades
from kev.backend.core.config import settings
from kev.backend.core.infrastructure_integration import kev_infra
from kev.backend.core.curriculum_engine import curriculum_engine, Subject
from kev.backend.virtual_school_service import (
    BookingRequest,
    get_overview,
    list_facilities,
    book_facility,
    release_facility,
)
from kev.backend.shared_resources_initializer import (
    initialize_shared_resources,
    get_shared_resources_status,
)
from kev.backend.agent_initialization import (
    initialize_kev_learning_system,
    tutor_registry,
)
from kev.backend.learning_service import learning_system
from kev.backend.services import bedrock_client
from kev.backend.services import agent_catalog
from kev.virtual_school.vr_ar.vr_school_environment import VRSchoolEnvironment, VRPlatform

try:
    from shared_resources.central_library.integration.kev.kev_integration import KEVLibraryIntegration
except Exception as _lib_exc:
    logging.getLogger(__name__).warning(f"Central Library integration unavailable: {_lib_exc}")
    KEVLibraryIntegration = None

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="KEV API",
    description="Educational system with Central Library and Curriculum Framework for 185+ subjects",
    version="2.0.0" # Upgraded version
)

# CORS middleware
# NOTE: allow_origins=["*"] + allow_credentials=True was invalid anyway
# (browsers reject wildcard-origin-with-credentials) - locked down to the
# real production/preview/dev origins instead.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://kev.sansmercantile.com",
        "http://localhost:3004",
        "http://localhost:5173",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Single in-process VR/AR environment instance. Session/user state here is
# genuinely in-memory (not stateless like the agent endpoints) - if this
# runs on multiple Fargate tasks, VR participants need sticky routing to the
# same task, or this needs to move to a shared store (e.g. Redis) later.
vr_environment = VRSchoolEnvironment()

# Central Library integration - the Constellation's shared educational
# content/knowledge layer. library_engine=None because KEVLibraryIntegration
# only ever calls its own in-memory cache, never library_engine directly.
library_integration = KEVLibraryIntegration(library_engine=None) if KEVLibraryIntegration else None

# --- Models ---
class SubjectRequest(BaseModel):
    name: str
    description: str
    dependencies: List[str] = []
    complexity: float = 1.0

class LearningPathRequest(BaseModel):
    student_id: str
    subject_id: str
    current_knowledge: Dict[str, Any]

class StudentRegistrationRequest(BaseModel):
    student_id: str
    name: str
    age: int
    education_level: str

class LearningSessionRequest(BaseModel):
    student_id: str
    subject: str
    topic: str
    difficulty: str = "intermediate"
    education_level: str

class LearningSessionCompleteRequest(BaseModel):
    session_id: str
    score: float
    feedback: str = ""

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class AgentAskRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []
    education_level: Optional[str] = None
    student_name: Optional[str] = None

class VRJoinRequest(BaseModel):
    username: str
    platform: str = "web_vr"
    avatar_id: str = ""

class VRMoveRequest(BaseModel):
    position: Tuple[float, float, float]
    rotation: Optional[Tuple[float, float, float]] = None

class VRSessionStartRequest(BaseModel):
    session_type: str
    participants: List[str]
    location: str
    metadata: Dict[str, Any] = {}

# --- Lifespan/Startup ---
@app.on_event("startup")
async def startup_event():
    logger.info("🚀 KEV System Startup Sequence Initiated")
    initialize_shared_resources()
    await kev_infra.initialize()
    initialize_kev_learning_system()
    vr_environment.initialize_school_objects()
    agent_catalog.build_index()
    if library_integration:
        await library_integration.initialize()

    # Seed initial subjects for robustness testing and learning progression
    curriculum_engine.add_subject(Subject(id="math_101", name="Basic Algebra", description="Foundations of Algebra"))
    curriculum_engine.add_subject(Subject(id="math_102", name="Calculus I", description="Limits and Derivatives", dependencies=["math_101"]))
    curriculum_engine.add_subject(Subject(id="science_101", name="Foundations of Science", description="Scientific method and systems thinking"))
    curriculum_engine.add_subject(Subject(id="science_102", name="Physics Principles", description="Mechanics, forces, and energy", dependencies=["science_101"]))
    curriculum_engine.add_subject(Subject(id="cs_101", name="Intro to Computer Science", description="Algorithms, logic, and computational thinking"))
    curriculum_engine.add_subject(Subject(id="cs_102", name="Programming Fundamentals", description="Core programming concepts and practice", dependencies=["cs_101"]))
    curriculum_engine.add_subject(Subject(id="english_101", name="English Composition", description="Writing, grammar, and critical reading"))
    curriculum_engine.add_subject(Subject(id="history_101", name="World History", description="Global cultures, timelines, and civic context"))
    curriculum_engine.add_subject(Subject(id="art_101", name="Creative Arts", description="Visual expression, design, and media literacy"))
    curriculum_engine.add_subject(Subject(id="business_101", name="Business Fundamentals", description="Entrepreneurship, finance, and strategy"))

    logger.info("✅ KEV Infrastructure, Curriculum Engine, and Learning System Ready")

# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "kev", "infra_ready": kev_infra.is_initialized}

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to KEV API v2.0",
        "version": "2.0.0",
        "docs": "/docs"
    }

# --- New Robust Endpoints ---

@app.post("/curriculum/subjects")
async def add_subject(req: SubjectRequest):
    """Adds a new subject to the scientific framework."""
    subject_id = req.name.lower().replace(" ", "_")
    new_subject = Subject(
        id=subject_id, 
        name=req.name, 
        description=req.description, 
        dependencies=req.dependencies, 
        complexity_score=req.complexity
    )
    curriculum_engine.add_subject(new_subject)
    return {"status": "success", "subject_id": subject_id}

@app.post("/curriculum/optimize-path")
async def optimize_path(req: LearningPathRequest):
    """
    Pulls from Shared Resources (Quantum) to optimize the learning path.
    """
    result = await kev_infra.optimize_learning_path(req.student_id, req.subject_id, req.current_knowledge)
    return {"status": "success", "optimized_path": result}

@app.get("/curriculum/subjects")
async def list_curriculum_subjects():
    """Return the current curriculum subject catalog."""
    subjects = [
        {
            "id": subject.id,
            "name": subject.name,
            "description": subject.description,
            "dependencies": subject.dependencies,
            "complexity_score": subject.complexity_score,
            "credits": subject.credits,
        }
        for subject in curriculum_engine.subjects.values()
    ]
    return {"status": "success", "subjects": subjects}

@app.get("/curriculum/recommendations/{student_completed}")
async def get_recommendations(student_completed: str):
    """
    Returns unlocked subjects based on a comma-separated list of completed IDs.
    """
    completed_set = set(student_completed.split(","))
    recommendations = curriculum_engine.get_recommended_next_subjects(completed_set)
    return {"status": "success", "recommended_subjects": recommendations}

@app.get("/system/status")
async def system_status():
    """System-wide status for KEV learning, agents, shared resources, and virtual school."""
    virtual_school_stats = get_overview()["statistics"]
    system_status = tutor_registry.get_system_status()
    return {
        "status": "success",
        "system": system_status,
        "shared_resources": get_shared_resources_status(),
        "virtual_school": virtual_school_stats,
    }

@app.get("/agents/available")
async def available_agents(subject: Optional[str] = None, education_level: Optional[str] = None):
    """Return agents available for a subject and education level."""
    agents = tutor_registry.get_available_agents(subject=subject, education_level=education_level)
    return {"status": "success", "agents": [agent.__dict__ for agent in agents]}

@app.post("/agents/{agent_id}/ask")
async def ask_agent(agent_id: str, req: AgentAskRequest):
    """
    Stateless per-request call to a KEV agent via Bedrock.

    The caller (frontend) owns conversation history and passes it in each
    time via `history` - nothing is stored server-side, so this works the
    same on any Fargate task behind the load balancer.
    """
    agent = tutor_registry.agents.get(agent_id)
    if agent is None:
        raise HTTPException(status_code=404, detail=f"Unknown agent_id '{agent_id}'")

    student_line = f" The student's name is {req.student_name}." if req.student_name else ""
    level = req.education_level or (agent.education_levels[0] if agent.education_levels else "general")

    system_prompt = (
        f"You are a KEV {agent.role.value} specializing in {agent.specialization} "
        f"within {agent.subject}. You are teaching at the {level} level."
        f"{student_line} Be encouraging, clear, and age-appropriate. "
        f"Keep answers focused and check for understanding."
    )

    messages = [{"role": m.role, "content": m.content} for m in req.history]
    messages.append({"role": "user", "content": req.message})

    model_id = (
        settings.BEDROCK_EXPERT_MODEL_ID
        if agent.role.name == "EXPERT"
        else settings.BEDROCK_DEFAULT_MODEL_ID
    )

    try:
        reply = bedrock_client.invoke_agent(
            system_prompt=system_prompt,
            messages=messages,
            model_id=model_id,
        )
    except Exception as exc:
        logger.error(f"Agent {agent_id} Bedrock call failed: {exc}")
        raise HTTPException(status_code=502, detail="Agent is temporarily unavailable")

    return {
        "status": "success",
        "agent_id": agent_id,
        "subject": agent.subject,
        "specialization": agent.specialization,
        "reply": reply,
    }

@app.post("/students/register")
async def register_student(req: StudentRegistrationRequest):
    """Register or update a student profile."""
    profile = learning_system.register_student(
        student_id=req.student_id,
        name=req.name,
        age=req.age,
        education_level=req.education_level,
    )
    return {"status": "success", "student": profile.__dict__}

@app.post("/learning/session/start")
async def start_learning_session(req: LearningSessionRequest):
    """Start a new learning session for a student."""
    session = learning_system.start_learning_session(
        student_id=req.student_id,
        subject=req.subject,
        topic=req.topic,
        difficulty=req.difficulty,
        education_level=req.education_level,
    )
    return {"status": "success", "session": session}

@app.post("/learning/session/complete")
async def complete_learning_session(req: LearningSessionCompleteRequest):
    """Complete an active learning session and store the result."""
    session = learning_system.complete_learning_session(
        session_id=req.session_id,
        score=req.score,
        feedback=req.feedback,
    )
    return {"status": "success", "session": session}

@app.get("/students/{student_id}/progress")
async def student_progress(student_id: str):
    """Get progress and recommendations for a student."""
    progress = learning_system.get_student_progress(student_id)
    return {"status": "success", "progress": progress}

@app.post("/virtual-school/initialize")
async def initialize_virtual_school():
    """Initialize the advanced virtual school environment."""
    overview = get_overview()
    return {"status": "success", "virtual_school": overview, "message": "Virtual school initialized"}

@app.get("/virtual-school/overview")
async def virtual_school_overview():
    """Returns virtual school building overview and statistics."""
    return {"status": "success", "virtual_school": get_overview()}

@app.get("/virtual-school/facilities")
async def virtual_school_facilities(available: Optional[bool] = False, type: Optional[str] = None):
    """Returns virtual school facility inventory."""
    facilities = list_facilities(only_available=available, facility_type=type)
    return {"status": "success", "facilities": facilities}

@app.post("/virtual-school/book/{facility_id}")
async def virtual_school_book(facility_id: str, req: BookingRequest):
    """Book a virtual school facility for a learning session."""
    return book_facility(facility_id, req.session_id)

@app.post("/virtual-school/release/{facility_id}")
async def virtual_school_release(facility_id: str):
    """Release a previously booked virtual school facility."""
    return release_facility(facility_id)

# --- VR/AR Environment ---

@app.post("/vr/join")
async def vr_join(req: VRJoinRequest):
    """Join the VR/AR school environment. Returns the new user + full scene."""
    try:
        platform = VRPlatform(req.platform)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Unknown platform '{req.platform}'")

    user = vr_environment.add_user(req.username, platform, avatar_id=req.avatar_id)
    return {"status": "success", "user": user.to_dict(), "scene": vr_environment.export_vr_scene()}

@app.post("/vr/users/{user_id}/leave")
async def vr_leave(user_id: str):
    """Leave the VR/AR environment."""
    success = vr_environment.remove_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Unknown VR user_id")
    return {"status": "success", "user_id": user_id}

@app.post("/vr/users/{user_id}/move")
async def vr_move(user_id: str, req: VRMoveRequest):
    """Move a user within the VR/AR environment (triggers proximity interactions)."""
    success = vr_environment.move_user(user_id, req.position, req.rotation)
    if not success:
        raise HTTPException(status_code=404, detail="Unknown VR user_id")
    return {"status": "success", "user": vr_environment.users[user_id].to_dict()}

@app.post("/vr/sessions")
async def vr_start_session(req: VRSessionStartRequest):
    """Start a VR class/meeting session."""
    session_id = vr_environment.start_session(req.session_type, req.participants, req.location, req.metadata)
    return {"status": "success", "session_id": session_id, "session": vr_environment.active_sessions[session_id]}

@app.post("/vr/sessions/{session_id}/end")
async def vr_end_session(session_id: str):
    """End a VR class/meeting session."""
    success = vr_environment.end_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Unknown or already-ended session_id")
    return {"status": "success", "session": vr_environment.session_history[session_id]}

@app.get("/vr/state")
async def vr_state():
    """Full current state of the VR/AR environment (users, objects, sessions)."""
    return {"status": "success", "state": vr_environment.get_environment_state()}

@app.get("/vr/scene")
async def vr_scene():
    """Exported VR scene for rendering (objects + active user positions)."""
    return {"status": "success", "scene": vr_environment.export_vr_scene()}

# --- Real multi_agents/ catalog (1000+ actual per-subject tutor agents) ---

@app.get("/multi-agents/catalog")
async def multi_agents_catalog(subject: Optional[str] = None, education_level: Optional[str] = None,
                                 tutor_type: Optional[str] = None):
    """Metadata-only listing of the real multi_agents/ tutor roster - no imports happen here."""
    entries = agent_catalog.list_agents(subject=subject, education_level=education_level, tutor_type=tutor_type)
    return {
        "status": "success",
        "count": len(entries),
        "agents": [
            {"tutor_id": e.tutor_id, "subject": e.subject, "specialization": e.specialization,
             "tutor_type": e.tutor_type, "education_levels": e.education_levels}
            for e in entries
        ],
    }

@app.post("/multi-agents/{tutor_id}/ask")
async def multi_agents_ask(tutor_id: str, req: AgentAskRequest):
    """
    Stateless per-request call to a REAL multi_agents/ tutor file. Lazily
    imports + instantiates only this one agent (agent_catalog.py), then
    routes the actual reply through Bedrock using the agent's real
    subject/specialization metadata - safe to run on any Fargate task.
    """
    entry = agent_catalog.get_entry(tutor_id)
    if entry is None:
        raise HTTPException(status_code=404, detail=f"Unknown tutor_id '{tutor_id}'")

    try:
        agent = agent_catalog.instantiate_agent(tutor_id)
    except Exception as exc:
        logger.error(f"Failed to load real agent {tutor_id} ({entry.module_path}): {exc}")
        raise HTTPException(status_code=502, detail="Agent module failed to load")

    student_line = f" The student's name is {req.student_name}." if req.student_name else ""
    level = req.education_level or (entry.education_levels[0] if entry.education_levels else "general")
    system_prompt = (
        f"You are a KEV {entry.tutor_type} specializing in {entry.specialization} "
        f"within {entry.subject}. You are teaching at the {level} level."
        f"{student_line} Be encouraging, clear, and age-appropriate."
    )

    messages = [{"role": m.role, "content": m.content} for m in req.history]
    messages.append({"role": "user", "content": req.message})
    model_id = settings.BEDROCK_EXPERT_MODEL_ID if entry.tutor_type.lower() == "expert" else settings.BEDROCK_DEFAULT_MODEL_ID

    try:
        reply = bedrock_client.invoke_agent(system_prompt=system_prompt, messages=messages, model_id=model_id)
    except Exception as exc:
        logger.error(f"Agent {tutor_id} Bedrock call failed: {exc}")
        raise HTTPException(status_code=502, detail="Agent is temporarily unavailable")

    return {
        "status": "success", "tutor_id": tutor_id, "subject": entry.subject,
        "specialization": entry.specialization, "class_name": type(agent).__name__, "reply": reply,
    }

# --- Central Library (Constellation shared knowledge layer) ---

@app.get("/library/search")
async def library_search(query: str, subject: Optional[str] = None, level: Optional[str] = None):
    """Search the Constellation's shared educational content library."""
    if not library_integration:
        raise HTTPException(status_code=503, detail="Central Library integration unavailable")
    return await library_integration.search_educational_content(query, subject=subject, level=level)

@app.get("/library/resources")
async def library_resources(subject: str, topic: str, level: str = "intermediate"):
    """Get tutoring resources (teaching strategies, assessment methods) for a subject/topic."""
    if not library_integration:
        raise HTTPException(status_code=503, detail="Central Library integration unavailable")
    return await library_integration.get_tutoring_resources(subject, topic, level=level)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

