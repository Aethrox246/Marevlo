from app.execution_engine import ExecutionEngine

class KernelManager:
    def __init__(self):
        self.sessions = {}

    def get_or_create_kernel(self, session_id: str):
        if session_id not in self.sessions:
            self.sessions[session_id] = ExecutionEngine()
        return self.sessions[session_id]

kernel_manager = KernelManager()