"""
KEV Curriculum Engine
Implements the logical and scientific framework for the 185+ subjects.
Uses a Directed Acyclic Graph (DAG) for dependency management.
"""

import logging
from typing import Dict, List, Optional, Set, Any
from dataclasses import dataclass, field
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)

@dataclass
class Subject:
    id: str
    name: str
    description: str
    dependencies: List[str] = field(default_factory=list)
    complexity_score: float = 1.0  # 1.0 to 10.0
    credits: int = 1
    metadata: Dict[str, Any] = field(default_factory=dict)

class CurriculumEngine:
    """
    The core logic for KEV's educational framework.
    Ensures pedagogical soundness through dependency validation.
    """
    def __init__(self):
        self.subjects: Dict[str, Subject] = {}
        self.knowledge_graph: Dict[str, Set[str]] = {} # subject_id -> set of subjects that depend on it
        logger.info("KEV Curriculum Engine initialized")

    def add_subject(self, subject: Subject):
        """Adds a subject and updates the knowledge graph."""
        self.subjects[subject.id] = subject
        if subject.id not in self.knowledge_graph:
            self.knowledge_graph[subject.id] = set()
        
        for dep in subject.dependencies:
            if dep not in self.knowledge_graph:
                self.knowledge_graph[dep] = set()
            self.knowledge_graph[dep].add(subject.id)
        
        logger.info(f"Subject {subject.name} added to curriculum.")

    def validate_learning_path(self, path: List[str]) -> bool:
        """
        Scientifically validates if a learning path is sound.
        Checks if all dependencies are met before a subject is encountered.
        """
        met_dependencies: Set[str] = set()
        for subject_id in path:
            if subject_id not in self.subjects:
                logger.error(f"Subject {subject_id} not found in registry.")
                return False
            
            subject = self.subjects[subject_id]
            for dep in subject.dependencies:
                if dep not in met_dependencies:
                    logger.warning(f"Dependency violation: {subject.name} requires {self.subjects[dep].name}")
                    return False
            
            met_dependencies.add(subject_id)
        
        return True

    def get_recommended_next_subjects(self, completed_subjects: Set[str]) -> List[str]:
        """
        Identifies subjects that are now 'unlocked' based on completed dependencies.
        """
        unlocked = []
        for subject_id, subject in self.subjects.items():
            if subject_id in completed_subjects:
                continue
            
            # Check if all dependencies are met
            if all(dep in completed_subjects for dep in subject.dependencies):
                unlocked.append(subject_id)
        
        return unlocked

# Global instance
curriculum_engine = CurriculumEngine()
