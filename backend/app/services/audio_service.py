from pathlib import Path
from pydub import AudioSegment
import torchaudio


class AudioService:
    @staticmethod
    def wav_duration_seconds(file_path: Path) -> float:
        metadata = torchaudio.info(str(file_path))
        if metadata.sample_rate == 0:
            return 0.0
        return round(metadata.num_frames / metadata.sample_rate, 2)

    @staticmethod
    def convert_wav_to_mp3(wav_path: Path, mp3_path: Path) -> Path:
        audio = AudioSegment.from_wav(wav_path)
        audio.export(mp3_path, format="mp3", bitrate="192k")
        return mp3_path
