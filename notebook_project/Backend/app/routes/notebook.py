from fastapi import APIRouter
from app.models import CodeExecutionRequest, CodeExecutionResponse
from app.kernel_manager import kernel_manager

router = APIRouter()

@router.post("/execute", response_model=CodeExecutionResponse)
def execute_code(request: CodeExecutionRequest):
    kernel = kernel_manager.get_or_create_kernel(request.session_id)
    result = kernel.execute(request.code)
    return CodeExecutionResponse(**result)