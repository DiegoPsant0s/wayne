from typing import Pattern
from pydantic import BaseModel, field_validator, Field

class ResourceIn(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    status: str
    type: str = ""
    description: str = ""

    @field_validator("status", mode="before")
    @classmethod
    def status_must_be_valid(cls, v):
        allowed = {"active", "maintenance", "inactive"}
        if isinstance(v, str):
            v_low = v.lower()
        else:
            raise ValueError("Status deve ser uma string válida")
        if v_low not in allowed:
            raise ValueError(f"Status deve ser um dos: {', '.join(allowed)}")
        return v_low

class ResourceOut(ResourceIn):
    id: int