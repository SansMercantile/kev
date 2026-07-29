"""
Pytest configuration
"""

import pytest


@pytest.fixture
def sample_data():
    """Sample test data"""
    return {
        "name": "Test Item",
        "description": "Test Description"
    }
