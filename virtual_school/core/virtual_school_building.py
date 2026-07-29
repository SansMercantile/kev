"""
🏫 Virtual International School - Main Building Structure
Metaverse-ready 3D school environment with VR/AR compatibility
"""

import json
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum

class FacilityType(Enum):
    CLASSROOM = "classroom"
    LECTURE_HALL = "lecture_hall"
    LABORATORY = "laboratory"
    LIBRARY = "library"
    GYMNASIUM = "gymnasium"
    MUSIC_ROOM = "music_room"
    ART_STUDIO = "art_studio"
    COMPUTER_LAB = "computer_lab"
    CAFETERIA = "cafeteria"
    OFFICE = "office"
    COMMON_AREA = "common_area"
    AUDITORIUM = "auditorium"

class BuildingLevel(Enum):
    BASEMENT = "basement"
    GROUND = "ground"
    FIRST = "first"
    SECOND = "second"
    THIRD = "third"
    ROOF = "roof"

@dataclass
class VirtualFacility:
    """Individual facility within the virtual school"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    facility_type: FacilityType = FacilityType.CLASSROOM
    level: BuildingLevel = BuildingLevel.GROUND
    capacity: int = 30
    coordinates: Tuple[float, float, float] = (0.0, 0.0, 0.0)
    dimensions: Tuple[float, float, float] = (10.0, 3.0, 8.0)  # width, height, depth
    equipment: List[str] = field(default_factory=list)
    virtual_tools: List[str] = field(default_factory=list)
    is_booked: bool = False
    current_session: Optional[str] = None
    accessibility_features: List[str] = field(default_factory=list)
    environmental_settings: Dict = field(default_factory=dict)
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'name': self.name,
            'facility_type': self.facility_type.value,
            'level': self.level.value,
            'capacity': self.capacity,
            'coordinates': self.coordinates,
            'dimensions': self.dimensions,
            'equipment': self.equipment,
            'virtual_tools': self.virtual_tools,
            'is_booked': self.is_booked,
            'current_session': self.current_session,
            'accessibility_features': self.accessibility_features,
            'environmental_settings': self.environmental_settings
        }

@dataclass
class VirtualSchoolBuilding:
    """Complete virtual school building with all facilities"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = "KEV International Virtual School"
    address: str = "Metaverse Education District, Block 1"
    total_facilities: int = 0
    facilities: Dict[str, VirtualFacility] = field(default_factory=dict)
    building_layout: Dict = field(default_factory=dict)
    environmental_controls: Dict = field(default_factory=dict)
    safety_systems: Dict = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.now)
    
    def __post_init__(self):
        if not self.facilities:
            self._initialize_school_facilities()
    
    def _initialize_school_facilities(self):
        """Initialize all school facilities with proper layout"""
        
        # Ground Floor - Main entrance and common areas
        ground_floor_facilities = [
            VirtualFacility(
                name="Main Entrance Hall",
                facility_type=FacilityType.COMMON_AREA,
                level=BuildingLevel.GROUND,
                capacity=200,
                coordinates=(0, 0, 0),
                dimensions=(20, 4, 15),
                accessibility_features=["wheelchair_ramp", "elevator", "braille_signs"],
                environmental_settings={"lighting": "natural", "temperature": 22}
            ),
            VirtualFacility(
                name="Reception Office",
                facility_type=FacilityType.OFFICE,
                level=BuildingLevel.GROUND,
                capacity=5,
                coordinates=(-5, 0, 2),
                dimensions=(6, 3, 4),
                equipment=["virtual_computer", "communication_system", "student_database"]
            ),
            VirtualFacility(
                name="Main Cafeteria",
                facility_type=FacilityType.CAFETERIA,
                level=BuildingLevel.GROUND,
                capacity=300,
                coordinates=(10, 0, 5),
                dimensions=(25, 3, 20),
                virtual_tools=["virtual_menu", "nutrition_tracker", "dietary_preferences"]
            ),
            VirtualFacility(
                name="School Library",
                facility_type=FacilityType.LIBRARY,
                level=BuildingLevel.GROUND,
                capacity=150,
                coordinates=(-10, 0, 8),
                dimensions=(30, 3, 25),
                virtual_tools=["digital_catalog", "e_book_reader", "research_database", "virtual_librarian"]
            )
        ]
        
        # First Floor - Primary classrooms
        first_floor_facilities = [
            VirtualFacility(
                name="Mathematics Classroom A",
                facility_type=FacilityType.CLASSROOM,
                level=BuildingLevel.FIRST,
                capacity=25,
                coordinates=(5, 4, 5),
                dimensions=(8, 3, 8),
                equipment=["smart_board", "virtual_calculator", "graphing_tools"],
                virtual_tools=["mathematica", "geogebra", "coding_environment"]
            ),
            VirtualFacility(
                name="Science Laboratory A",
                facility_type=FacilityType.LABORATORY,
                level=BuildingLevel.FIRST,
                capacity=20,
                coordinates=(-5, 4, 5),
                dimensions=(12, 3, 10),
                equipment=["virtual_microscope", "chemistry_set", "physics_apparatus"],
                virtual_tools=["lab_simulation", "data_analysis", "safety_protocols"]
            ),
            VirtualFacility(
                name="Computer Lab A",
                facility_type=FacilityType.COMPUTER_LAB,
                level=BuildingLevel.FIRST,
                capacity=30,
                coordinates=(10, 4, -5),
                dimensions=(15, 3, 12),
                equipment=["virtual_computers", "servers", "networking_equipment"],
                virtual_tools=["coding_ide", "virtual_machines", "cloud_platforms"]
            )
        ]
        
        # Second Floor - Arts and music
        second_floor_facilities = [
            VirtualFacility(
                name="Music Room A",
                facility_type=FacilityType.MUSIC_ROOM,
                level=BuildingLevel.SECOND,
                capacity=25,
                coordinates=(0, 8, 5),
                dimensions=(12, 3, 10),
                equipment=["virtual_piano", "virtual_guitar", "recording_equipment"],
                virtual_tools=["music_composition", "audio_editing", "instrument_simulator"]
            ),
            VirtualFacility(
                name="Art Studio A",
                facility_type=FacilityType.ART_STUDIO,
                level=BuildingLevel.SECOND,
                capacity=20,
                coordinates=(-10, 8, 5),
                dimensions=(15, 3, 12),
                equipment=["virtual_canvas", "digital_brushes", "3d_modeling_tools"],
                virtual_tools=["drawing_software", "color_palette", "art_history_database"]
            ),
            VirtualFacility(
                name="Dance Studio",
                facility_type=FacilityType.COMMON_AREA,
                level=BuildingLevel.SECOND,
                capacity=40,
                coordinates=(10, 8, -5),
                dimensions=(20, 4, 15),
                equipment=["mirrors", "sound_system", "flooring"],
                virtual_tools=["choreography_software", "movement_tracking", "performance_recording"]
            )
        ]
        
        # Third Floor - Lecture halls and auditoriums
        third_floor_facilities = [
            VirtualFacility(
                name="Main Auditorium",
                facility_type=FacilityType.AUDITORIUM,
                level=BuildingLevel.THIRD,
                capacity=500,
                coordinates=(0, 12, 0),
                dimensions=(30, 6, 25),
                equipment=["stage", "sound_system", "lighting", "projection"],
                virtual_tools=["presentation_software", "live_streaming", "audience_interaction"]
            ),
            VirtualFacility(
                name="Lecture Hall A",
                facility_type=FacilityType.LECTURE_HALL,
                level=BuildingLevel.THIRD,
                capacity=200,
                coordinates=(-15, 12, 10),
                dimensions=(20, 4, 18),
                equipment=["lecture_podium", "projection_system", "microphone"],
                virtual_tools=["lecture_recording", "student_response_system", "digital_whiteboard"]
            )
        ]
        
        # Basement - Gymnasium and sports
        basement_facilities = [
            VirtualFacility(
                name="Main Gymnasium",
                facility_type=FacilityType.GYMNASIUM,
                level=BuildingLevel.BASEMENT,
                capacity=300,
                coordinates=(0, -3, 0),
                dimensions=(40, 8, 30),
                equipment=["sports_equipment", "scoreboard", "sound_system"],
                virtual_tools=["fitness_tracking", "sports_simulation", "performance_analysis"]
            ),
            VirtualFacility(
                name="Swimming Pool (Virtual)",
                facility_type=FacilityType.COMMON_AREA,
                level=BuildingLevel.BASEMENT,
                capacity=50,
                coordinates=(20, -3, 15),
                dimensions=(25, 4, 15),
                virtual_tools=["swimming_simulation", "water_physics", "safety_training"]
            )
        ]
        
        # Add all facilities to the building
        all_facilities = (ground_floor_facilities + first_floor_facilities + 
                         second_floor_facilities + third_floor_facilities + basement_facilities)
        
        for facility in all_facilities:
            self.facilities[facility.id] = facility
        
        self.total_facilities = len(self.facilities)
        
        # Create building layout mapping
        self._create_building_layout()
    
    def _create_building_layout(self):
        """Create a comprehensive building layout map"""
        self.building_layout = {
            "entrance": {"coordinates": (0, 0, 0), "description": "Main entrance hall"},
            "emergency_exits": [
                {"coordinates": (-20, 0, -10), "level": BuildingLevel.GROUND},
                {"coordinates": (20, 0, -10), "level": BuildingLevel.GROUND},
                {"coordinates": (0, 12, -25), "level": BuildingLevel.THIRD}
            ],
            "elevators": [
                {"coordinates": (2, 0, -2), "levels": [BuildingLevel.BASEMENT, BuildingLevel.GROUND, 
                                                       BuildingLevel.FIRST, BuildingLevel.SECOND, BuildingLevel.THIRD]}
            ],
            "stairs": [
                {"coordinates": (-2, 0, -2), "levels": [BuildingLevel.GROUND, BuildingLevel.FIRST, 
                                                       BuildingLevel.SECOND, BuildingLevel.THIRD]},
                {"coordinates": (18, 0, -18), "levels": [BuildingLevel.GROUND, BuildingLevel.FIRST, 
                                                        BuildingLevel.SECOND, BuildingLevel.THIRD]}
            ],
            "accessibility_features": {
                "wheelchair_accessible": True,
                "braille_signs": True,
                "audio_assistance": True,
                "visual_alerts": True
            }
        }
    
    def get_facility_by_type(self, facility_type: FacilityType) -> List[VirtualFacility]:
        """Get all facilities of a specific type"""
        return [facility for facility in self.facilities.values() 
                if facility.facility_type == facility_type]
    
    def get_available_facilities(self, level: Optional[BuildingLevel] = None) -> List[VirtualFacility]:
        """Get all available (not booked) facilities"""
        available = [facility for facility in self.facilities.values() 
                    if not facility.is_booked]
        if level:
            available = [facility for facility in available if facility.level == level]
        return available
    
    def book_facility(self, facility_id: str, session_id: str) -> bool:
        """Book a facility for a specific session"""
        if facility_id in self.facilities:
            facility = self.facilities[facility_id]
            if not facility.is_booked:
                facility.is_booked = True
                facility.current_session = session_id
                return True
        return False
    
    def release_facility(self, facility_id: str) -> bool:
        """Release a booked facility"""
        if facility_id in self.facilities:
            facility = self.facilities[facility_id]
            facility.is_booked = False
            facility.current_session = None
            return True
        return False
    
    def get_building_statistics(self) -> dict:
        """Get comprehensive building statistics"""
        stats = {
            "total_facilities": self.total_facilities,
            "facilities_by_type": {},
            "facilities_by_level": {},
            "booked_facilities": 0,
            "available_facilities": 0,
            "accessibility_compliance": True
        }
        
        # Count by type
        for facility_type in FacilityType:
            count = len(self.get_facility_by_type(facility_type))
            stats["facilities_by_type"][facility_type.value] = count
        
        # Count by level
        for level in BuildingLevel:
            count = len([f for f in self.facilities.values() if f.level == level])
            stats["facilities_by_level"][level.value] = count
        
        # Count availability
        booked = len([f for f in self.facilities.values() if f.is_booked])
        available = len([f for f in self.facilities.values() if not f.is_booked])
        stats["booked_facilities"] = booked
        stats["available_facilities"] = available
        
        return stats
    
    def export_building_data(self) -> dict:
        """Export complete building data for VR/AR applications"""
        return {
            "building_info": {
                "id": self.id,
                "name": self.name,
                "address": self.address,
                "total_facilities": self.total_facilities,
                "created_at": self.created_at.isoformat()
            },
            "facilities": {fid: facility.to_dict() for fid, facility in self.facilities.items()},
            "building_layout": self.building_layout,
            "environmental_controls": self.environmental_controls,
            "safety_systems": self.safety_systems,
            "statistics": self.get_building_statistics()
        }

# Example usage and testing
if __name__ == "__main__":
    # Create the virtual school building
    school = VirtualSchoolBuilding()
    
    # Print building statistics
    stats = school.get_building_statistics()
    print(f"🏫 {school.name}")
    print(f"📊 Total Facilities: {stats['total_facilities']}")
    print(f"📚 Available Facilities: {stats['available_facilities']}")
    print(f"🔒 Booked Facilities: {stats['booked_facilities']}")
    
    # Show facilities by type
    print("\n🏢 Facilities by Type:")
    for facility_type, count in stats['facilities_by_type'].items():
        print(f"  {facility_type}: {count}")
    
    # Show facilities by level
    print("\n🏢 Facilities by Level:")
    for level, count in stats['facilities_by_level'].items():
        print(f"  {level}: {count}")