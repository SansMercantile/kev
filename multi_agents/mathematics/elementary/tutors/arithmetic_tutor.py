"""
Arithmetic Tutor for Elementary Level
SansMercantile™ AI Development Team
"""

from ..base_tutor_agent import BaseTutorAgent, EducationLevel, DifficultyLevel, StudentProfile
from typing import Dict, Any, List

class ElementaryArithmeticTutor(BaseTutorAgent):
    """Elementary level arithmetic tutor"""
    
    def __init__(self):
        super().__init__(
            tutor_id="elem_arithmetic_001",
            subject="Mathematics",
            specialization="Elementary Arithmetic",
            tutor_type="teacher",
            education_levels=[EducationLevel.ELEMENTARY]
        )
    
    def _get_topic_list(self) -> List[str]:
        return [
            "Addition (1-10)",
            "Subtraction (1-10)",
            "Multiplication tables (1-5)",
            "Division basics",
            "Place value (ones, tens)",
            "Number patterns",
            "Word problems",
            "Fractions introduction",
            "Measurement basics",
            "Time and money"
        ]
    
    async def teach_topic(self, 
                         student_profile: StudentProfile,
                         topic: str,
                         difficulty: DifficultyLevel) -> Dict[str, Any]:
        """Teach arithmetic concepts to elementary students"""
        
        # Age-appropriate content
        if student_profile.age < 6:
            base_difficulty = "very_easy"
            max_digits = 5
        elif student_profile.age < 9:
            base_difficulty = "easy"
            max_digits = 10
        else:
            base_difficulty = "medium"
            max_digits = 100
            
        # Generate problems based on topic
        problems = self._generate_problems(topic, base_difficulty, max_digits)
        
        # Create interactive lesson
        lesson_plan = {
            "topic": topic,
            "difficulty": base_difficulty,
            "problems": problems,
            "visual_aids": self._get_visual_aids(topic),
            "games": self._get_educational_games(topic),
            "assessment": self._create_assessment(topic, base_difficulty)
        }
        
        return {
            "lesson_plan": lesson_plan,
            "estimated_time": "30-45 minutes",
            "materials_needed": ["pencil", "paper", "counting blocks"],
            "prerequisites": self._get_prerequisites(topic)
        }
    
    async def assess_knowledge(self, 
                             student_profile: StudentProfile,
                             topic: str) -> Dict[str, Any]:
        """Assess arithmetic knowledge"""
        
        # Quick assessment problems
        assessment_problems = self._generate_assessment_problems(topic)
        
        # Scoring rubric
        rubric = {
            "excellent": {"score_range": [90, 100], "description": "Mastery achieved"},
            "good": {"score_range": [70, 89], "description": "Proficient understanding"},
            "needs_improvement": {"score_range": [50, 69], "description": "Basic understanding"},
            "requires_support": {"score_range": [0, 49], "description": "Needs additional help"}
        }
        
        return {
            "assessment_problems": assessment_problems,
            "scoring_rubric": rubric,
            "time_limit": "20 minutes",
            "instructions": "Show your work and explain your thinking"
        }
    
    def _generate_problems(self, topic: str, difficulty: str, max_digits: int) -> List[Dict[str, Any]]:
        """Generate age-appropriate arithmetic problems"""
        problems = []
        
        if topic == "Addition (1-10)":
            for i in range(1, 6):
                a = i * 2
                b = i + 3
                problems.append({
                    "problem": f"{a} + {b} = ?",
                    "answer": a + b,
                    "explanation": f"Count up from {a} by {b}"
                })
                
        elif topic == "Subtraction (1-10)":
            for i in range(1, 6):
                a = 10 - i
                b = i + 2
                problems.append({
                    "problem": f"{a} - {b} = ?",
                    "answer": a - b,
                    "explanation": f"Count down from {a} by {b}"
                })
                
        return problems
    
    def _get_visual_aids(self, topic: str) -> List[str]:
        """Get visual aids for the topic"""
        return [
            "Number lines",
            "Counting blocks",
            "Ten frames",
            "Base-ten blocks",
            "Interactive whiteboard"
        ]
    
    def _get_educational_games(self, topic: str) -> List[str]:
        """Get educational games for the topic"""
        return [
            "Math bingo",
            "Number matching",
            "Counting races",
            "Pattern blocks",
            "Digital math apps"
        ]
    
    def _create_assessment(self, topic: str, difficulty: str) -> Dict[str, Any]:
        """Create assessment for the topic"""
        return {
            "type": "quiz",
            "questions": 10,
            "format": "multiple choice and fill-in-the-blank",
            "time_limit": "15 minutes"
        }
    
    def _get_prerequisites(self, topic: str) -> List[str]:
        """Get prerequisites for the topic"""
        return [
            "Number recognition (1-100)",
            "Counting skills",
            "Basic number sense"
        ]
    
    def _generate_assessment_problems(self, topic: str) -> List[Dict[str, Any]]:
        """Generate assessment problems"""
        return self._generate_problems(topic, "assessment", 20)