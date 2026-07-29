"""
KEV Learning System Agent Initialization
Initializes all subject-specific tutors and learning agents
"""

import asyncio
import logging
from typing import Dict, List
from enum import Enum
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

class AgentRole(Enum):
    TUTOR = "tutor"
    TEACHER = "teacher"
    MENTOR = "mentor"
    EXPERT = "expert"
    INVIGILATOR = "invigilator"

@dataclass
class TutorAgent:
    agent_id: str
    subject: str
    specialization: str
    role: AgentRole
    education_levels: List[str] = field(default_factory=list)
    expertise_areas: List[str] = field(default_factory=list)
    available: bool = True
    active_sessions: int = 0
    max_capacity: int = 50

@dataclass
class LearningSystemConfig:
    """Configuration for the KEV learning system"""
    total_agents: int = 230
    subjects_covered: int = 185
    education_levels: List[str] = field(default_factory=lambda: [
        "elementary", "middle_school", "high_school", "university", "graduate", "professional"
    ])
    support_languages: List[str] = field(default_factory=lambda: [
        "english", "spanish", "mandarin", "french", "german", "arabic", "hindi"
    ])

class TutorAgentRegistry:
    """Central registry of all tutor agents in KEV"""
    
    def __init__(self):
        self.agents: Dict[str, TutorAgent] = {}
        self.subject_index: Dict[str, List[str]] = {}
        self.role_index: Dict[AgentRole, List[str]] = {role: [] for role in AgentRole}
        self.config = LearningSystemConfig()
        
    def register_agent(self, agent: TutorAgent) -> bool:
        """Register a tutor agent in the system"""
        if agent.agent_id in self.agents:
            logger.warning(f"Agent {agent.agent_id} already registered")
            return False
        
        self.agents[agent.agent_id] = agent
        
        # Index by subject
        if agent.subject not in self.subject_index:
            self.subject_index[agent.subject] = []
        self.subject_index[agent.subject].append(agent.agent_id)
        
        # Index by role
        self.role_index[agent.role].append(agent.agent_id)
        
        logger.info(f"Registered {agent.role.value} agent {agent.agent_id} for {agent.subject}")
        return True
    
    def get_agents_by_subject(self, subject: str) -> List[TutorAgent]:
        """Get all agents for a subject"""
        agent_ids = self.subject_index.get(subject, [])
        return [self.agents[aid] for aid in agent_ids]
    
    def get_agents_by_role(self, role: AgentRole) -> List[TutorAgent]:
        """Get all agents with a specific role"""
        agent_ids = self.role_index[role]
        return [self.agents[aid] for aid in agent_ids]
    
    def get_available_tutors(self, subject: str, education_level: str) -> List[TutorAgent]:
        """Get available tutors for a subject and education level"""
        candidates = self.get_agents_by_subject(subject)
        available = [
            agent for agent in candidates
            if agent.available 
            and agent.active_sessions < agent.max_capacity
            and education_level in agent.education_levels
        ]
        return sorted(available, key=lambda a: a.active_sessions)  # Load balance
    
    def get_available_agents(self, subject: str = None, education_level: str = None) -> List[TutorAgent]:
        """Get available agents optionally filtered by subject and education level"""
        agents = list(self.agents.values())
        if subject is not None:
            agents = [agent for agent in agents if agent.subject == subject]
        if education_level is not None:
            agents = [agent for agent in agents if education_level in agent.education_levels]
        return [
            agent for agent in agents
            if agent.available and agent.active_sessions < agent.max_capacity
        ]

    def update_agent_capacity(self, agent_id: str, active_sessions: int):
        """Update the number of active sessions for an agent"""
        if agent_id in self.agents:
            self.agents[agent_id].active_sessions = active_sessions
    
    def get_system_status(self) -> Dict:
        """Get overall system status"""
        total_agents = len(self.agents)
        available_agents = sum(1 for a in self.agents.values() if a.available)
        total_sessions = sum(a.active_sessions for a in self.agents.values())
        total_capacity = sum(a.max_capacity for a in self.agents.values())
        
        return {
            "total_agents": total_agents,
            "available_agents": available_agents,
            "active_sessions": total_sessions,
            "system_capacity": total_capacity,
            "occupancy_rate": (total_sessions / total_capacity * 100) if total_capacity > 0 else 0,
            "subjects_covered": len(self.subject_index),
            "agent_roles": {role.value: len(ids) for role, ids in self.role_index.items()}
        }


# Global registry instance
tutor_registry = TutorAgentRegistry()

# Subject areas and their specializations
SUBJECT_SPECIALIZATIONS = {
    "Mathematics": [
        "Algebra", "Calculus", "Geometry", "Statistics", "Linear Algebra", "Discrete Math"
    ],
    "Science": [
        "Physics", "Chemistry", "Biology", "Earth Science", "Astronomy"
    ],
    "Language Arts": [
        "Reading Comprehension", "Writing", "Grammar", "Literature", "Poetry"
    ],
    "Social Studies": [
        "History", "Geography", "Civics", "Economics", "Anthropology"
    ],
    "Computer Science": [
        "Programming", "Web Development", "Data Science", "AI/ML", "Cybersecurity"
    ],
    "Arts": [
        "Visual Arts", "Digital Art", "Animation", "Design"
    ],
    "Music": [
        "Music Theory", "Composition", "Instrument Performance", "Music History"
    ],
    "Physical Education": [
        "Sports", "Fitness", "Health", "Nutrition"
    ],
    "Business": [
        "Entrepreneurship", "Management", "Marketing", "Finance", "Accounting"
    ],
    "Languages": [
        "Spanish", "French", "German", "Mandarin", "Arabic", "Japanese"
    ],
}

def initialize_kev_learning_system() -> Dict:
    """Initialize all KEV learning system agents"""
    logger.info("🚀 Initializing KEV Learning System...")
    
    agent_count = 0
    
    # Create tutors for each subject and specialization
    for subject, specializations in SUBJECT_SPECIALIZATIONS.items():
        for specialization in specializations:
            # Create tutor agent
            tutor_agent = TutorAgent(
                agent_id=f"tutor_{subject.lower().replace(' ', '_')}_{specialization.lower().replace(' ', '_')}",
                subject=subject,
                specialization=specialization,
                role=AgentRole.TUTOR,
                education_levels=["elementary", "middle_school", "high_school", "university"],
                expertise_areas=[specialization],
            )
            tutor_registry.register_agent(tutor_agent)
            agent_count += 1
            
            # Create expert agent for advanced topics
            expert_agent = TutorAgent(
                agent_id=f"expert_{subject.lower().replace(' ', '_')}_{specialization.lower().replace(' ', '_')}",
                subject=subject,
                specialization=f"Advanced {specialization}",
                role=AgentRole.EXPERT,
                education_levels=["university", "graduate", "professional"],
                expertise_areas=[f"Advanced {specialization}"],
            )
            tutor_registry.register_agent(expert_agent)
            agent_count += 1
            
            # Create teacher agent
            teacher_agent = TutorAgent(
                agent_id=f"teacher_{subject.lower().replace(' ', '_')}_{specialization.lower().replace(' ', '_')}",
                subject=subject,
                specialization=f"Teaching {specialization}",
                role=AgentRole.TEACHER,
                education_levels=["elementary", "middle_school", "high_school"],
                expertise_areas=[f"Pedagogy of {specialization}"],
            )
            tutor_registry.register_agent(teacher_agent)
            agent_count += 1
    
    # Add mentor agents for career guidance
    mentor_specializations = [
        "Career Planning", "Professional Development", "Mentorship",
        "Leadership", "Communication Skills", "Work-Life Balance"
    ]
    
    for specialization in mentor_specializations:
        mentor_agent = TutorAgent(
            agent_id=f"mentor_{specialization.lower().replace(' ', '_')}",
            subject="Professional Development",
            specialization=specialization,
            role=AgentRole.MENTOR,
            education_levels=["professional", "graduate"],
            expertise_areas=[specialization],
        )
        tutor_registry.register_agent(mentor_agent)
        agent_count += 1
    
    # Add invigilators for assessments
    assessment_types = [
        "Formative Assessment", "Summative Assessment", "Diagnostic Testing",
        "Performance Evaluation", "Proctored Exams"
    ]
    
    for assessment_type in assessment_types:
        invigilator_agent = TutorAgent(
            agent_id=f"invigilator_{assessment_type.lower().replace(' ', '_')}",
            subject="Assessment & Evaluation",
            specialization=assessment_type,
            role=AgentRole.INVIGILATOR,
            education_levels=["elementary", "middle_school", "high_school", "university", "professional"],
            expertise_areas=[assessment_type],
        )
        tutor_registry.register_agent(invigilator_agent)
        agent_count += 1
    
    status = tutor_registry.get_system_status()
    logger.info(f"✅ KEV Learning System Initialized: {agent_count} agents ready")
    logger.info(f"📊 System Status: {status}")
    
    return {
        "status": "initialized",
        "agents_created": agent_count,
        "system_status": status,
        "ready": True
    }

# Initialize on module load
_init_result = None

def get_tutor_registry() -> TutorAgentRegistry:
    """Get the global tutor registry"""
    return tutor_registry
