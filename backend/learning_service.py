import logging
import uuid
from datetime import datetime
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Set

from kev.backend.agent_initialization import tutor_registry
from kev.backend.core.curriculum_engine import curriculum_engine
from kev.backend.services.game_pedagogy.remainder_curriculum import RemainderCurriculumService

logger = logging.getLogger(__name__)

@dataclass
class StudentProfile:
    student_id: str
    name: str
    age: int
    education_level: str
    strengths: List[str] = field(default_factory=list)
    weaknesses: List[str] = field(default_factory=list)
    learning_style: str = "visual"
    pace: str = "normal"
    registered_at: datetime = field(default_factory=datetime.now)

@dataclass
class LearningSession:
    session_id: str
    student_id: str
    subject: str
    topic: str
    difficulty: str
    education_level: str
    assigned_agent_id: str
    start_time: datetime = field(default_factory=datetime.now)
    end_time: Optional[datetime] = None
    score: Optional[float] = None
    feedback: Optional[str] = None
    completed: bool = False
    resources_used: List[str] = field(default_factory=list)

class LearningSystem:
    def __init__(self):
        self.student_profiles: Dict[str, StudentProfile] = {}
        self.learning_sessions: Dict[str, LearningSession] = {}
        self.completed_subjects: Dict[str, Set[str]] = {}
        self.game_pedagogy_service = RemainderCurriculumService()

    def register_student(self, student_id: str, name: str, age: int, education_level: str) -> StudentProfile:
        if student_id in self.student_profiles:
            profile = self.student_profiles[student_id]
            profile.name = name
            profile.age = age
            profile.education_level = education_level
            logger.info(f"Updated existing student profile: {student_id}")
            return profile
        profile = StudentProfile(
            student_id=student_id,
            name=name,
            age=age,
            education_level=education_level,
        )
        self.student_profiles[student_id] = profile
        self.completed_subjects.setdefault(student_id, set())
        logger.info(f"Registered student profile: {student_id}")
        return profile

    def assign_agent(self, subject: str, education_level: str) -> Optional[str]:
        available = tutor_registry.get_available_agents(subject=subject, education_level=education_level)
        if available:
            agent = available[0]
            agent.active_sessions += 1
            logger.info(f"Assigned agent {agent.agent_id} to subject {subject} for level {education_level}")
            return agent.agent_id

        # fallback to expert or mentor if no direct tutor available
        fallback = [a for a in tutor_registry.get_available_agents(subject=subject) if a.role.name in ("EXPERT", "MENTOR")]
        if fallback:
            agent = fallback[0]
            agent.active_sessions += 1
            logger.info(f"Fallback assigned agent {agent.agent_id} to subject {subject}")
            return agent.agent_id

        logger.warning(f"No available agents found for subject {subject}")
        return None

    def start_learning_session(
        self,
        student_id: str,
        subject: str,
        topic: str,
        difficulty: str,
        education_level: str,
    ) -> Dict[str, Any]:
        if student_id not in self.student_profiles:
            raise ValueError(f"Student {student_id} is not registered")

        if subject not in curriculum_engine.subjects:
            raise ValueError(f"Subject {subject} is not recognized")

        agent_id = self.assign_agent(subject, education_level)
        if not agent_id:
            raise RuntimeError("No tutor agents are currently available for this subject")

        session_id = f"session_{uuid.uuid4().hex[:10]}"
        session = LearningSession(
            session_id=session_id,
            student_id=student_id,
            subject=subject,
            topic=topic,
            difficulty=difficulty,
            education_level=education_level,
            assigned_agent_id=agent_id,
            resources_used=[f"{subject}-module", "adaptive_quiz", "virtual_lab"],
        )
        self.learning_sessions[session_id] = session
        logger.info(f"Started learning session {session_id} for student {student_id}")
        return self._session_to_dict(session)

    def complete_learning_session(self, session_id: str, score: float, feedback: str) -> Dict[str, Any]:
        if session_id not in self.learning_sessions:
            raise ValueError(f"Session {session_id} does not exist")

        session = self.learning_sessions[session_id]
        if session.completed:
            raise ValueError(f"Session {session_id} has already been completed")

        session.completed = True
        session.end_time = datetime.now()
        session.score = score
        session.feedback = feedback

        student_id = session.student_id
        self.completed_subjects.setdefault(student_id, set()).add(session.subject)

        # Release assigned agent capacity
        agent = tutor_registry.agents.get(session.assigned_agent_id)
        if agent is not None and agent.active_sessions > 0:
            agent.active_sessions -= 1

        logger.info(f"Completed learning session {session_id} for student {student_id}")
        return self._session_to_dict(session)

    def get_student_progress(self, student_id: str) -> Dict[str, Any]:
        profile = self.student_profiles.get(student_id)
        if not profile:
            raise ValueError(f"Student {student_id} not found")

        completed = self.completed_subjects.get(student_id, set())
        active_sessions = [s for s in self.learning_sessions.values() if s.student_id == student_id and not s.completed]
        recommended_ids = curriculum_engine.get_recommended_next_subjects(completed)

        return {
            "profile": profile.__dict__,
            "completed_subjects": list(completed),
            "active_sessions": [self._session_to_dict(session) for session in active_sessions],
            "recommended_surveys": [self._subject_to_dict(curriculum_engine.subjects[sid]) for sid in recommended_ids],
        }

    def _subject_to_dict(self, subject: Any) -> Dict[str, Any]:
        return {
            "id": subject.id,
            "name": subject.name,
            "description": subject.description,
            "dependencies": subject.dependencies,
            "complexity_score": subject.complexity_score,
            "credits": subject.credits,
        }

    def _session_to_dict(self, session: LearningSession) -> Dict[str, Any]:
        return {
            "session_id": session.session_id,
            "student_id": session.student_id,
            "subject": session.subject,
            "topic": session.topic,
            "difficulty": session.difficulty,
            "education_level": session.education_level,
            "assigned_agent_id": session.assigned_agent_id,
            "start_time": session.start_time.isoformat(),
            "end_time": session.end_time.isoformat() if session.end_time else None,
            "score": session.score,
            "feedback": session.feedback,
            "completed": session.completed,
            "resources_used": session.resources_used,
        }

    def get_available_subjects(self) -> List[Dict[str, Any]]:
        return [self._subject_to_dict(subject) for subject in curriculum_engine.subjects.values()]

learning_system = LearningSystem()
