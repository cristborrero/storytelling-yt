import base64
from pathlib import Path
import requests
from app.config import settings


class TTSService:
    @classmethod
    def generate_wav(
        cls,
        text: str,
        output_path: Path,
        audio_prompt_path: str | None = None,
        prompt_text: str | None = None,
        exaggeration: float | None = None,
        cfg_weight: float | None = None,
    ) -> Path:
        # Prepare request payload for Fish Speech local api_server
        # Map parameters: cfg_weight -> temperature, exaggeration -> repetition_penalty
        temp = cfg_weight if cfg_weight is not None else settings.default_cfg_weight
        rep_penalty = 1.0 + (exaggeration if exaggeration is not None else settings.default_exaggeration) * 0.4

        payload = {
            "text": text,
            "format": "wav",
            "temperature": temp,
            "repetition_penalty": rep_penalty,
        }

        # If a voice reference is provided, encode it to base64 and append as reference
        if audio_prompt_path and Path(audio_prompt_path).exists():
            with open(audio_prompt_path, "rb") as f:
                audio_bytes = f.read()
            audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")
            
            payload["references"] = [
                {
                    "audio": audio_base64,
                    "text": prompt_text or ""
                }
            ]

        # Call the local Fish Speech server
        api_url = f"{settings.fish_speech_api_url}/v1/tts"
        try:
            response = requests.post(api_url, json=payload, timeout=600)  # 10 mins timeout
            response.raise_for_status()
        except requests.RequestException as e:
            raise RuntimeError(f"Fish Speech API error: {e}")

        # Save binary response content to output path
        with open(output_path, "wb") as f:
            f.write(response.content)

        return output_path

