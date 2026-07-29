"""
Agent Orchestrator Service
Manages AI teacher agents and their interactions
"""

import asyncio
import importlib
import json
import logging
from typing import Dict, List, Optional, Any
from pathlib import Path
import sys

from ..core.config import settings

logger = logging.getLogger(__name__)

class AgentOrchestrator:
    """Orchestrates AI teacher agents for different subjects"""
    
    def __init__(self):
        self.agents: Dict[str, Any] = {}
        self.agent_registry: Dict[str, Dict] = {}
        self.active_sessions: Dict[str, Dict] = {}
        self.agent_mappings: Dict[str, str] = {}  # subject -> agent_type
        
    async def initialize(self):
        """Initialize the agent orchestrator"""
        logger.info("Initializing Agent Orchestrator...")
        
        # Register all available agents
        await self._register_agents()
        
        # Create subject-agent mappings
        self._create_agent_mappings()
        
        logger.info(f"Agent Orchestrator initialized with {len(self.agents)} agents")
    
    async def _register_agents(self):
        """Register all available agents from the multi_agents directory"""
        agents_path = Path(settings.AGENT_REGISTRY_PATH)
        
        if not agents_path.exists():
            logger.error(f"Agents path not found: {agents_path}")
            return
        
        # Add agents path to Python path
        sys.path.insert(0, str(agents_path.parent))
        
        # Walk through all agent directories
        for agent_dir in agents_path.iterdir():
            if agent_dir.is_dir():
                await self._register_agent_directory(agent_dir)
    
    async def _register_agent_directory(self, agent_dir: Path):
        """Register all agents in a directory"""
        category = agent_dir.name
        
        for agent_file in agent_dir.glob("*.py"):
            if agent_file.name.startswith("__"):
                continue
            
            try:
                await self._register_agent_file(agent_file, category)
            except Exception as e:
                logger.error(f"Failed to register agent {agent_file}: {str(e)}")
    
    async def _register_agent_file(self, agent_file: Path, category: str):
        """Register a single agent file"""
        module_name = f"kev.multi_agents.{category}.{agent_file.stem}"
        
        try:
            # Import the module
            module = importlib.import_module(module_name)
            
            # Look for agent classes
            for attr_name in dir(module):
                attr = getattr(module, attr_name)
                
                if (isinstance(attr, type) and 
                    attr_name.endswith("Agent") and 
                    hasattr(attr, '__call__')):
                    
                    agent_info = {
                        "class": attr,
                        "name": attr_name,
                        "category": category,
                        "module": module_name,
                        "file": str(agent_file),
                        "description": getattr(attr, "__doc__", "No description"),
                        "capabilities": getattr(attr, "CAPABILITIES", []),
                        "subjects": getattr(attr, "SUBJECTS", [])
                    }
                    
                    # Register agent
                    agent_key = f"{category}_{attr_name}".lower()
                    self.agents[agent_key] = agent_info
                    self.agent_registry[agent_key] = {
                        "name": attr_name,
                        "category": category,
                        "description": agent_info["description"],
                        "capabilities": agent_info["capabilities"],
                        "subjects": agent_info["subjects"]
                    }
                    
                    logger.info(f"Registered agent: {agent_key}")
        
        except Exception as e:
            logger.error(f"Failed to import {module_name}: {str(e)}")
    
    def _create_agent_mappings(self):
        """Create mappings between subjects and agent types"""
        # Define subject-agent mappings based on agent capabilities
        self.agent_mappings = {
            # Mathematics
            "mathematics": "education_and_knowledge_agents_learningpersonalizationagent",
            "algebra": "education_and_knowledge_agents_learningpersonalizationagent",
            "geometry": "education_and_knowledge_agents_learningpersonalizationagent",
            "calculus": "education_and_knowledge_agents_learningpersonalizationagent",
            
            # Sciences
            "physics": "education_and_knowledge_agents_interactivetutorialagent",
            "chemistry": "education_and_knowledge_agents_interactivetutorialagent",
            "biology": "education_and_knowledge_agents_interactivetutorialagent",
            
            # Languages
            "english": "education_and_knowledge_agents_educationcontentwriteragent",
            "literature": "education_and_knowledge_agents_educationcontentwriteragent",
            "writing": "education_and_knowledge_agents_educationcontentwriteragent",
            
            # Computer Science
            "programming": "education_and_knowledge_agents_elearningplatformagent",
            "computer_science": "education_and_knowledge_agents_elearningplatformagent",
            
            # Arts
            "art": "mythic_education_and_archetypal_learning_agents_archetypalteachingagent",
            "music": "mythic_education_and_archetypal_learning_agents_archetypalteachingagent",
            
            # Social Sciences
            "history": "education_and_knowledge_agents_educationcontentwriteragent",
            "geography": "education_and_knowledge_agents_educationcontentwriteragent",
            
            # General Education
            "general": "education_and_knowledge_agents_educationadvisoragent",
            "learning": "education_and_knowledge_agents_learningpersonalizationagent"
        }
    
    async def get_agent_for_subject(self, subject: str) -> Optional[str]:
        """Get the appropriate agent type for a subject"""
        # Try exact match first
        if subject.lower() in self.agent_mappings:
            return self.agent_mappings[subject.lower()]
        
        # Try partial match
        for mapped_subject, agent_type in self.agent_mappings.items():
            if mapped_subject in subject.lower() or subject.lower() in mapped_subject:
                return agent_type
        
        # Default to general education agent
        return self.agent_mappings.get("general")
    
    async def create_agent_instance(self, agent_type: str, session_id: str, user_id: str) -> Optional[Any]:
        """Create an instance of an agent"""
        if agent_type not in self.agents:
            logger.error(f"Agent type not found: {agent_type}")
            return None
        
        try:
            agent_class = self.agents[agent_type]["class"]
            
            # Create agent instance with context
            agent_instance = agent_class()
            
            # Initialize agent with session context
            if hasattr(agent_instance, 'initialize'):
                await agent_instance.initialize({
                    "session_id": session_id,
                    "user_id": user_id,
                    "agent_type": agent_type
                })
            
            return agent_instance
        
        except Exception as e:
            logger.error(f"Failed to create agent instance {agent_type}: {str(e)}")
            return None
    
    async def handle_session_join(self, user_id: str, session_id: str):
        """Handle a user joining a session"""
        if session_id not in self.active_sessions:
            self.active_sessions[session_id] = {
                "user_id": user_id,
                "agents": {},
                "current_agent": None,
                "subject": None
            }
        
        logger.info(f"User {user_id} joined session {session_id}")
    
    async def switch_agent(self, user_id: str, session_id: str, subject: str):
        """Switch to the appropriate agent for a subject"""
        if session_id not in self.active_sessions:
            await self.handle_session_join(user_id, session_id)
        
        session = self.active_sessions[session_id]
        
        # Get appropriate agent for subject
        agent_type = await self.get_agent_for_subject(subject)
        if not agent_type:
            logger.error(f"No agent found for subject: {subject}")
            return None
        
        # Create new agent instance if needed
        if agent_type not in session["agents"]:
            agent_instance = await self.create_agent_instance(agent_type, session_id, user_id)
            if agent_instance:
                session["agents"][agent_type] = agent_instance
        
        # Switch to the new agent
        session["current_agent"] = agent_type
        session["subject"] = subject
        
        logger.info(f"Switched to agent {agent_type} for subject {subject}")
        
        return agent_type
    
    async def process_agent_message(self, user_id: str, session_id: str, message: str) -> Dict[str, Any]:
        """Process a message to the current agent"""
        if session_id not in self.active_sessions:
            return {
                "error": "Session not found",
                "response": "Please start a session first."
            }
        
        session = self.active_sessions[session_id]
        current_agent_type = session.get("current_agent")
        
        if not current_agent_type:
            return {
                "error": "No active agent",
                "response": "Please select a subject to start learning."
            }
        
        if current_agent_type not in session["agents"]:
            return {
                "error": "Agent not initialized",
                "response": "Agent is still initializing. Please wait."
            }
        
        try:
            agent_instance = session["agents"][current_agent_type]
            
            # Process message through agent
            if hasattr(agent_instance, 'process_message'):
                response = await agent_instance.process_message(message)
            elif hasattr(agent_instance, 'handle_query'):
                response = await agent_instance.handle_query(message)
            else:
                response = f"I'm your {session.get('subject', 'AI')} tutor. I received your message: {message}"
            
            return {
                "success": True,
                "response": response,
                "agent_type": current_agent_type,
                "subject": session.get("subject")
            }
        
        except Exception as e:
            logger.error(f"Error processing message with agent {current_agent_type}: {str(e)}")
            return {
                "error": "Processing error",
                "response": "I'm having trouble processing your message. Please try again."
            }
    
    async def get_available_agents(self) -> List[Dict[str, Any]]:
        """Get list of available agents"""
        return list(self.agent_registry.values())
    
    async def get_agent_info(self, agent_type: str) -> Optional[Dict[str, Any]]:
        """Get information about a specific agent"""
        return self.agent_registry.get(agent_type)
    
    async def shutdown(self):
        """Shutdown the agent orchestrator"""
        logger.info("Shutting down Agent Orchestrator...")
        
        # Shutdown all active agents
        for session_id, session in self.active_sessions.items():
            for agent_type, agent_instance in session["agents"].items():
                try:
                    if hasattr(agent_instance, 'shutdown'):
                        await agent_instance.shutdown()
                except Exception as e:
                    logger.error(f"Error shutting down agent {agent_type}: {str(e)}")
        
        self.agents.clear()
        self.agent_registry.clear()
        self.active_sessions.clear()
        
        logger.info("Agent Orchestrator shutdown complete")