from pydantic import BaseModel
from typing import List

class ResourceOut(BaseModel):
    id: int
    name: str
    description: str

class DashboardResponse(BaseModel):
    user: str
    role: str
    resources: List[ResourceOut]

class SummaryStatus(BaseModel):
    active: int
    maintenance: int
    inactive: int

class SummaryRoles(BaseModel):
    empregado: int
    gerente: int
    admin: int

class DashboardSummaryResponse(BaseModel):
    total_resources: int
    resources_status: SummaryStatus
    users_by_role: SummaryRoles