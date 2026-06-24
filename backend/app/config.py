from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str = "sqlite:///./talentflow.db"
    secret_key: str = "talentflow-super-secret-key"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    refresh_token_expire_days: int = 7
    mailtrap_api_key: str = ""
    frontend_url: str = "http://localhost:5173"
    upload_dir: str = "./uploads"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()
