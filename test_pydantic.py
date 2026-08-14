from pydantic import BaseModel, Field
from bson import ObjectId

class M(BaseModel):
    id: str = Field(None, alias='_id')

try:
    print(M(**{'_id': ObjectId()}))
except Exception as e:
    print(e)
