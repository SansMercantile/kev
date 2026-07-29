"""
Tests for VR/AR Interaction Handlers
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
"""

import pytest
from kev.virtual_school.vr_ar.vr_school_environment import (
    VRSchoolEnvironment, VirtualUser, VirtualObject
)


class TestVRInteractions:
    """Test suite for VR/AR interaction handlers"""
    
    @pytest.fixture
    def vr_env(self):
        """Create a VR environment instance"""
        return VRSchoolEnvironment()
    
    @pytest.fixture
    def test_user(self, vr_env):
        """Create a test user"""
        user = VirtualUser(
            user_id="user_001",
            username="test_student",
            position=(0, 0, 0),
            rotation=(0, 0, 0)
        )
        vr_env.users["user_001"] = user
        return user
    
    @pytest.fixture
    def test_object(self, vr_env):
        """Create a test object"""
        obj = VirtualObject(
            object_id="obj_001",
            object_type="interactive",
            position=(1, 0, 0),
            rotation=(0, 0, 0),
            scale=(1, 1, 1),
            properties={'grabbable': True, 'touchable': True}
        )
        vr_env.virtual_objects["obj_001"] = obj
        return obj
    
    def test_grab_interaction(self, vr_env, test_user, test_object):
        """Test grab interaction"""
        data = {
            'hand': 'right',
            'hand_position': (1, 0, 0),
            'timestamp': '2024-01-01T00:00:00'
        }
        
        vr_env._handle_grab_interaction("user_001", "obj_001", data)
        
        # Check user is holding object
        assert test_user.held_objects.get('right') == "obj_001"
        
        # Check object state
        assert test_object.state['grabbed'] == True
        assert test_object.state['grabbed_by'] == "user_001"
        assert test_object.state['grab_hand'] == 'right'
    
    def test_grab_non_grabbable_object(self, vr_env, test_user, test_object):
        """Test grabbing a non-grabbable object"""
        test_object.properties['grabbable'] = False
        
        data = {'hand': 'right', 'hand_position': (1, 0, 0)}
        vr_env._handle_grab_interaction("user_001", "obj_001", data)
        
        # Should not be grabbed
        assert test_user.held_objects.get('right') is None
        assert not test_object.state.get('grabbed', False)
    
    def test_touch_interaction(self, vr_env, test_user, test_object):
        """Test touch interaction"""
        data = {
            'touch_point': (1, 0, 0),
            'force': 0.8,
            'timestamp': '2024-01-01T00:00:00'
        }
        
        vr_env._handle_touch_interaction("user_001", "obj_001", data)
        
        # Check object was touched
        assert test_object.state['touched'] == True
        assert test_object.state['last_touch']['user_id'] == "user_001"
        assert test_object.state['last_touch']['force'] == 0.8
    
    def test_touch_button(self, vr_env, test_user):
        """Test touching a button"""
        button = VirtualObject(
            object_id="button_001",
            object_type="button",
            position=(1, 0, 0),
            properties={'touchable': True}
        )
        vr_env.virtual_objects["button_001"] = button
        
        data = {'touch_point': (1, 0, 0), 'force': 1.0}
        vr_env._handle_touch_interaction("user_001", "button_001", data)
        
        # Button should be activated
        assert button.state.get('activated', False)
        assert button.state.get('activated_by') == "user_001"
    
    def test_voice_interaction(self, vr_env, test_user):
        """Test voice interaction"""
        assistant = VirtualObject(
            object_id="assistant_001",
            object_type="virtual_assistant",
            position=(2, 0, 0),
            properties={'voice_enabled': True}
        )
        vr_env.virtual_objects["assistant_001"] = assistant
        
        data = {
            'command': 'show schedule',
            'confidence': 0.95,
            'timestamp': '2024-01-01T00:00:00'
        }
        
        vr_env._handle_voice_interaction("user_001", "assistant_001", data)
        
        # Check command was processed
        assert 'last_voice_command' in assistant.state
        assert assistant.state['last_voice_command']['command'] == 'show schedule'
        assert assistant.state['last_voice_command']['confidence'] == 0.95
    
    def test_voice_low_confidence(self, vr_env, test_user):
        """Test voice interaction with low confidence"""
        assistant = VirtualObject(
            object_id="assistant_002",
            object_type="virtual_assistant",
            position=(2, 0, 0),
            properties={'voice_enabled': True}
        )
        vr_env.virtual_objects["assistant_002"] = assistant
        
        data = {
            'command': 'unclear command',
            'confidence': 0.5,  # Low confidence
            'timestamp': '2024-01-01T00:00:00'
        }
        
        vr_env._handle_voice_interaction("user_001", "assistant_002", data)
        
        # Low confidence commands should not be processed
        assert 'last_voice_command' not in assistant.state
    
    def test_gesture_interaction_swipe(self, vr_env, test_user, test_object):
        """Test gesture interaction - swipe"""
        test_object.properties['gesture_enabled'] = True
        initial_rotation = test_object.rotation
        
        data = {
            'gesture_type': 'swipe_right',
            'confidence': 0.9,
            'timestamp': '2024-01-01T00:00:00'
        }
        
        vr_env._handle_gesture_interaction("user_001", "obj_001", data)
        
        # Object should be rotated
        assert test_object.rotation[1] == initial_rotation[1] + 90
        assert 'last_gesture' in test_object.state
    
    def test_gesture_interaction_pinch(self, vr_env, test_user, test_object):
        """Test gesture interaction - pinch to scale"""
        test_object.properties['gesture_enabled'] = True
        initial_scale = test_object.scale
        
        data = {
            'gesture_type': 'pinch',
            'confidence': 0.85,
            'timestamp': '2024-01-01T00:00:00'
        }
        
        vr_env._handle_gesture_interaction("user_001", "obj_001", data)
        
        # Object should be scaled down
        assert test_object.scale[0] == initial_scale[0] * 0.5
    
    def test_proximity_interaction_enter(self, vr_env, test_user):
        """Test proximity interaction - entering range"""
        info_panel = VirtualObject(
            object_id="panel_001",
            object_type="info_panel",
            position=(1.5, 0, 0),  # Close to user at (0,0,0)
            properties={'proximity_enabled': True, 'proximity_threshold': 2.0}
        )
        vr_env.virtual_objects["panel_001"] = info_panel
        
        data = {
            'distance': 1.5,
            'timestamp': '2024-01-01T00:00:00'
        }
        
        vr_env._handle_proximity_interaction("user_001", "panel_001", data)
        
        # User should be marked as nearby
        assert info_panel.state['user_nearby'] == True
        assert info_panel.state['nearest_user'] == "user_001"
        assert info_panel.state['display_info'] == True  # Info panel auto-displays
    
    def test_proximity_interaction_exit(self, vr_env, test_user):
        """Test proximity interaction - leaving range"""
        info_panel = VirtualObject(
            object_id="panel_002",
            object_type="info_panel",
            position=(5, 0, 0),  # Far from user
            properties={'proximity_enabled': True, 'proximity_threshold': 2.0}
        )
        info_panel.state['user_nearby'] = True  # Was nearby
        info_panel.state['display_info'] = True
        vr_env.virtual_objects["panel_002"] = info_panel
        
        data = {
            'distance': 5.0,  # Beyond threshold
            'timestamp': '2024-01-01T00:00:00'
        }
        
        vr_env._handle_proximity_interaction("user_001", "panel_002", data)
        
        # User should no longer be nearby
        assert info_panel.state['user_nearby'] == False
        assert info_panel.state['display_info'] == False  # Info hidden
    
    def test_calculate_distance(self, vr_env):
        """Test distance calculation"""
        pos1 = (0, 0, 0)
        pos2 = (3, 4, 0)
        
        distance = vr_env._calculate_distance(pos1, pos2)
        
        # Should be 5 (3-4-5 triangle)
        assert distance == 5.0
    
    def test_rotate_object(self, vr_env, test_object):
        """Test object rotation"""
        initial_rotation = test_object.rotation
        
        vr_env._rotate_object("obj_001", 45)
        
        assert test_object.rotation[1] == initial_rotation[1] + 45
    
    def test_scale_object(self, vr_env, test_object):
        """Test object scaling"""
        initial_scale = test_object.scale
        
        vr_env._scale_object("obj_001", 2.0)
        
        assert test_object.scale[0] == initial_scale[0] * 2.0
        assert test_object.scale[1] == initial_scale[1] * 2.0
        assert test_object.scale[2] == initial_scale[2] * 2.0
    
    def test_highlight_object(self, vr_env, test_object):
        """Test object highlighting"""
        vr_env._highlight_object("obj_001")
        
        assert test_object.state['highlighted'] == True
    
    def test_activate_object(self, vr_env, test_object):
        """Test object activation"""
        vr_env._activate_object("obj_001")
        
        assert test_object.state['active'] == True