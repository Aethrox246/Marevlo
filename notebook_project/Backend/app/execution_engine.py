from IPython.core.interactiveshell import InteractiveShell
import io
import contextlib

class ExecutionEngine:
    def __init__(self):
        self.shell = InteractiveShell.instance()

    def execute(self, code: str):
        stdout = io.StringIO()
        stderr = io.StringIO()

        try:
            with contextlib.redirect_stdout(stdout):
                with contextlib.redirect_stderr(stderr):
                    result = self.shell.run_cell(code)

            return {
                "output": stdout.getvalue(),
                "error": stderr.getvalue() if stderr.getvalue() else None
            }

        except Exception as e:
            return {
                "output": "",
                "error": str(e)
            }