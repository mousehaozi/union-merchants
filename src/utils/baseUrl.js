export const REQUEST_BASE_URL = "/api";

// 通过环境变量来获取请求的 URL，不要改这里。
export function getBackendBaseUrl() {
  return import.meta.env.VITE_BACKEND_BASE_URL || REQUEST_BASE_URL;
}
