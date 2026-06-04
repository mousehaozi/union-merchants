# union-merchants

## 后端地址与图片资源配置

项目中的后端地址统一由 `src/utils/baseUrl.js` 处理：

- `REQUEST_BASE_URL`：开发环境默认请求前缀，值为 `/api`。
- `getBackendBaseUrl()`：优先读取 `VITE_BACKEND_BASE_URL`，未配置时回退到 `/api`。

后端返回的图片、文件相对路径统一通过 `src/utils/getimage.js` 的 `getImageUrl(path)` 转换。

### 开发环境

开发环境执行 `npm run dev` 时，接口默认走 Vite 的 `/api` 代理，图片地址保持后端返回的原始相对路径，继续由 Vite 代理处理。

```env
# .env.development
VITE_BACKEND_BASE_URL=
```

示例：`getImageUrl("/uploads/1.jpg")` 在开发环境返回 `"/uploads/1.jpg"`。

### 生产环境

生产环境前后端分离部署时，需要配置后端资源域名。后端仍然只返回相对路径，前端会在渲染图片时自动拼接 `VITE_BACKEND_BASE_URL`。

```env
# .env.production
VITE_BACKEND_BASE_URL=https://api.example.com
```

示例：`getImageUrl("/uploads/1.jpg")` 在生产环境返回 `https://api.example.com/uploads/1.jpg`。

如果未配置 `VITE_BACKEND_BASE_URL`，请求地址会回退到 `/api`。
