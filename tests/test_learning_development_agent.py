"""
Tests for Learning & Development Agent
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
"""

import pytest
from kev.multi_agents.learning_development_agent import LearningDevelopmentAgent
from priv.backend.multi_agent.message_broker_interface import GoogleCloudPubSubBroker


class TestLearningDevelopmentAgent:
    """Test suite for Learning & Development Agent"""
    
    @pytest.fixture
    def agent(self):
        """Create a Learning & Development Agent instance"""
        broker = GoogleCloudPubSubBroker()
        return LearningDevelopmentAgent(agent_id="ld_test_001", message_broker=broker)
    
    def test_agent_initialization(self, agent):
        """Test agent initialization"""
        assert agent.agent_id == "ld_test_001"
        assert agent.name == "Learning & Development Agent"
    
    @pytest.mark.asyncio
    async def test_create_training_material(self, agent):
        """Test creating training material"""
        task = {
            'type': 'CREATE_TRAINING_MATERIAL',
            'data': {
                'subject': 'Python Programming',
                'skill_level': 'intermediate'
            }
        }
        
        result = await agent.handle_task(task)
        
        assert result['status'] == 'success'
        assert 'training_material' in result
        assert result['training_material']['subject'] == 'Python Programming'
        assert result['training_material']['skill_level'] == 'intermediate'
        assert 'modules' in result['training_material']
        assert 'assessments' in result['training_material']
        assert 'resources' in result['training_material']
        assert len(result['training_material']['modules']) >= 4
    
    @pytest.mark.asyncio
    async def test_create_advanced_training_material(self, agent):
        """Test creating advanced training material"""
        task = {
            'type': 'CREATE_TRAINING_MATERIAL',
            'data': {
                'subject': 'Machine Learning',
                'skill_level': 'advanced'
            }
        }
        
        result = await agent.handle_task(task)
        
        assert result['status'] == 'success'
        training = result['training_material']
        # Advanced level should have more modules
        assert len(training['modules']) > 4
    
    @pytest.mark.asyncio
    async def test_recommend_course(self, agent):
        """Test course recommendation"""
        task = {
            'type': 'RECOMMEND_COURSE',
            'data': {
                'employee_id': 'emp_001',
                'current_skills': ['Python', 'SQL'],
                'career_goals': ['Data Science', 'Machine Learning', 'AI']
            }
        }
        
        result = await agent.handle_task(task)
        
        assert result['status'] == 'success'
        assert 'recommendations' in result
        assert len(result['recommendations']) > 0
        assert len(result['recommendations']) <= 5
        
        # Check recommendation structure
        rec = result['recommendations'][0]
        assert 'course_name' in rec
        assert 'relevance_score' in rec
        assert 'duration' in rec
        assert 'priority' in rec
        assert 'outcomes' in rec
    
    @pytest.mark.asyncio
    async def test_recommend_course_with_gaps(self, agent):
        """Test course recommendation identifies skill gaps"""
        task = {
            'type': 'RECOMMEND_COURSE',
            'data': {
                'employee_id': 'emp_002',
                'current_skills': ['HTML', 'CSS'],
                'career_goals': ['Full Stack Development', 'JavaScript', 'React']
            }
        }
        
        result = await agent.handle_task(task)
        
        assert result['status'] == 'success'
        recommendations = result['recommendations']
        
        # Should recommend courses for career goals not in current skills
        course_names = [rec['course_name'] for rec in recommendations]
        assert any('JavaScript' in name or 'React' in name or 'Full Stack' in name 
                  for name in course_names)
    
    @pytest.mark.asyncio
    async def test_assess_skills_basic(self, agent):
        """Test basic skill assessment"""
        task = {
            'type': 'ASSESS_SKILLS',
            'data': {
                'employee_id': 'emp_003',
                'skill': 'Project Management',
                'assessment_type': 'basic'
            }
        }
        
        result = await agent.handle_task(task)
        
        assert result['status'] == 'success'
        assert 'assessment' in result
        
        assessment = result['assessment']
        assert assessment['employee_id'] == 'emp_003'
        assert assessment['skill'] == 'Project Management'
        assert assessment['assessment_type'] == 'basic'
        assert 'components' in assessment
        assert 'theoretical_knowledge' in assessment['components']
        assert 'practical_application' in assessment['components']
        assert 'problem_solving' in assessment['components']
    
    @pytest.mark.asyncio
    async def test_assess_skills_comprehensive(self, agent):
        """Test comprehensive skill assessment"""
        task = {
            'type': 'ASSESS_SKILLS',
            'data': {
                'employee_id': 'emp_004',
                'skill': 'Leadership',
                'assessment_type': 'comprehensive'
            }
        }
        
        result = await agent.handle_task(task)
        
        assert result['status'] == 'success'
        assessment = result['assessment']
        
        # Comprehensive assessment should have additional components
        assert 'peer_review' in assessment['components']
        assert 'self_assessment' in assessment['components']
    
    @pytest.mark.asyncio
    async def test_unhandled_task_type(self, agent):
        """Test handling of unhandled task type"""
        task = {
            'type': 'UNKNOWN_TASK',
            'data': {}
        }
        
        result = await agent.handle_task(task)
        
        # Should handle gracefully without crashing
        assert result is None or 'status' in result
    
    def test_training_modules_generation(self, agent):
        """Test training module generation"""
        modules = agent._generate_training_modules('Data Analysis', 'beginner')
        
        assert len(modules) >= 4
        assert all('name' in m and 'duration' in m and 'type' in m for m in modules)
    
    def test_assessments_generation(self, agent):
        """Test assessment generation"""
        assessments = agent._generate_assessments('Web Development', 'intermediate')
        
        assert len(assessments) >= 3
        assert any(a['type'] == 'quiz' for a in assessments)
        assert any(a['type'] == 'practical_exercise' for a in assessments)
    
    def test_resources_compilation(self, agent):
        """Test resource compilation"""
        resources = agent._compile_resources('Cloud Computing')
        
        assert len(resources) >= 4
        assert any(r['type'] == 'documentation' for r in resources)
        assert any(r['type'] == 'videos' for r in resources)
    
    def test_skill_gap_identification(self, agent):
        """Test skill gap identification"""
        current_skills = ['Python', 'SQL']
        career_goals = ['Data Science', 'Machine Learning', 'Python', 'Deep Learning']
        
        gaps = agent._identify_skill_gaps(current_skills, career_goals)
        
        # Should identify goals not in current skills
        assert 'Data Science' in gaps
        assert 'Machine Learning' in gaps
        assert 'Deep Learning' in gaps
        assert 'Python' not in gaps  # Already have this skill