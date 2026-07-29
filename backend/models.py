"""
KEV Database Models
~~~~~~~~~~~~~~~~~~

SQLAlchemy models for kev.
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()


class BaseModel(Base):
    """Base model with common fields"""
    __abstract__ = True
    
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)


class Item(BaseModel):
    """Example item model"""
    __tablename__ = "items"
    
    name = Column(String(255), nullable=False)
    description = Column(Text)
    
    def __repr__(self):
        return f"<Item(id={self.id}, name={self.name})>"
