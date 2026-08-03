"""
🥽 Virtual Reality School Environment
Metaverse-ready VR/AR integration for immersive learning experiences
"""

import asyncio
import json
import numpy as np
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field, InitVar
from enum import Enum
import uuid
from datetime import datetime

class VRPlatform(Enum):
    OCULUS = "oculus"
    HTC_VIVE = "htc_vive"
    VALVE_INDEX = "valve_index"
    WINDOWS_MR = "windows_mr"
    MOBILE_VR = "mobile_vr"
    WEB_VR = "web_vr"
    AR_MOBILE = "ar_mobile"

class InteractionMode(Enum):
    HAND_TRACKING = "hand_tracking"
    CONTROLLER = "controller"
    VOICE = "voice"
    GESTURE = "gesture"
    EYE_TRACKING = "eye_tracking"

@dataclass
class VRUser:
    """VR/AR user in the virtual school"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    username: str = ""
    avatar_id: str = ""
    platform: VRPlatform = VRPlatform.WEB_VR
    current_location: str = "entrance"
    position: Tuple[float, float, float] = (0.0, 0.0, 0.0)
    rotation: Tuple[float, float, float] = (0.0, 0.0, 0.0)
    interaction_mode: InteractionMode = InteractionMode.CONTROLLER
    is_active: bool = True
    joined_at: datetime = field(default_factory=datetime.now)
    device_capabilities: Dict = field(default_factory=dict)
    preferences: Dict = field(default_factory=dict)
    held_objects: Dict[str, str] = field(default_factory=dict)
    user_id: InitVar[Optional[str]] = None

    def __post_init__(self, user_id: Optional[str]):
        if user_id is not None:
            self.id = user_id

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'username': self.username,
            'avatar_id': self.avatar_id,
            'platform': self.platform.value,
            'current_location': self.current_location,
            'position': self.position,
            'rotation': self.rotation,
            'interaction_mode': self.interaction_mode.value,
            'is_active': self.is_active,
            'joined_at': self.joined_at.isoformat(),
            'device_capabilities': self.device_capabilities,
            'preferences': self.preferences,
            'held_objects': self.held_objects
        }

VirtualUser = VRUser

@dataclass
class VirtualObject:
    """Virtual objects that users can interact with"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    object_type: str = ""
    position: Tuple[float, float, float] = (0.0, 0.0, 0.0)
    rotation: Tuple[float, float, float] = (0.0, 0.0, 0.0)
    scale: Tuple[float, float, float] = (1.0, 1.0, 1.0)
    is_interactable: bool = True
    interaction_scripts: List[str] = field(default_factory=list)
    physics_properties: Dict = field(default_factory=dict)
    visual_properties: Dict = field(default_factory=dict)
    properties: Dict[str, Any] = field(default_factory=dict)
    state: Dict[str, Any] = field(default_factory=dict)
    object_id: InitVar[Optional[str]] = None

    def __post_init__(self, object_id: Optional[str]):
        if object_id is not None:
            self.id = object_id
        
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'name': self.name,
            'object_type': self.object_type,
            'position': self.position,
            'rotation': self.rotation,
            'scale': self.scale,
            'is_interactable': self.is_interactable,
            'interaction_scripts': self.interaction_scripts,
            'physics_properties': self.physics_properties,
            'visual_properties': self.visual_properties,
            'properties': self.properties,
            'state': self.state
        }

class VRSchoolEnvironment:
    """Main VR/AR school environment manager"""
    
    def __init__(self):
        self.users: Dict[str, VRUser] = {}
        self.virtual_objects: Dict[str, VirtualObject] = {}
        self.active_sessions: Dict[str, Dict] = {}
        self.session_history: Dict[str, Dict] = {}
        self.environment_settings = self._initialize_environment()
        self.interaction_handlers = self._setup_interaction_handlers()
        
    def _initialize_environment(self) -> Dict:
        """Initialize the VR school environment settings"""
        return {
            "lighting": {
                "ambient_intensity": 0.7,
                "directional_light": {"intensity": 1.0, "direction": [0, -1, 0]},
                "point_lights": [
                    {"position": [0, 5, 0], "intensity": 0.8, "color": [1, 1, 1]},
                    {"position": [10, 5, 10], "intensity": 0.6, "color": [1, 1, 1]}
                ]
            },
            "skybox": {
                "type": "procedural",
                "time_of_day": "day",
                "weather": "clear",
                "cloud_coverage": 0.2
            },
            "audio": {
                "ambient_sounds": ["school_bell", "footsteps", "distant_conversation"],
                "volume": 0.3,
                "3d_audio_enabled": True
            },
            "physics": {
                "gravity": -9.81,
                "collision_detection": True,
                "object_interaction": True
            },
            "rendering": {
                "quality": "high",
                "shadows": True,
                "reflections": True,
                "anti_aliasing": True
            }
        }
    
    def _setup_interaction_handlers(self) -> Dict:
        """Setup handlers for different types of interactions"""
        return {
            "grab": self._handle_grab_interaction,
            "touch": self._handle_touch_interaction,
            "voice": self._handle_voice_interaction,
            "gesture": self._handle_gesture_interaction,
            "proximity": self._handle_proximity_interaction
        }
    
    def add_user(self, username: str, platform: VRPlatform, 
                 avatar_id: str = "", preferences: Dict = None) -> VRUser:
        """Add a new user to the VR environment"""
        user = VRUser(
            username=username,
            platform=platform,
            avatar_id=avatar_id or self._generate_default_avatar(),
            preferences=preferences or {}
        )
        
        # Set platform-specific capabilities
        user.device_capabilities = self._get_platform_capabilities(platform)
        
        self.users[user.id] = user
        return user
    
    def remove_user(self, user_id: str) -> bool:
        """Remove a user from the VR environment"""
        if user_id in self.users:
            del self.users[user_id]
            # Clean up any sessions the user was part of
            sessions_to_remove = []
            for session_id, session in self.active_sessions.items():
                if user_id in session.get('participants', []):
                    session['participants'].remove(user_id)
                    if not session['participants']:
                        sessions_to_remove.append(session_id)
            
            for session_id in sessions_to_remove:
                del self.active_sessions[session_id]
            
            return True
        return False
    
    def create_virtual_object(self, name: str, object_type: str, 
                            position: Tuple[float, float, float],
                            interaction_scripts: List[str] = None,
                            physics_properties: Dict = None,
                            visual_properties: Dict = None) -> VirtualObject:
        """Create a virtual object in the environment"""
        obj = VirtualObject(
            name=name,
            object_type=object_type,
            position=position,
            interaction_scripts=interaction_scripts or [],
            physics_properties=physics_properties or {},
            visual_properties=visual_properties or {}
        )
        
        self.virtual_objects[obj.id] = obj
        return obj
    
    def initialize_school_objects(self):
        """Initialize all interactive objects for the school environment"""
        
        # Classroom objects
        self.create_virtual_object(
            name="Interactive Whiteboard",
            object_type="display_device",
            position=(0, 1.5, -3),
            interaction_scripts=["write", "erase", "change_slide", "share_screen"],
            visual_properties={"color": [1, 1, 1], "size": [2, 1.5, 0.1]}
        )
        
        # Laboratory equipment
        self.create_virtual_object(
            name="Virtual Microscope",
            object_type="scientific_instrument",
            position=(-2, 1.2, 0),
            interaction_scripts=["zoom", "focus", "change_sample", "capture_image"],
            physics_properties={"weight": 2.5, "fragile": True}
        )
        
        # Musical instruments
        self.create_virtual_object(
            name="Virtual Piano",
            object_type="musical_instrument",
            position=(3, 0.8, 2),
            interaction_scripts=["play_note", "change_octave", "record", "playback"],
            visual_properties={"color": [0.8, 0.6, 0.4], "size": [1.5, 0.8, 1.2]}
        )
        
        # Art supplies
        self.create_virtual_object(
            name="Virtual Canvas",
            object_type="art_supply",
            position=(-3, 1.6, 1),
            interaction_scripts=["paint", "erase", "change_brush", "save_artwork"],
            visual_properties={"color": [1, 1, 1], "size": [1, 1.2, 0.05]}
        )
        
        # Sports equipment
        self.create_virtual_object(
            name="Virtual Basketball",
            object_type="sports_equipment",
            position=(0, 1, 5),
            interaction_scripts=["grab", "throw", "bounce", "shoot"],
            physics_properties={"weight": 0.6, "bounciness": 0.8, "gravity_affected": True}
        )
    
    def move_user(self, user_id: str, new_position: Tuple[float, float, float], 
                  new_rotation: Tuple[float, float, float] = None) -> bool:
        """Move a user to a new position in the virtual environment"""
        if user_id in self.users:
            user = self.users[user_id]
            user.position = new_position
            if new_rotation:
                user.rotation = new_rotation
            
            # Check for proximity interactions
            self._check_proximity_interactions(user_id)
            return True
        return False
    
    def start_session(self, session_type: str, participants: List[str], 
                     location: str, metadata: Dict = None) -> str:
        """Start a new VR session (class, meeting, etc.)"""
        session_id = str(uuid.uuid4())
        
        session = {
            "id": session_id,
            "type": session_type,
            "participants": participants,
            "location": location,
            "start_time": datetime.now().isoformat(),
            "metadata": metadata or {},
            "active": True
        }
        
        self.active_sessions[session_id] = session
        
        # Notify all participants
        for participant_id in participants:
            if participant_id in self.users:
                self.users[participant_id].current_location = location
        
        return session_id
    
    def end_session(self, session_id: str) -> bool:
        """End an active VR session"""
        if session_id in self.active_sessions:
            session = self.active_sessions[session_id]
            session["active"] = False
            session["end_time"] = datetime.now().isoformat()

            # Move to history so active_sessions only ever holds sessions
            # that are genuinely in progress.
            self.session_history[session_id] = session
            del self.active_sessions[session_id]

            # Release any booked facilities
            # (This would integrate with the building management system)
            
            return True
        return False
    
    def _get_platform_capabilities(self, platform: VRPlatform) -> Dict:
        """Get device capabilities based on VR platform"""
        capabilities = {
            VRPlatform.OCULUS: {
                "hand_tracking": True,
                "eye_tracking": False,
                "haptic_feedback": True,
                "room_scale": True,
                "controllers": 2
            },
            VRPlatform.HTC_VIVE: {
                "hand_tracking": False,
                "eye_tracking": False,
                "haptic_feedback": True,
                "room_scale": True,
                "controllers": 2
            },
            VRPlatform.VALVE_INDEX: {
                "hand_tracking": True,
                "eye_tracking": False,
                "haptic_feedback": True,
                "room_scale": True,
                "controllers": 2
            },
            VRPlatform.WINDOWS_MR: {
                "hand_tracking": False,
                "eye_tracking": False,
                "haptic_feedback": True,
                "room_scale": True,
                "controllers": 2
            },
            VRPlatform.MOBILE_VR: {
                "hand_tracking": False,
                "eye_tracking": False,
                "haptic_feedback": False,
                "room_scale": False,
                "controllers": 1
            },
            VRPlatform.WEB_VR: {
                "hand_tracking": False,
                "eye_tracking": False,
                "haptic_feedback": False,
                "room_scale": False,
                "controllers": 0
            },
            VRPlatform.AR_MOBILE: {
                "hand_tracking": True,
                "eye_tracking": False,
                "haptic_feedback": False,
                "room_scale": True,
                "controllers": 0
            }
        }
        return capabilities.get(platform, {})
    
    def _generate_default_avatar(self) -> str:
        """Generate a default avatar ID"""
        return f"default_avatar_{uuid.uuid4().hex[:8]}"
    
    def _check_proximity_interactions(self, user_id: str):
        """Check for objects near the user that could trigger interactions"""
        user = self.users[user_id]
        user_pos = np.array(user.position)
        
        for obj_id, obj in self.virtual_objects.items():
            if obj.is_interactable:
                obj_pos = np.array(obj.position)
                distance = np.linalg.norm(user_pos - obj_pos)
                
                # Trigger proximity interaction if within 2 meters
                if distance < 2.0:
                    self._trigger_interaction(user_id, obj_id, "proximity")
    
    def _trigger_interaction(self, user_id: str, object_id: str, interaction_type: str):
        """Trigger an interaction between user and object"""
        # This would be expanded with actual interaction logic
        print(f"User {user_id} triggered {interaction_type} interaction with object {object_id}")
    
    def _handle_grab_interaction(self, user_id: str, object_id: str, data: Dict):
        """Handle grab interactions"""
        if user_id not in self.users or object_id not in self.virtual_objects:
            return
        
        user = self.users[user_id]
        obj = self.virtual_objects[object_id]
        
        # Check if object is grabbable
        if not obj.properties.get('grabbable', True):
            return
        
        # Attach object to user's hand
        hand = data.get('hand', 'right')
        user.held_objects[hand] = object_id
        
        # Update object state
        obj.state['grabbed'] = True
        obj.state['grabbed_by'] = user_id
        obj.state['grab_hand'] = hand
        
        # Update object position to follow hand
        hand_position = data.get('hand_position', user.position)
        obj.position = hand_position
        
        # Trigger grab event
        self._trigger_event('object_grabbed', {
            'user_id': user_id,
            'object_id': object_id,
            'hand': hand,
            'timestamp': data.get('timestamp')
        })
    
    def _handle_touch_interaction(self, user_id: str, object_id: str, data: Dict):
        """Handle touch interactions"""
        if user_id not in self.users or object_id not in self.virtual_objects:
            return
        
        obj = self.virtual_objects[object_id]
        
        # Check if object is touchable
        if not obj.properties.get('touchable', True):
            return
        
        # Get touch point
        touch_point = data.get('touch_point', obj.position)
        touch_force = data.get('force', 1.0)
        
        # Update object state
        obj.state['touched'] = True
        obj.state['last_touch'] = {
            'user_id': user_id,
            'point': touch_point,
            'force': touch_force,
            'timestamp': data.get('timestamp')
        }
        
        # Trigger touch response based on object type
        if obj.object_type == 'button':
            self._activate_button(object_id, user_id)
        elif obj.object_type == 'interactive_display':
            self._update_display(object_id, touch_point)
        
        # Trigger touch event
        self._trigger_event('object_touched', {
            'user_id': user_id,
            'object_id': object_id,
            'touch_point': touch_point,
            'timestamp': data.get('timestamp')
        })
    
    def _handle_voice_interaction(self, user_id: str, object_id: str, data: Dict):
        """Handle voice interactions"""
        if user_id not in self.users or object_id not in self.virtual_objects:
            return
        
        obj = self.virtual_objects[object_id]
        
        # Check if object responds to voice
        if not obj.properties.get('voice_enabled', False):
            return
        
        # Get voice command
        command = data.get('command', '').lower()
        confidence = data.get('confidence', 0.0)
        
        # Process voice command
        if confidence > 0.7:  # Only process high-confidence commands
            obj.state['last_voice_command'] = {
                'user_id': user_id,
                'command': command,
                'confidence': confidence,
                'timestamp': data.get('timestamp')
            }
            
            # Execute command based on object type
            if obj.object_type == 'virtual_assistant':
                self._process_assistant_command(object_id, command, user_id)
            elif obj.object_type == 'smart_board':
                self._process_board_command(object_id, command, user_id)
            
            # Trigger voice event
            self._trigger_event('voice_command_processed', {
                'user_id': user_id,
                'object_id': object_id,
                'command': command,
                'timestamp': data.get('timestamp')
            })
    
    def _handle_gesture_interaction(self, user_id: str, object_id: str, data: Dict):
        """Handle gesture interactions"""
        if user_id not in self.users or object_id not in self.virtual_objects:
            return
        
        obj = self.virtual_objects[object_id]
        
        # Check if object responds to gestures
        if not obj.properties.get('gesture_enabled', False):
            return
        
        # Get gesture data
        gesture_type = data.get('gesture_type', 'unknown')
        gesture_confidence = data.get('confidence', 0.0)
        
        # Process recognized gestures
        if gesture_confidence > 0.8:
            obj.state['last_gesture'] = {
                'user_id': user_id,
                'type': gesture_type,
                'confidence': gesture_confidence,
                'timestamp': data.get('timestamp')
            }
            
            # Execute gesture-based actions
            gesture_actions = {
                'swipe_left': lambda: self._rotate_object(object_id, -90),
                'swipe_right': lambda: self._rotate_object(object_id, 90),
                'pinch': lambda: self._scale_object(object_id, 0.5),
                'spread': lambda: self._scale_object(object_id, 2.0),
                'point': lambda: self._highlight_object(object_id),
                'wave': lambda: self._activate_object(object_id)
            }
            
            action = gesture_actions.get(gesture_type)
            if action:
                action()
            
            # Trigger gesture event
            self._trigger_event('gesture_recognized', {
                'user_id': user_id,
                'object_id': object_id,
                'gesture_type': gesture_type,
                'timestamp': data.get('timestamp')
            })
    
    def _handle_proximity_interaction(self, user_id: str, object_id: str, data: Dict):
        """Handle proximity-based interactions"""
        if user_id not in self.users or object_id not in self.virtual_objects:
            return
        
        user = self.users[user_id]
        obj = self.virtual_objects[object_id]
        
        # Check if object has proximity triggers
        if not obj.properties.get('proximity_enabled', False):
            return
        
        # Calculate distance
        distance = data.get('distance', self._calculate_distance(user.position, obj.position))
        proximity_threshold = obj.properties.get('proximity_threshold', 2.0)
        
        # Update proximity state
        is_near = distance <= proximity_threshold
        was_near = obj.state.get('user_nearby', False)
        
        obj.state['user_nearby'] = is_near
        obj.state['nearest_user'] = user_id if is_near else None
        obj.state['distance_to_user'] = distance
        
        # Trigger proximity events
        if is_near and not was_near:
            # User entered proximity
            self._on_proximity_enter(object_id, user_id)
            self._trigger_event('proximity_enter', {
                'user_id': user_id,
                'object_id': object_id,
                'distance': distance,
                'timestamp': data.get('timestamp')
            })
        elif not is_near and was_near:
            # User left proximity
            self._on_proximity_exit(object_id, user_id)
            self._trigger_event('proximity_exit', {
                'user_id': user_id,
                'object_id': object_id,
                'distance': distance,
                'timestamp': data.get('timestamp')
            })
    
    # Helper methods for interaction handlers
    
    def _trigger_event(self, event_type: str, event_data: Dict):
        """Trigger a VR environment event"""
        # This would integrate with an event system
        print(f"VR Event: {event_type} - {event_data}")
    
    def _activate_button(self, object_id: str, user_id: str):
        """Activate a button object"""
        obj = self.virtual_objects.get(object_id)
        if obj:
            obj.state['activated'] = True
            obj.state['activated_by'] = user_id
    
    def _update_display(self, object_id: str, touch_point: tuple):
        """Update an interactive display"""
        obj = self.virtual_objects.get(object_id)
        if obj:
            obj.state['display_updated'] = True
            obj.state['touch_point'] = touch_point
    
    def _process_assistant_command(self, object_id: str, command: str, user_id: str):
        """Process virtual assistant command"""
        # This would integrate with an AI assistant
        print(f"Assistant processing: {command} from user {user_id}")
    
    def _process_board_command(self, object_id: str, command: str, user_id: str):
        """Process smart board command"""
        # This would integrate with smart board functionality
        print(f"Smart board processing: {command} from user {user_id}")
    
    def _rotate_object(self, object_id: str, degrees: float):
        """Rotate an object"""
        obj = self.virtual_objects.get(object_id)
        if obj:
            current_rotation = obj.rotation
            obj.rotation = (current_rotation[0], current_rotation[1] + degrees, current_rotation[2])
    
    def _scale_object(self, object_id: str, scale_factor: float):
        """Scale an object"""
        obj = self.virtual_objects.get(object_id)
        if obj:
            obj.scale = tuple(s * scale_factor for s in obj.scale)
    
    def _highlight_object(self, object_id: str):
        """Highlight an object"""
        obj = self.virtual_objects.get(object_id)
        if obj:
            obj.state['highlighted'] = True
    
    def _activate_object(self, object_id: str):
        """Activate an object"""
        obj = self.virtual_objects.get(object_id)
        if obj:
            obj.state['active'] = True
    
    def _calculate_distance(self, pos1: tuple, pos2: tuple) -> float:
        """Calculate Euclidean distance between two positions"""
        return ((pos1[0] - pos2[0])**2 + (pos1[1] - pos2[1])**2 + (pos1[2] - pos2[2])**2)**0.5
    
    def _on_proximity_enter(self, object_id: str, user_id: str):
        """Handle user entering object proximity"""
        obj = self.virtual_objects.get(object_id)
        if obj and obj.object_type == 'info_panel':
            # Auto-display information when user approaches
            obj.state['display_info'] = True
    
    def _on_proximity_exit(self, object_id: str, user_id: str):
        """Handle user leaving object proximity"""
        obj = self.virtual_objects.get(object_id)
        if obj and obj.object_type == 'info_panel':
            # Hide information when user leaves
            obj.state['display_info'] = False
    
    def get_environment_state(self) -> Dict:
        """Get the current state of the VR environment"""
        return {
            "environment_settings": self.environment_settings,
            "active_users": {uid: user.to_dict() for uid, user in self.users.items()},
            "virtual_objects": {oid: obj.to_dict() for oid, obj in self.virtual_objects.items()},
            "active_sessions": self.active_sessions,
            "timestamp": datetime.now().isoformat()
        }
    
    def export_vr_scene(self) -> Dict:
        """Export the complete VR scene for rendering"""
        return {
            "scene_metadata": {
                "version": "1.0",
                "created_at": datetime.now().isoformat(),
                "platform_compatibility": [p.value for p in VRPlatform]
            },
            "environment": self.environment_settings,
            "objects": [obj.to_dict() for obj in self.virtual_objects.values()],
            "user_positions": {uid: user.position for uid, user in self.users.items() if user.is_active}
        }

# Example usage
if __name__ == "__main__":
    # Create VR school environment
    vr_env = VRSchoolEnvironment()
    
    # Initialize school objects
    vr_env.initialize_school_objects()
    
    # Add some users
    user1 = vr_env.add_user("student_alex", VRPlatform.OCULUS, "avatar_123")
    user2 = vr_env.add_user("teacher_maria", VRPlatform.HTC_VIVE, "avatar_456")
    
    # Start a session
    session_id = vr_env.start_session(
        session_type="mathematics_class",
        participants=[user1.id, user2.id],
        location="Mathematics Classroom A",
        metadata={"subject": "calculus", "level": "high_school"}
    )
    
    # Move users
    vr_env.move_user(user1.id, (2, 1, 3))
    vr_env.move_user(user2.id, (0, 1, -2))
    
    # Get environment state
    state = vr_env.get_environment_state()
    print(f"Active users: {len(state['active_users'])}")
    print(f"Virtual objects: {len(state['virtual_objects'])}")
    print(f"Active sessions: {len(state['active_sessions'])}")