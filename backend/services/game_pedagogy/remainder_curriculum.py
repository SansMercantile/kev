import logging
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
from enum import Enum

logger = logging.getLogger(__name__)

class Sector(Enum):
    OUTER_BELT = "Sector 1: The Outer Belt (K-G2)"
    INNER_BELT = "Sector 2: The Inner Belt (G3-G5)"
    MID_WORLDS = "Sector 3: The Mid-Worlds (G6-G8)"
    ALGEBRAIC_HALO = "Sector 4: The Algebraic Halo (Algebra 1)"
    GEOMETRIC_CROWN = "Sector 5: The Geometric Crown (Geometry/Algebra 2)"
    TRIGONOMETRIC_SPIRAL = "Sector 6: The Trigonometric Spiral (Precalculus/Trig)"
    THE_CORE = "Sector 7: The Core (Calculus)"

class Station(Enum):
    HELM = "Helm"
    TACTICAL = "Tactical"
    ENGINEERING = "Engineering"
    SHIELDS = "Shields"
    SENSORS = "Sensors"
    COMMS = "Comms"
    COMMAND = "Command"

@dataclass
class Axiom:
    axiom_id: str
    name: str
    description: str
    sector: Sector
    associated_standards: List[str]
    calibration_challenges: Dict[Station, str]

@dataclass
class CrewMember:
    student_id: str
    station: Station
    mastery_level: Dict[str, float] = field(default_factory=dict) # axiom_id -> score

@dataclass
class ShipState:
    crew: List[CrewMember]
    unlocked_capabilities: List[str] = field(default_factory=list)
    current_sector: Sector = Sector.OUTER_BELT

class RemainderCurriculumService:
    """
    Implementation of the Game-Based Pedagogy: The Remainder Curriculum.
    Handles the spaceship simulator logic, Axiom recovery, and station calibration.
    """
    def __init__(self):
        self.active_ships: Dict[str, ShipState] = {}
        self.axioms: Dict[str, Axiom] = self._initialize_axioms()

    def _initialize_axioms(self) -> Dict[str, Axiom]:
        # Initial seed of Axioms based on the framework
        return {
            "linear_functions": Axiom(
                axiom_id="linear_functions",
                name="Axiom of Linear Functions",
                description="The concept of slope, the equation y = mx + b, and linear modeling.",
                sector=Sector.ALGEBRAIC_HALO,
                associated_standards=["CCSS.MATH.CONTENT.HSA.REI.B.3"],
                calibration_challenges={
                    Station.HELM: "Calculate intercept course based on linear trajectory.",
                    Station.TACTICAL: "Determine charge cycles for required damage output.",
                    Station.ENGINEERING: "Balance power conduits with different output slopes.",
                    Station.SHIELDS: "Predict shield failure time based on linear decay.",
                    Station.SENSORS: "Fit linear function to contact position data.",
                    Station.COMMS: "Decode frequency hopping pattern using linear equations.",
                    Station.COMMAND: "Optimize repair team allocation based on linear rates."
                }
            )
        }

    def create_ship(self, ship_id: str, crew_ids: List[str]) -> ShipState:
        ship = ShipState(crew=[CrewMember(sid, Station.COMMAND) for sid in crew_ids]) # Default to Command
        self.active_ships[ship_id] = ship
        logger.info(f"Created ship {ship_id} with crew {crew_ids}")
        return ship

    def assign_station(self, ship_id: str, student_id: str, station: Station):
        ship = self.active_ships.get(ship_id)
        if not ship:
            raise ValueError("Ship not found")
        for member in ship.crew:
            if member.student_id == student_id:
                member.station = station
                return
        raise ValueError("Student not in crew")

    def calibrate_station(self, ship_id: str, student_id: str, axiom_id: str, result: float) -> bool:
        ship = self.active_ships.get(ship_id)
        if not ship:
            raise ValueError("Ship not found")
        
        axiom = self.axioms.get(axiom_id)
        if not axiom:
            raise ValueError("Axiom not found")

        for member in ship.crew:
            if member.student_id == student_id:
                member.mastery_level[axiom_id] = result
                return result >= 0.8 # Mastery threshold

        raise ValueError("Student not in crew")

    def check_collective_unlock(self, ship_id: str, axiom_id: str) -> Optional[str]:
        ship = self.active_ships.get(ship_id)
        if not ship:
            return None
        
        axiom = self.axioms.get(axiom_id)
        if not axiom:
            return None

        # All crew members must pass calibration for the Axiom
        if all(member.mastery_level.get(axiom_id, 0) >= 0.8 for member in ship.crew):
            # Logic to determine which capability is unlocked based on axiom_id
            capability = f"Capability unlocked by {axiom.name}"
            ship.unlocked_capabilities.append(capability)
            return capability
        
        return None
