"""
🧪 KEV System Comprehensive Testing Suite
Complete testing framework for virtual school, identity system, and VR integration
"""

import pytest
import json
import asyncio
from datetime import datetime, date, timedelta
from typing import Dict, List, Tuple
import uuid
import tempfile
import os
from pathlib import Path

# Import all our modules
from virtual_school.core.virtual_school_building import VirtualSchoolBuilding, FacilityType
from virtual_school.vr_ar.vr_school_environment import VRSchoolEnvironment, VRPlatform
from virtual_school.identity.student_identity_system import StudentIdentitySystem, StudentIdentity

class TestVirtualSchoolBuilding:
    """Test cases for virtual school building system"""
    
    def test_building_initialization(self):
        """Test virtual school building initialization"""
        building = VirtualSchoolBuilding()
        
        assert building.name == "KEV International Virtual School"
        assert building.total_facilities > 0
        assert len(building.facilities) == building.total_facilities
    
    def test_facility_types(self):
        """Test facility type categorization"""
        building = VirtualSchoolBuilding()
        
        # Check that we have facilities of different types
        classrooms = building.get_facility_by_type(FacilityType.CLASSROOM)
        libraries = building.get_facility_by_type(FacilityType.LIBRARY)
        laboratories = building.get_facility_by_type(FacilityType.LABORATORY)
        
        assert len(classrooms) > 0
        assert len(libraries) > 0
        assert len(laboratories) > 0
    
    def test_facility_booking(self):
        """Test facility booking system"""
        building = VirtualSchoolBuilding()
        
        # Get an available facility
        available = building.get_available_facilities()
        assert len(available) > 0
        
        facility = available[0]
        
        # Book the facility
        success = building.book_facility(facility.id, "test_session_123")
        assert success is True
        
        # Check it's no longer available
        available_after = building.get_available_facilities()
        assert facility.id not in [f.id for f in available_after]
        
        # Release the facility
        success = building.release_facility(facility.id)
        assert success is True
        
        # Check it's available again
        available_final = building.get_available_facilities()
        assert facility.id in [f.id for f in available_final]
    
    def test_building_statistics(self):
        """Test building statistics generation"""
        building = VirtualSchoolBuilding()
        stats = building.get_building_statistics()
        
        assert 'total_facilities' in stats
        assert 'facilities_by_type' in stats
        assert 'facilities_by_level' in stats
        assert 'booked_facilities' in stats
        assert 'available_facilities' in stats
        
        assert stats['total_facilities'] > 0
        assert sum(stats['facilities_by_type'].values()) == stats['total_facilities']
        assert sum(stats['facilities_by_level'].values()) == stats['total_facilities']
    
    def test_building_data_export(self):
        """Test building data export functionality"""
        building = VirtualSchoolBuilding()
        data = building.export_building_data()
        
        assert 'building_info' in data
        assert 'facilities' in data
        assert 'building_layout' in data
        assert 'statistics' in data
        
        assert len(data['facilities']) == building.total_facilities

class TestVRSchoolEnvironment:
    """Test cases for VR school environment"""
    
    def test_vr_environment_initialization(self):
        """Test VR environment initialization"""
        vr_env = VRSchoolEnvironment()
        
        assert len(vr_env.users) == 0
        assert len(vr_env.virtual_objects) == 0
        assert len(vr_env.active_sessions) == 0
    
    def test_user_management(self):
        """Test user management in VR environment"""
        vr_env = VRSchoolEnvironment()
        
        # Add user
        user = vr_env.add_user("test_student", VRPlatform.OCULUS)
        assert user.username == "test_student"
        assert user.platform == VRPlatform.OCULUS
        assert user.id in vr_env.users
        
        # Remove user
        success = vr_env.remove_user(user.id)
        assert success is True
        assert user.id not in vr_env.users
    
    def test_session_management(self):
        """Test VR session management"""
        vr_env = VRSchoolEnvironment()
        
        # Add users
        user1 = vr_env.add_user("student1", VRPlatform.OCULUS)
        user2 = vr_env.add_user("student2", VRPlatform.HTC_VIVE)
        
        # Start session
        session_id = vr_env.start_session(
            session_type="mathematics_class",
            participants=[user1.id, user2.id],
            location="Mathematics Classroom A"
        )
        
        assert session_id in vr_env.active_sessions
        assert len(vr_env.active_sessions[session_id]['participants']) == 2
        
        # End session
        success = vr_env.end_session(session_id)
        assert success is True
        assert session_id not in vr_env.active_sessions
        assert not vr_env.session_history[session_id]['active']
    
    def test_virtual_objects(self):
        """Test virtual object creation and management"""
        vr_env = VRSchoolEnvironment()
        
        # Create object
        obj = vr_env.create_virtual_object(
            name="Test Whiteboard",
            object_type="display_device",
            position=(0, 1.5, -2),
            interaction_scripts=["write", "erase"]
        )
        
        assert obj.name == "Test Whiteboard"
        assert obj.id in vr_env.virtual_objects
        assert len(obj.interaction_scripts) == 2
    
    def test_user_movement(self):
        """Test user movement in VR space"""
        vr_env = VRSchoolEnvironment()
        
        user = vr_env.add_user("test_user", VRPlatform.WEB_VR)
        
        # Move user
        success = vr_env.move_user(user.id, (1, 2, 3), (0, 90, 0))
        assert success is True
        
        # Check position
        assert vr_env.users[user.id].position == (1, 2, 3)
        assert vr_env.users[user.id].rotation == (0, 90, 0)
    
    def test_platform_capabilities(self):
        """Test platform-specific capabilities"""
        vr_env = VRSchoolEnvironment()
        
        # Test different platforms
        platforms = [VRPlatform.OCULUS, VRPlatform.HTC_VIVE, VRPlatform.MOBILE_VR]
        
        for platform in platforms:
            user = vr_env.add_user(f"user_{platform.value}", platform)
            assert user.platform == platform
            assert len(user.device_capabilities) > 0
    
    def test_environment_state(self):
        """Test environment state reporting"""
        vr_env = VRSchoolEnvironment()
        
        # Add some data
        user = vr_env.add_user("test_user", VRPlatform.OCULUS)
        obj = vr_env.create_virtual_object("Test Object", "test_type", (0, 0, 0))
        
        state = vr_env.get_environment_state()
        
        assert 'environment_settings' in state
        assert 'active_users' in state
        assert 'virtual_objects' in state
        assert len(state['active_users']) == 1
        assert len(state['virtual_objects']) == 1

class TestStudentIdentitySystem:
    """Test cases for student identity and KYC system"""
    
    def test_student_creation(self):
        """Test student identity creation"""
        system = StudentIdentitySystem()
        
        application_data = {
            'first_name': 'Test',
            'last_name': 'Student',
            'date_of_birth': '2010-05-15',
            'gender': 'male',
            'nationality': 'US',
            'country_of_residence': 'US',
            'email': 'test.student@email.com'
        }
        
        success, message, student = system.create_student_application(application_data)
        
        assert success is True
        assert student is not None
        assert student.first_name == 'Test'
        assert student.last_name == 'Student'
    
    def test_application_validation(self):
        """Test application data validation"""
        system = StudentIdentitySystem()
        
        # Test missing required fields
        invalid_data = {'first_name': 'Test'}  # Missing required fields
        success, message, student = system.create_student_application(invalid_data)
        
        assert success is False
        assert student is None
        assert "Missing required fields" in message
    
    def test_email_validation(self):
        """Test email format validation"""
        system = StudentIdentitySystem()
        
        # Test invalid email
        invalid_data = {
            'first_name': 'Test',
            'last_name': 'Student',
            'date_of_birth': '2010-05-15',
            'gender': 'male',
            'nationality': 'US',
            'country_of_residence': 'US',
            'email': 'invalid-email'
        }
        
        success, message, student = system.create_student_application(invalid_data)
        
        assert success is False
        assert "Invalid email format" in message
    
    def test_age_validation(self):
        """Test age-based validation"""
        system = StudentIdentitySystem()
        
        # Test too young - computed relative to today so this test doesn't
        # silently rot as real time passes (US min_age is 5; 2 years old
        # is always too young, unlike a fixed historical date-of-birth).
        too_young_dob = (date.today() - timedelta(days=365 * 2)).isoformat()
        invalid_data = {
            'first_name': 'Test',
            'last_name': 'Student',
            'date_of_birth': too_young_dob,
            'gender': 'male',
            'nationality': 'US',
            'country_of_residence': 'US',
            'email': 'test@email.com'
        }
        
        success, message, student = system.create_student_application(invalid_data)
        
        assert success is False
        assert "must be at least" in message
    
    def test_photo_capture(self):
        """Test photo capture system"""
        system = StudentIdentitySystem()
        
        # Create student
        application_data = {
            'first_name': 'Test',
            'last_name': 'Student',
            'date_of_birth': '2010-05-15',
            'gender': 'male',
            'nationality': 'US',
            'country_of_residence': 'US',
            'email': 'test.student@email.com'
        }
        
        success, message, student = system.create_student_application(application_data)
        assert success is True
        
        # Capture photos
        photos_data = [{'image_data': f'photo_{i}_data'} for i in range(5)]
        success, message = system.capture_student_photos(student.id, photos_data)
        
        assert success is True
        assert len(student.profile_photos) == 5
    
    def test_photo_selection(self):
        """Test photo selection system"""
        system = StudentIdentitySystem()
        
        # Create student and capture photos
        application_data = {
            'first_name': 'Test',
            'last_name': 'Student',
            'date_of_birth': '2010-05-15',
            'gender': 'male',
            'nationality': 'US',
            'country_of_residence': 'US',
            'email': 'test.student@email.com'
        }
        
        success, message, student = system.create_student_application(application_data)
        system.capture_student_photos(student.id, [{'image_data': f'photo_{i}_data'} for i in range(5)])
        
        # Select photo
        selected_photo_id = student.profile_photos[0]['id']
        success, message = system.select_profile_photo(student.id, selected_photo_id)
        
        assert success is True
        assert student.selected_photo_id == selected_photo_id
    
    def test_identity_verification(self):
        """Test identity document verification"""
        system = StudentIdentitySystem()
        
        # Create student
        application_data = {
            'first_name': 'Test',
            'last_name': 'Student',
            'date_of_birth': '2010-05-15',
            'gender': 'male',
            'nationality': 'US',
            'country_of_residence': 'US',
            'email': 'test.student@email.com'
        }
        
        success, message, student = system.create_student_application(application_data)
        
        # Verify documents
        documents = [
            {'id': str(uuid.uuid4()), 'type': 'birth_certificate', 'data': 'test_data'},
            {'id': str(uuid.uuid4()), 'type': 'immunization_records', 'data': 'test_data'}
        ]
        
        success, message = system.verify_identity_documents(student.id, documents)
        assert success is True
    
    def test_enrollment_finalization(self):
        """Test student enrollment finalization"""
        system = StudentIdentitySystem()
        
        # Create student and complete all steps
        application_data = {
            'first_name': 'Test',
            'last_name': 'Student',
            'date_of_birth': '2010-05-15',
            'gender': 'male',
            'nationality': 'US',
            'country_of_residence': 'US',
            'email': 'test.student@email.com'
        }
        
        success, message, student = system.create_student_application(application_data)
        
        # Complete all verification steps
        system.capture_student_photos(student.id, [{'image_data': f'photo_{i}_data'} for i in range(5)])
        system.select_profile_photo(student.id, student.profile_photos[0]['id'])
        
        documents = [{'id': str(uuid.uuid4()), 'type': 'birth_certificate', 'data': 'test_data'}]
        system.verify_identity_documents(student.id, documents)
        system.perform_background_check(student.id)
        
        # Finalize enrollment
        success, message = system.finalize_enrollment(student.id)
        
        assert success is True
        assert student.status.value == 'enrolled'
        assert student.enrollment_date is not None
    
    def test_system_statistics(self):
        """Test system statistics generation"""
        system = StudentIdentitySystem()
        
        # Create multiple students
        for i in range(5):
            application_data = {
                'first_name': f'Student{i}',
                'last_name': f'Last{i}',
                'date_of_birth': '2010-05-15',
                'gender': 'male',
                'nationality': 'US',
                'country_of_residence': 'US',
                'email': f'student{i}@email.com'
            }
            system.create_student_application(application_data)
        
        stats = system.get_system_statistics()
        
        assert 'total_applications' in stats
        assert 'status_distribution' in stats
        assert 'verification_distribution' in stats
        assert stats['total_applications'] == 5
    
    def test_student_summary(self):
        """Test student summary generation"""
        system = StudentIdentitySystem()
        
        application_data = {
            'first_name': 'Test',
            'last_name': 'Student',
            'date_of_birth': '2010-05-15',
            'gender': 'male',
            'nationality': 'US',
            'country_of_residence': 'US',
            'email': 'test.student@email.com'
        }
        
        success, message, student = system.create_student_application(application_data)
        
        summary = system.get_student_summary(student.id)
        
        assert summary is not None
        assert 'basic_info' in summary
        assert 'verification_status' in summary
        assert 'avatar_info' in summary
        assert summary['basic_info']['full_name'] == 'Test Student'

class TestSystemIntegration:
    """Integration tests for the complete system"""
    
    def test_full_student_journey(self):
        """Test complete student onboarding journey"""
        # Initialize all systems
        building = VirtualSchoolBuilding()
        vr_env = VRSchoolEnvironment()
        identity_system = StudentIdentitySystem()
        
        # Step 1: Create student application
        application_data = {
            'first_name': 'Alexandra',
            'last_name': 'Martinez',
            'date_of_birth': '2008-09-15',
            'gender': 'female',
            'nationality': 'US',
            'country_of_residence': 'US',
            'email': 'alexandra.martinez@email.com',
            'phone': '+1-555-987-6543',
            'current_grade': '10',
            'previous_school': 'Jefferson High School',
            'address': {
                'street': '456 Oak Avenue',
                'city': 'Los Angeles',
                'state': 'CA',
                'zip_code': '90210',
                'country': 'US'
            }
        }
        
        success, message, student = identity_system.create_student_application(application_data)
        assert success is True
        
        # Step 2: Capture and select photos
        photos_data = [{'image_data': f'photo_{i}_data'} for i in range(5)]
        success, message = identity_system.capture_student_photos(student.id, photos_data)
        assert success is True
        
        success, message = identity_system.select_profile_photo(student.id, student.profile_photos[0]['id'])
        assert success is True
        
        # Step 3: Verify identity documents
        documents = [
            {'id': str(uuid.uuid4()), 'type': 'birth_certificate', 'data': 'test_certificate_data'},
            {'id': str(uuid.uuid4()), 'type': 'immunization_records', 'data': 'test_immunization_data'}
        ]
        
        success, message = identity_system.verify_identity_documents(student.id, documents)
        assert success is True
        
        # Step 4: Background check
        success, message = identity_system.perform_background_check(student.id)
        assert success is True
        
        # Step 5: Finalize enrollment
        success, message = identity_system.finalize_enrollment(student.id)
        assert success is True
        
        # Step 6: Add to VR environment
        vr_user = vr_env.add_user(
            username=student.student_id,
            platform=VRPlatform.OCULUS,
            avatar_id=student.enhanced_avatar_id
        )
        
        assert vr_user is not None
        assert vr_user.username == student.student_id
        
        # Step 7: Book a classroom
        available_classrooms = building.get_available_facilities()
        classroom = next(f for f in available_classrooms if f.facility_type == FacilityType.CLASSROOM)
        
        success = building.book_facility(classroom.id, f"class_session_{student.id}")
        assert success is True
        
        # Verify complete journey
        assert student.status.value == 'enrolled'
        assert student.enrollment_date is not None
        assert student.enhanced_avatar_id is not None
        assert student.selected_photo_id is not None

class TestPerformanceAndLoad:
    """Performance and load testing"""
    
    def test_large_scale_user_creation(self):
        """Test creating many students"""
        identity_system = StudentIdentitySystem()
        
        # Create 100 students
        for i in range(100):
            application_data = {
                'first_name': f'Student{i}',
                'last_name': f'LastName{i}',
                'date_of_birth': '2010-05-15',
                'gender': 'male' if i % 2 == 0 else 'female',
                'nationality': 'US',
                'country_of_residence': 'US',
                'email': f'student{i}@test.com'
            }
            
            success, message, student = identity_system.create_student_application(application_data)
            assert success is True
        
        stats = identity_system.get_system_statistics()
        assert stats['total_applications'] == 100
    
    def test_concurrent_sessions(self):
        """Test multiple concurrent VR sessions"""
        vr_env = VRSchoolEnvironment()
        
        # Create multiple users and sessions
        users = []
        for i in range(10):
            user = vr_env.add_user(f"user_{i}", VRPlatform.OCULUS)
            users.append(user)
        
        # Create multiple sessions
        session_ids = []
        for i in range(5):
            participants = [users[i*2].id, users[i*2+1].id]
            session_id = vr_env.start_session(
                session_type="test_class",
                participants=participants,
                location=f"Classroom {i+1}"
            )
            session_ids.append(session_id)
        
        assert len(vr_env.active_sessions) == 5
        
        # End all sessions
        for session_id in session_ids:
            success = vr_env.end_session(session_id)
            assert success is True
        
        assert len(vr_env.active_sessions) == 0

def run_all_tests():
    """Run all test suites"""
    test_classes = [
        TestVirtualSchoolBuilding,
        TestVRSchoolEnvironment,
        TestStudentIdentitySystem,
        TestSystemIntegration,
        TestPerformanceAndLoad
    ]
    
    results = {
        'total_tests': 0,
        'passed_tests': 0,
        'failed_tests': 0,
        'test_details': []
    }
    
    for test_class in test_classes:
        test_instance = test_class()
        test_methods = [method for method in dir(test_instance) if method.startswith('test_')]
        
        for test_method in test_methods:
            try:
                getattr(test_instance, test_method)()
                results['passed_tests'] += 1
                results['test_details'].append({
                    'class': test_class.__name__,
                    'test': test_method,
                    'status': 'PASSED'
                })
            except Exception as e:
                results['failed_tests'] += 1
                results['test_details'].append({
                    'class': test_class.__name__,
                    'test': test_method,
                    'status': 'FAILED',
                    'error': str(e)
                })
            
            results['total_tests'] += 1
    
    return results

if __name__ == "__main__":
    # Run all tests
    print("🧪 Running KEV System Comprehensive Tests...")
    results = run_all_tests()
    
    print(f"\n📊 Test Results:")
    print(f"Total Tests: {results['total_tests']}")
    print(f"Passed: {results['passed_tests']}")
    print(f"Failed: {results['failed_tests']}")
    print(f"Success Rate: {(results['passed_tests']/results['total_tests']*100):.2f}%")
    
    # Save results to file
    with open('kev_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    if results['failed_tests'] > 0:
        print("\n❌ Some tests failed. Check kev_test_results.json for details.")
    else:
        print("\n✅ All tests passed successfully!")