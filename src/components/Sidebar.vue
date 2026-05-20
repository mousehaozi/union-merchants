<template>
  <el-aside width="240px" class="aside-menu">
    <div class="logo-wrapper">
      <el-icon class="logo-icon" size="24"><Shop /></el-icon>
      <span class="logo-text">Union Merchants</span>
    </div>
    <el-menu
      :default-active="activeMenu"
      class="el-menu-vertical"
      background-color="transparent"
      text-color="#94a3b8"
      active-text-color="#6366f1"
      @select="handleMenuSelect"
    >
      <el-menu-item index="data-overview">
        <el-icon><Menu /></el-icon>
        <span>数据概览</span>
      </el-menu-item>
      <el-menu-item index="product-manage">
        <el-icon><Goods /></el-icon>
        <span>商品管理</span>
      </el-menu-item>
      <el-menu-item index="system-settings">
        <el-icon><Setting /></el-icon>
        <span>系统设置</span>
      </el-menu-item>
    </el-menu>
  </el-aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

// Automatically set active menu index based on the current route path
const activeMenu = computed(() => {
  if (route.path === '/product') return 'product-manage'
  return 'data-overview' // default to overview for other routes on home
})

const handleMenuSelect = (index) => {
  if (index === 'product-manage') {
    router.push('/product')
  } else if (index === 'data-overview') {
    router.push('/')
  } else {
    ElMessage.info(`点击了: ${index}`)
  }
}
</script>

<style scoped>
.aside-menu {
  background-color: #0f172a;
  border-right: 1px solid #1e293b;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.logo-wrapper {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 10px;
  border-bottom: 1px solid #1e293b;
}

.logo-icon {
  color: #6366f1;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: #f8fafc;
  letter-spacing: 0.5px;
}

.el-menu-vertical {
  border-right: none;
  padding-top: 15px;
}

:deep(.el-menu-item) {
  margin: 4px 12px;
  border-radius: 8px;
  height: 48px;
  line-height: 48px;
}

:deep(.el-menu-item.is-active) {
  background-color: rgba(99, 102, 241, 0.15) !important;
}

:deep(.el-menu-item:hover) {
  background-color: rgba(255, 255, 255, 0.05);
  color: #f8fafc !important;
}
</style>
