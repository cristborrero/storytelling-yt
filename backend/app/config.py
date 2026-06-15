from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent
STORAGE_DIR = BASE_DIR / "storage"
VOICES_DIR = STORAGE_DIR / "voices"
OUTPUTS_DIR = STORAGE_DIR / "outputs"
DB_PATH = BASE_DIR / "storytelling.db"  # nombre correcto del proyecto


class Settings(BaseSettings):
    app_name: str = "Storytelling API"
    app_env: str = "development"
    debug: bool = True
    backend_port: int = 8000
    storage_path: str = str(STORAGE_DIR)
    tts_device: str = "cpu"
    default_exaggeration: float = 0.5
    default_cfg_weight: float = 0.5
    allowed_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


settings = Settings()
VOICES_DIR.mkdir(parents=True, exist_ok=True)
OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
