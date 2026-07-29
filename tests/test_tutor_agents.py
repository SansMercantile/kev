"""
Tests for Tutor Agent System
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
"""

import pytest
from kev.multi_agents.base_tutor_agent import (
    BaseTutorAgent, EducationLevel, TutorType, DifficultyLevel,
    StudentProfile, LearningSession
)
from kev.multi_agents.arts.elementary.tutors.crafts_tutors import CraftsTutor


class TestBaseTutorAgent:
    """Test suite for base tutor agent functionality"""
    
    @pytest.fixture
    def student_profile(self):
        """Create a test student profile"""
        return StudentProfile(
            student_id="student_001",
            name="Test Student",
            age=10,
            education_level=EducationLevel.ELEMENTARY,
            learning_style="visual",
            strengths=["art", "creativity"],
            weaknesses=["math"]
        )
    
    @pytest.fixture
    def crafts_tutor(self):
        """Create a crafts tutor instance"""
        return CraftsTutor()
    
    def test_tutor_initialization(self, crafts_tutor):
        """Test tutor initialization"""
        assert crafts_tutor.tutor_id == "arts_elementary_crafts_tutors_001"
        assert crafts_tutor.subject == "Arts"
        assert crafts_tutor.specialization == "Crafts"
        assert crafts_tutor.tutor_type == TutorType.TUTOR
        assert EducationLevel.ELEMENTARY in crafts_tutor.education_levels
    
    def test_get_topic_list(self, crafts_tutor):
        """Test getting topic list"""
        topics = crafts_tutor._get_topic_list()
        
        assert len(topics) > 0
        assert "crafts fundamentals" in topics
    
    @pytest.mark.asyncio
    async def test_teach_topic(self, crafts_tutor, student_profile):
        """Test teaching a topic"""
        result = await crafts_tutor.teach_topic(
            student_profile,
            "crafts fundamentals",
            DifficultyLevel.BEGINNER
        )
        
        assert "content" in result
        assert "assessment" in result
    
    @pytest.mark.asyncio
    async def test_assess_knowledge(self, crafts_tutor, student_profile):
        """Test knowledge assessment"""
        result = await crafts_tutor.assess_knowledge(
            student_profile,
            "crafts fundamentals"
        )
        
        assert "evaluation" in result
    
    @pytest.mark.asyncio
    async def test_create_session(self, crafts_tutor, student_profile):
        """Test creating a learning session"""
        # Must register the student before creating a session
        await crafts_tutor.register_student(student_profile)

        session_id = await crafts_tutor.create_session(
            "student_001",
            "crafts fundamentals",
            DifficultyLevel.BEGINNER
        )
        
        assert session_id is not None
        assert session_id != ""
        assert session_id in crafts_tutor.active_sessions
        
        session = crafts_tutor.active_sessions[session_id]
        assert session.student_id == "student_001"
        assert session.topic == "crafts fundamentals"
        assert session.difficulty == DifficultyLevel.BEGINNER
    
    @pytest.mark.asyncio
    async def test_end_session(self, crafts_tutor, student_profile):
        """Test ending a learning session"""
        # Register the student and create a session first
        await crafts_tutor.register_student(student_profile)
        session_id = await crafts_tutor.create_session(
            "student_001",
            "crafts fundamentals",
            DifficultyLevel.BEGINNER
        )
        assert session_id != "", "Session creation failed — student not registered?"
        
        # End the session
        result = await crafts_tutor.end_session(session_id)
        
        assert result is True
        assert session_id not in crafts_tutor.active_sessions
    
    @pytest.mark.asyncio
    async def test_register_student(self, crafts_tutor, student_profile):
        """Test registering a student"""
        await crafts_tutor.register_student(student_profile)
        
        assert student_profile.student_id in crafts_tutor.student_profiles
        assert crafts_tutor.student_profiles[student_profile.student_id] == student_profile
    
    @pytest.mark.asyncio
    async def test_get_capabilities(self, crafts_tutor):
        """Test getting tutor capabilities"""
        capabilities = await crafts_tutor.get_capabilities()
        
        assert "tutor_id" in capabilities
        assert "subject" in capabilities
        assert "specialization" in capabilities
        assert capabilities["tutor_id"] == crafts_tutor.tutor_id
    
    @pytest.mark.asyncio
    async def test_recommend_topics(self, crafts_tutor, student_profile):
        """Test topic recommendations"""
        await crafts_tutor.register_student(student_profile)
        
        recommendations = await crafts_tutor.recommend_topics(student_profile)
        
        assert isinstance(recommendations, list)
        assert len(recommendations) <= 5
    
    def test_max_students_limit(self, crafts_tutor):
        """Test maximum students limit"""
        assert crafts_tutor.max_students > 0
        assert len(crafts_tutor.active_sessions) <= crafts_tutor.max_students


class TestEducationLevels:
    """Test education level enum"""
    
    def test_education_levels_exist(self):
        """Test all education levels are defined"""
        assert hasattr(EducationLevel, 'ELEMENTARY')
        assert hasattr(EducationLevel, 'MIDDLE_SCHOOL')
        assert hasattr(EducationLevel, 'HIGH_SCHOOL')
        assert hasattr(EducationLevel, 'COLLEGE')
        assert hasattr(EducationLevel, 'GRADUATE')


class TestTutorTypes:
    """Test tutor type enum"""
    
    def test_tutor_types_exist(self):
        """Test all tutor types are defined"""
        assert hasattr(TutorType, 'TUTOR')
        assert hasattr(TutorType, 'TEACHER')
        assert hasattr(TutorType, 'MENTOR')
        assert hasattr(TutorType, 'EXPERT')
        assert hasattr(TutorType, 'INVIGILATOR')


class TestDifficultyLevels:
    """Test difficulty level enum"""
    
    def test_difficulty_levels_exist(self):
        """Test all difficulty levels are defined"""
        assert hasattr(DifficultyLevel, 'BEGINNER')
        assert hasattr(DifficultyLevel, 'INTERMEDIATE')
        assert hasattr(DifficultyLevel, 'ADVANCED')
        assert hasattr(DifficultyLevel, 'EXPERT')