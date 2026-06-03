<template>
  <router-view />
</template>

<script setup>
// Main App Component
</script>

<style>
:root {
  --el-color-primary: #00a86b !important;
  --el-color-primary-light-3: #33b989 !important;
  --el-color-primary-light-5: #66cb9e !important;
  --el-color-primary-light-7: #99dcbe !important;
  --el-color-primary-light-8: #b2e5ce !important;
  --el-color-primary-light-9: #e6f7f0 !important;
  --el-color-primary-dark-2: #008655 !important;
  --app-scrollbar-size: 8px;
  --app-scrollbar-thumb: rgba(148, 163, 184, 0.32);
  --app-scrollbar-thumb-hover: rgba(100, 116, 139, 0.48);
}

body {
  margin: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f5f7fa;
  color: #303133;
}

#app {
  height: 100vh;
}

* {
  scrollbar-width: thin;
  scrollbar-color: var(--app-scrollbar-thumb) transparent;
}

*::-webkit-scrollbar {
  width: var(--app-scrollbar-size);
  height: var(--app-scrollbar-size);
}

*::-webkit-scrollbar-track {
  background: transparent;
}

*::-webkit-scrollbar-thumb {
  background: var(--app-scrollbar-thumb);
  border: 2px solid transparent;
  border-radius: 999px;
  background-clip: content-box;
}

*::-webkit-scrollbar-thumb:hover {
  background: var(--app-scrollbar-thumb-hover);
  background-clip: content-box;
}

*::-webkit-scrollbar-corner {
  background: transparent;
}

.el-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
}

.el-form > .el-form-item {
  min-width: 0;
  margin: 0;
}

.el-form > .el-form-item .el-form-item__content,
.el-form > .el-form-item .el-select,
.el-form > .el-form-item .el-cascader,
.el-form > .el-form-item .el-date-editor,
.el-form > .el-form-item .el-input-number {
  min-width: 0;
  width: 100%;
}

.el-form.el-form--inline {
  grid-template-columns: repeat(auto-fit, minmax(180px, max-content));
  align-items: end;
  justify-content: start;
}

.el-form.el-form--inline > .el-form-item {
  width: 100%;
}

.el-form.el-form--inline > .el-form-item .el-form-item__content {
  width: 100%;
}

@media (max-width: 768px) {
  .el-form.el-form--inline {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
