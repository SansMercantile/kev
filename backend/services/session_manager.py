"""
Session Manager Service
Manages user sessions and learning progress
"""

import asyncio
import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import uuid

from ..core.config import settings

logger = logging.getLogger(__name__)

class SessionManager:
    """Manages learning sessions and user progress"""
    
    def __init__(self):
        self.active_sessions: Dict[str, Dict] = {}
        self.user_sessions: Dict[str, List[str]] = {}  # user_id -> [session_ids]
        self.session_history: Dict[str, List[Dict]] = {}  # session_id -> [events]
        
    async def initialize(self):
        """Initialize the session manager"""
        logger.info("Initializing Session Manager...")
        
        # Load any existing sessions from database if needed
        # For now, start with empty sessions
        
        logger.info("Session Manager initialized")
    
    async def create_session(self, user_id: str, subject: str, session_type: str = "individual") -> str:
        """Create a new learning session"""
        session_id = str(uuid.uuid4())
        
        session = {
            "session_id": session_id,
            "user_id": user_id,
            "subject": subject,
            "session_type": session_type,
            "created_at": datetime.now().isoformat(),
            "last_activity": datetime.now().isoformat(),
            "status": "active",
            "duration": 0,
            "interactions": 0,
            "topics_covered": [],
            "current_topic": None,
            "progress": 0.0,
            "achievements": [],
            "notes": [],
            "agent_switches": 0
        }
        
        self.active_sessions[session_id] = session
        
        if user_id not in self.user_sessions:
            self.user_sessions[user_id] = []
        self.user_sessions[user_id].append(session_id)
        
        # Initialize session history
        self.session_history[session_id] = [{
            "type": "session_created",
            "timestamp": datetime.now().isoformat(),
            "data": {
                "subject": subject,
                "session_type": session_type
            }
        }]
        
        logger.info(f"Created session {session_id} for user {user_id} in subject {subject}")
        
        return session_id
    
    async def join_session(self, user_id: str, session_id: str):
        """Join an existing session"""
        if session_id not in self.active_sessions:
            logger.error(f"Session {session_id} not found")
            return False
        
        session = self.active_sessions[session_id]
        
        if session["user_id"] != user_id:
            logger.error(f"User {user_id} not authorized for session {session_id}")
            return False
        
        session["last_activity"] = datetime.now().isoformat()
        session["status"] = "active"
        
        # Add to session history
        self.session_history[session_id].append({
            "type": "session_joined",
            "timestamp": datetime.now().isoformat(),
            "data": {"user_id": user_id}
        })
        
        logger.info(f"User {user_id} joined session {session_id}")
        
        return True
    
    async def leave_session(self, user_id: str, session_id: Optional[str] = None):
        """Leave a session (or all sessions for user)"""
        sessions_to_leave = []
        
        if session_id:
            sessions_to_leave = [session_id]
        else:
            # Leave all active sessions for user
            sessions_to_leave = [
                sid for sid, session in self.active_sessions.items()
                if session["user_id"] == user_id and session["status"] == "active"
            ]
        
        for sid in sessions_to_leave:
            if sid in self.active_sessions:
                session = self.active_sessions[sid]
                session["status"] = "completed"
                session["ended_at"] = datetime.now().isoformat()
                
                # Calculate duration
                start_time = datetime.fromisoformat(session["created_at"])
                end_time = datetime.fromisoformat(session["ended_at"])
                session["duration"] = int((end_time - start_time).total_seconds())
                
                # Add to session history
                self.session_history[sid].append({
                    "type": "session_ended",
                    "timestamp": datetime.now().isoformat(),
                    "data": {
                        "duration": session["duration"],
                        "interactions": session["interactions"]
                    }
                })
                
                logger.info(f"User {user_id} left session {sid}")
        
        return len(sessions_to_leave)
    
    async def update_session_activity(self, session_id: str, activity_type: str, data: Dict[str, Any]):
        """Update session with new activity"""
        if session_id not in self.active_sessions:
            return False
        
        session = self.active_sessions[session_id]
        session["last_activity"] = datetime.now().isoformat()
        session["interactions"] += 1
        
        # Add to session history
        self.session_history[session_id].append({
            "type": activity_type,
            "timestamp": datetime.now().isoformat(),
            "data": data
        })
        
        # Update specific session data based on activity type
        if activity_type == "topic_change":
            topic = data.get("topic")
            if topic:
                if topic not in session["topics_covered"]:
                    session["topics_covered"].append(topic)
                session["current_topic"] = topic
        
        elif activity_type == "progress_update":
            progress = data.get("progress", 0)
            session["progress"] = max(session["progress"], progress)
        
        elif activity_type == "agent_switch":
            session["agent_switches"] += 1
        
        elif activity_type == "achievement":
            achievement = data.get("achievement")
            if achievement and achievement not in session["achievements"]:
                session["achievements"].append(achievement)
        
        elif activity_type == "note":
            note = data.get("note")
            if note:
                session["notes"].append({
                    "timestamp": datetime.now().isoformat(),
                    "content": note
                })
        
        return True
    
    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session information"""
        return self.active_sessions.get(session_id)
    
    async def get_user_sessions(self, user_id: str, active_only: bool = True) -> List[Dict[str, Any]]:
        """Get all sessions for a user"""
        user_session_ids = self.user_sessions.get(user_id, [])
        sessions = []
        
        for session_id in user_session_ids:
            if session_id in self.active_sessions:
                session = self.active_sessions[session_id]
                if not active_only or session["status"] == "active":
                    sessions.append(session)
        
        return sessions
    
    async def get_session_history(self, session_id: str) -> List[Dict[str, Any]]:
        """Get session history/events"""
        return self.session_history.get(session_id, [])
    
    async def get_user_progress(self, user_id: str, subject: Optional[str] = None) -> Dict[str, Any]:
        """Get user's overall progress"""
        user_sessions = await self.get_user_sessions(user_id, active_only=False)
        
        total_sessions = len(user_sessions)
        total_duration = sum(session.get("duration", 0) for session in user_sessions)
        total_interactions = sum(session.get("interactions", 0) for session in user_sessions)
        
        # Filter by subject if specified
        if subject:
            subject_sessions = [s for s in user_sessions if s.get("subject") == subject]
            total_sessions = len(subject_sessions)
            total_duration = sum(s.get("duration", 0) for s in subject_sessions)
            total_interactions = sum(s.get("interactions", 0) for s in subject_sessions)
        
        # Calculate average progress
        progress_scores = [s.get("progress", 0) for s in user_sessions if s.get("progress")]
        avg_progress = sum(progress_scores) / len(progress_scores) if progress_scores else 0
        
        # Get all achievements
        all_achievements = []
        for session in user_sessions:
            all_achievements.extend(session.get("achievements", []))
        
        return {
            "user_id": user_id,
            "subject": subject,
            "total_sessions": total_sessions,
            "total_duration": total_duration,
            "total_interactions": total_interactions,
            "average_progress": round(avg_progress, 2),
            "achievements": list(set(all_achievements)),
            "subjects_studied": list(set(s.get("subject") for s in user_sessions if s.get("subject")))
        }
    
    async def cleanup_inactive_sessions(self, inactive_threshold_hours: int = 24):
        """Clean up inactive sessions"""
        cutoff_time = datetime.now() - timedelta(hours=inactive_threshold_hours)
        
        sessions_to_remove = []
        
        for session_id, session in self.active_sessions.items():
            last_activity = datetime.fromisoformat(session["last_activity"])
            
            if last_activity < cutoff_time:
                sessions_to_remove.append(session_id)
        
        # Remove inactive sessions
        for session_id in sessions_to_remove:
            if session_id in self.active_sessions:
                session = self.active_sessions[session_id]
                user_id = session["user_id"]
                
                # Remove from user sessions
                if user_id in self.user_sessions and session_id in self.user_sessions[user_id]:
                    self.user_sessions[user_id].remove(session_id)
                
                # Remove session
                del self.active_sessions[session_id]
                del self.session_history[session_id]
                
                logger.info(f"Cleaned up inactive session {session_id}")
        
        return len(sessions_to_remove)
    
    async def shutdown(self):
        """Shutdown the session manager"""
        logger.info("Shutting down Session Manager...")
        
        # End all active sessions
        for session_id in list(self.active_sessions.keys()):
            session = self.active_sessions[session_id]
            await self.leave_session(session["user_id"], session_id)
        
        logger.info("Session Manager shutdown complete")
        if datetime.now() < cutoff_time:
                sessions_to_remove.append(session_id)
        
        # Remove inactive sessions
        for session_id in sessions_to_remove:
            session = self.active_sessions[session_id]
            user_id = session["user_id"]
            
            # Mark as completed
            session["status"] = "expired"
            session["ended_at"] = datetime.now().isoformat()
            
            # Remove from user's active sessions
            if user_id in self.user_sessions and session_id in self.user_sessions[user_id]:
                self.user_sessions[user_id].remove(session_id)
            
            logger.info(f"Removed inactive session {session_id} for user {user_id}")
        
        return len(sessions_to_remove)
    
    async def shutdown(self):
        """Shutdown the session manager"""
        logger.info("Shutting down Session Manager...")
        
        # Complete all active sessions
        for session_id, session in self.active_sessions.items():
            if session["status"] == "active":
                session["status"] = "shutdown"
                session["ended_at"] = datetime.now().isoformat()
                
                # Calculate duration
                start_time = datetime.fromisoformat(session["created_at"])
                end_time = datetime.fromisoformat(session["ended_at"])
                session["duration"] = int((end_time - start_time).total_seconds())
        
        logger.info("Session Manager shutdown complete")
        if datetime.now() < cutoff_time:
                sessions_to_remove.append(session_id)
        
        # Remove inactive sessions
        for session_id in sessions_to_remove:
            session = self.active_sessions[session_id]
            user_id = session["user_id"]
            
            # Mark as completed
            session["status"] = "expired"
            session["ended_at"] = datetime.now().isoformat()
            
            # Remove from user's active sessions
            if user_id in self.user_sessions and session_id in self.user_sessions[user_id]:
                self.user_sessions[user_id].remove(session_id)
            
            logger.info(f"Cleaned up inactive session {session_id}")
        
        return len(sessions_to_remove)
    
    async def shutdown(self):
        """Shutdown the session manager"""
        logger.info("Shutting down Session Manager...")
        
        # End all active sessions
        for session_id, session in self.active_sessions.items():
            if session["status"] == "active":
                session["status"] = "shutdown"
                session["ended_at"] = datetime.now().isoformat()
        
        logger.info("Session Manager shutdown complete")
        if datetime.now() < cutoff_time:
                sessions_to_remove.append(session_id)
        
        # Remove inactive sessions
        for session_id in sessions_to_remove:
            session = self.active_sessions[session_id]
            user_id = session["user_id"]
            
            # Mark as completed
            session["status"] = "expired"
            session["ended_at"] = datetime.now().isoformat()
            
            # Remove from active sessions
            del self.active_sessions[session_id]
            
            # Remove from user sessions
            if user_id in self.user_sessions:
                self.user_sessions[user_id].remove(session_id)
            
            logger.info(f"Cleaned up inactive session {session_id}")
        
        return len(sessions_to_remove)
    
    async def shutdown(self):
        """Shutdown the session manager"""
        logger.info("Shutting down Session Manager...")
        
        # End all active sessions
        for session_id in list(self.active_sessions.keys()):
            session = self.active_sessions[session_id]
            await self.leave_session(session["user_id"], session_id)
        
        self.active_sessions.clear()
        self.user_sessions.clear()
        self.session_history.clear()
        
        logger.info("Session Manager shutdown complete")
        if datetime.now() < cutoff_time:
                sessions_to_remove.append(session_id)
        
        # Remove inactive sessions
        for session_id in sessions_to_remove:
            session = self.active_sessions[session_id]
            user_id = session["user_id"]
            
            # Mark as completed
            session["status"] = "expired"
            session["ended_at"] = datetime.now().isoformat()
            
            # Remove from active sessions
            del self.active_sessions[session_id]
            
            # Remove from user sessions
            if user_id in self.user_sessions and session_id in self.user_sessions[user_id]:
                self.user_sessions[user_id].remove(session_id)
            
            logger.info(f"Cleaned up inactive session {session_id}")
        
        return len(sessions_to_remove)
    
    async def shutdown(self):
        """Shutdown the session manager"""
        logger.info("Shutting down Session Manager...")
        
        # End all active sessions
        for session_id in list(self.active_sessions.keys()):
            session = self.active_sessions[session_id]
            await self.leave_session(session["user_id"], session_id)
        
        logger.info("Session Manager shutdown complete")
        if datetime.now() < cutoff_time:
                sessions_to_remove.append(session_id)
        
        # Remove inactive sessions
        for session_id in sessions_to_remove:
            session = self.active_sessions[session_id]
            session["status"] = "expired"
            
            # Add to session history
            self.session_history[session_id].append({
                "type": "session_expired",
                "timestamp": datetime.now().isoformat(),
                "data": {"reason": "inactive_timeout"}
            })
            
            logger.info(f"Session {session_id} expired due to inactivity")
        
        return len(sessions_to_remove)
    
    async def shutdown(self):
        """Shutdown the session manager"""
        logger.info("Shutting down Session Manager...")
        
        # End all active sessions
        for session_id, session in self.active_sessions.items():
            if session["status"] == "active":
                session["status"] = "shutdown"
                session["ended_at"] = datetime.now().isoformat()
                
                # Calculate duration
                start_time = datetime.fromisoformat(session["created_at"])
                end_time = datetime.fromisoformat(session["ended_at"])
                session["duration"] = int((end_time - start_time).total_seconds())
        
        logger.info("Session Manager shutdown complete")
        if datetime.now() < cutoff_time:
                sessions_to_remove.append(session_id)
        
        # Remove inactive sessions
        for session_id in sessions_to_remove:
            session = self.active_sessions[session_id]
            session["status"] = "expired"
            session["ended_at"] = datetime.now().isoformat()
            
            logger.info(f"Cleaned up inactive session {session_id}")
        
        return len(sessions_to_remove)
    
    async def shutdown(self):
        """Shutdown the session manager"""
        logger.info("Shutting down Session Manager...")
        
        # End all active sessions
        for session_id, session in self.active_sessions.items():
            if session["status"] == "active":
                session["status"] = "shutdown"
                session["ended_at"] = datetime.now().isoformat()
        
        logger.info("Session Manager shutdown complete")
        if datetime.now() < cutoff_time:
                sessions_to_remove.append(session_id)
        
        # Remove inactive sessions
        for session_id in sessions_to_remove:
            session = self.active_sessions[session_id]
            session["status"] = "expired"
            session["ended_at"] = datetime.now().isoformat()
            
            logger.info(f"Cleaned up inactive session {session_id}")
        
        return len(sessions_to_remove)
    
    async def shutdown(self):
        """Shutdown the session manager"""
        logger.info("Shutting down Session Manager...")
        
        # End all active sessions
        for session_id, session in self.active_sessions.items():
            if session["status"] == "active":
                session["status"] = "shutdown"
                session["ended_at"] = datetime.now().isoformat()
        
        logger.info("Session Manager shutdown complete")
        if datetime.now() < cutoff_time:
                sessions_to_remove.append(session_id)
        
        # Remove inactive sessions
        for session_id in sessions_to_remove:
            session = self.active_sessions[session_id]
            user_id = session["user_id"]
            
            # Mark as completed
            session["status"] = "expired"
            session["ended_at"] = datetime.now().isoformat()
            
            # Remove from user's active sessions
            if user_id in self.user_sessions and session_id in self.user_sessions[user_id]:
                self.user_sessions[user_id].remove(session_id)
            
            logger.info(f"Cleaned up inactive session {session_id}")
        
        return len(sessions_to_remove)
    
    async def shutdown(self):
        """Shutdown the session manager"""
        logger.info("Shutting down Session Manager...")
        
        # End all active sessions
        for session_id in list(self.active_sessions.keys()):
            session = self.active_sessions[session_id]
            await self.leave_session(session["user_id"], session_id)
        
        logger.info("Session Manager shutdown complete")
        if datetime.now() < cutoff_time:
                sessions_to_remove.append(session_id)
        
        for session_id in sessions_to_remove:
            session = self.active_sessions[session_id]
            user_id = session["user_id"]
            
            # Mark as completed
            session["status"] = "expired"
            session["ended_at"] = datetime.now().isoformat()
            
            # Remove from user's active sessions
            if user_id in self.user_sessions and session_id in self.user_sessions[user_id]:
                self.user_sessions[user_id].remove(session_id)
            
            logger.info(f"Cleaned up inactive session {session_id}")
        
        return len(sessions_to_remove)
    
    async def shutdown(self):
        """Shutdown the session manager"""
        logger.info("Shutting down Session Manager...")
        
        # Mark all active sessions as completed
        for session_id, session in self.active_sessions.items():
            if session["status"] == "active":
                session["status"] = "shutdown"
                session["ended_at"] = datetime.now().isoformat()
                
                # Calculate final duration
                start_time = datetime.fromisoformat(session["created_at"])
                end_time = datetime.fromisoformat(session["ended_at"])
                session["duration"] = int((end_time - start_time).total_seconds())
        
        logger.info("Session Manager shutdown complete")
        if datetime.now() < cutoff_time and session["status"] == "active":
                session["status"] = "timeout"
                session["ended_at"] = datetime.now().isoformat()
                sessions_to_remove.append(session_id)
        
        logger.info(f"Cleaned up {len(sessions_to_remove)} inactive sessions")
        
        return len(sessions_to_remove)
    
    async def get_session_statistics(self) -> Dict[str, Any]:
        """Get overall session statistics"""
        total_sessions = len(self.active_sessions)
        active_sessions = len([s for s in self.active_sessions.values() if s["status"] == "active"])
        
        total_users = len(self.user_sessions)
        total_interactions = sum(s.get("interactions", 0) for s in self.active_sessions.values())
        
        # Most popular subjects
        subject_counts = {}
        for session in self.active_sessions.values():
            subject = session.get("subject", "unknown")
            subject_counts[subject] = subject_counts.get(subject, 0) + 1
        
        popular_subjects = sorted(subject_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        
        return {
            "total_sessions": total_sessions,
            "active_sessions": active_sessions,
            "total_users": total_users,
            "total_interactions": total_interactions,
            "popular_subjects": popular_subjects,
            "average_session_duration": sum(s.get("duration", 0) for s in self.active_sessions.values()) / max(total_sessions, 1)
        }
    
    async def shutdown(self):
        """Shutdown the session manager"""
        logger.info("Shutting down Session Manager...")
        
        # Mark all active sessions as completed
        for session_id, session in self.active_sessions.items():
            if session["status"] == "active":
                session["status"] = "shutdown"
                session["ended_at"] = datetime.now().isoformat()
                
                # Calculate final duration
                start_time = datetime.fromisoformat(session["created_at"])
                end_time = datetime.fromisoformat(session["ended_at"])
                session["duration"] = int((end_time - start_time).total_seconds())
        
        logger.info("Session Manager shutdown complete")