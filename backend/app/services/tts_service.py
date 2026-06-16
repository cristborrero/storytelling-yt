import threading
from pathlib import Path
import torchaudio as ta
from chatterbox.tts import ChatterboxTTS
from app.config import settings


class TTSService:
    _model = None
    _lock = threading.Lock()

    @classmethod
    def get_model(cls):
        if cls._model is None:
            with cls._lock:
                if cls._model is None:
                    cls._model = ChatterboxTTS.from_pretrained(device=settings.tts_device)
        return cls._model

    @classmethod
    def generate_wav(
        cls,
        text: str,
        output_path: Path,
        audio_prompt_path: str | None = None,
        exaggeration: float | None = None,
        cfg_weight: float | None = None,
    ) -> Path:
        model = cls.get_model()
        kwargs = {
            "exaggeration": exaggeration if exaggeration is not None else settings.default_exaggeration,
            "cfg_weight": cfg_weight if cfg_weight is not None else settings.default_cfg_weight,
        }
        if audio_prompt_path:
            kwargs["audio_prompt_path"] = audio_prompt_path
        wav = model.generate(text, **kwargs)
        ta.save(str(output_path), wav, model.sr)
        return output_path
