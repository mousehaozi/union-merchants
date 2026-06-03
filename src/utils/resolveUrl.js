import { baseUrl } from "./baseUrl.js";

/**
 * 将后端返回的相对资源地址转换为可访问的完整地址
 * @param {string} url
 * @returns {string}
 */
export function resolveUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }

  const base = baseUrl().replace(/\/$/, "");
  return url.startsWith("/") ? `${base}${url}` : `${base}/${url}`;
}
