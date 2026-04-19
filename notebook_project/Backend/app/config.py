import os

class Settings:
    def __init__(self):
        self.PROJECT_NAME = "Custom Notebook"
        self.HOST = os.getenv("HOST", "0.0.0.0")
        self.PORT = int(os.getenv("PORT", 8000))
        self.DEBUG = os.getenv("DEBUG", "False") == "True"

settings = Settings()