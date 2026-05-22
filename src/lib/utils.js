import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function getAbsoluteFileUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  // Determine API URL based on environment or fallback to localhost:8000
  const apiUrl = import.meta.env?.VITE_API_URL || "http://localhost:8000";
  const origin = apiUrl.replace(/\/$/, "");
  const normalizedUrl = url.startsWith("/") ? url : `/${url}`;
  return `${origin}${normalizedUrl}`;
}

