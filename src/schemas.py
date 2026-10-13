from typing import Literal
from pydantic import BaseModel , Field


class OrderRequest(BaseModel):
    type : Literal["new_order"]
    order_id : int
    side : Literal["Buy" , "Sell"]
    price : float = Field(gt=0.0)
    quantity : int = Field(gt=0)

class CancelRequest(BaseModel):
    type : Literal["cancel_order"]
    order_id : int
    side : Literal["Buy" , "Sell"]