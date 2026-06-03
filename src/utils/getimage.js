import { getBackendBaseUrl } from "./baseUrl.js";

const ABSOLUTE_URL_REG = /^(https?:|data:|blob:|file:|\/\/)/i;

const joinUrl = (base, path) => {
  const cleanBase = String(base || "").replace(/\/+$/, "");
  const cleanPath = String(path || "").trim();

  return cleanPath.startsWith("/") ? `${cleanBase}${cleanPath}` : `${cleanBase}/${cleanPath}`;
};

export const getImageUrl = (path) => {
  const url = String(path || "").trim();
  if (!url) return "";

  if (ABSOLUTE_URL_REG.test(url)) return url;

  return import.meta.env.DEV ? url : joinUrl(getBackendBaseUrl(), url);
};
