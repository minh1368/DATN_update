from pydantic import BaseModel
from typing import List

class MonthlyRevenue(BaseModel):
    month: str
    revenue: float

class DashboardStats(BaseModel):
    total_revenue: float
    total_contracts: int
    total_cars: int
    cars_rented: int
    usage_rate: float
    monthly_revenue: List[MonthlyRevenue]
