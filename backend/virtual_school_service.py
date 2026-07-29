from typing import Dict, List, Optional

from fastapi import HTTPException
from pydantic import BaseModel

from kev.virtual_school.core.virtual_school_building import VirtualSchoolBuilding

virtual_school = VirtualSchoolBuilding()


class BookingRequest(BaseModel):
    session_id: str


def facility_to_dict(facility):
    return facility.to_dict()


def list_facilities(only_available: bool = False, facility_type: Optional[str] = None):
    facilities = [facility for facility in virtual_school.facilities.values()]
    if only_available:
        facilities = [facility for facility in facilities if not facility.is_booked]
    if facility_type:
        facilities = [facility for facility in facilities if facility.facility_type.value == facility_type]
    return [facility_to_dict(facility) for facility in facilities]


def get_overview() -> Dict:
    data = virtual_school.export_building_data()
    return {
        "building_info": data["building_info"],
        "statistics": data["statistics"],
        "accessibility": data["building_info"].get("accessibility_compliance", True),
    }


def book_facility(facility_id: str, session_id: str) -> Dict:
    if facility_id not in virtual_school.facilities:
        raise HTTPException(status_code=404, detail="Facility not found")

    booked = virtual_school.book_facility(facility_id, session_id)
    if not booked:
        raise HTTPException(status_code=400, detail="Facility already booked or unavailable")

    return {
        "status": "success",
        "facility_id": facility_id,
        "session_id": session_id,
        "current_session": virtual_school.facilities[facility_id].current_session,
    }


def release_facility(facility_id: str) -> Dict:
    if facility_id not in virtual_school.facilities:
        raise HTTPException(status_code=404, detail="Facility not found")

    virtual_school.release_facility(facility_id)
    return {
        "status": "success",
        "facility_id": facility_id,
        "booked": virtual_school.facilities[facility_id].is_booked,
    }
