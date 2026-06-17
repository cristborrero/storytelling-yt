import axios from "axios";
import type { GenerateRequest, GenerateResponse, Generation, Voice } from "./types";

let initPromise: Promise<void> | null = null;

async function ensureInitialized() {
  if (typeof window === "undefined") return;
  if (!initPromise) {
    initPromise = (async () => {
      try {
        const res = await axios.get("/api/config");
        if (res.data?.apiUrl) {
          api.defaults.baseURL = res.data.apiUrl;
        }
      } catch (e) {
        console.error("Failed to fetch API config, using default baseURL:", api.defaults.baseURL, e);
      }
    })();
  }
  await initPromise;
}

const BASE = typeof window !== "undefined" ? "http://localhost:8000" : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000");

export const api = axios.create({ baseURL: BASE });

export async function getVoices(): Promise<Voice[]> {
  await ensureInitialized();
  const res = await api.get("/voices");
  return res.data.items;
}

export async function uploadVoice(file: File, name?: string, transcript?: string): Promise<Voice> {
  await ensureInitialized();
  const form = new FormData();
  form.append("file", file);
  if (name) form.append("name", name);
  if (transcript) form.append("transcript", transcript);
  const res = await api.post("/voices/upload", form);
  return res.data.item;
}

export async function generateAudio(payload: GenerateRequest): Promise<GenerateResponse> {
  await ensureInitialized();
  const res = await api.post("/generate", payload);
  return res.data;
}

export async function getHistory(limit = 50): Promise<Generation[]> {
  await ensureInitialized();
  const res = await api.get(`/history?limit=${limit}`);
  return res.data.items;
}

export async function deleteHistoryItem(id: number): Promise<void> {
  await ensureInitialized();
  await api.delete(`/history/${id}`);
}

export function audioUrl(path: string): string {
  const base = typeof window !== "undefined" ? api.defaults.baseURL : BASE;
  return `${base}${path}`;
}
