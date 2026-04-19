from pydantic import BaseModel

class CodeExecutionRequest(BaseModel):
    session_id: str
    code: str

class CodeExecutionResponse(BaseModel):
    output: str
    error: str | None = None