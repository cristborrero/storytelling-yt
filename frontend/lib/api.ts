import axios from "axios";
import type { GenerateRequest, GenerateResponse, Generation, Voice } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const api = axios.create({ baseURL: BASE });

export async function getVoices(): Promise<Voice[]> {
  const res = await api.get("/voices");
  return res.data.items;
}

export async function uploadVoice(file: File, name?: string): Promise<Voice> {
  const form = new FormData();
  form.append("file", file);
  if (name) form.append("name", name);
  const res = await api.post("/voices/upload", form);
  return res.data.item;
}

export async function generateAudio(payload: GenerateRequest): Promise<GenerateResponse> {
  const res = await api.post("/generate", payload);
  return res.data;
}

export async function getHistory(limit = 50): Promise<Generation[]> {
  const res = await api.get(`/history?limit=${limit}`);
  return res.data.items;
}

export function audioUrl(path: string): string {
  return `${BASE}${path}`;
}
