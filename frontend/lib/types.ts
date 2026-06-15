export interface Voice {
  id: number;
  name: string;
  original_filename: string;
  stored_filename: string;
  file_path: string;
  duration_seconds: number | null;
  created_at: string;
}

export interface Generation {
  id: number;
  text: string;
  voice_id: number | null;
  voice_name: string | null;
  output_wav_filename: string;
  output_mp3_filename: string | null;
  output_wav_url: string;
  output_mp3_url: string | null;
  exaggeration: number;
  cfg_weight: number;
  format: string;
  status: string;
  duration_seconds: number | null;
  created_at: string;
}

export interface GenerateRequest {
  text: string;
  voice_id?: number | null;
  exaggeration?: number;
  cfg_weight?: number;
  output_format?: "wav" | "mp3" | "both";
}

export interface GenerateResponse {
  item: Generation;
  audio: {
    wav_url: string;
    mp3_url: string | null;
    duration_seconds: number | null;
  };
}
