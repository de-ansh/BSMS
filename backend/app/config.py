from pydantic import field_validator
from pydantic_settings import BaseSettings


INSECURE_SECRET = "change-me-in-production"


class Settings(BaseSettings):
    database_url: str = "sqlite:///./bsms.db"
    secret_key: str = INSECURE_SECRET
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 480
    environment: str = "development"
    allow_seed: bool = False
    cors_origins: str = "http://localhost:5173"
    login_rate_limit_attempts: int = 5
    login_rate_limit_window_seconds: int = 300

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    @field_validator("secret_key")
    @classmethod
    def secret_key_must_not_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("SECRET_KEY must not be empty")
        return value

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    def validate_for_startup(self) -> None:
        if self.environment == "production":
            if self.secret_key == INSECURE_SECRET:
                raise ValueError(
                    "SECRET_KEY must be set to a strong random value in production"
                )
            if self.allow_seed:
                raise ValueError("ALLOW_SEED must be false in production")


settings = Settings()
