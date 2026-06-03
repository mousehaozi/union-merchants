<template>
  <el-aside
    :width="sidebarWidth"
    class="layout-sidebar"
    :class="{ 'layout-sidebar--can-scroll': canScrollMenu }"
  >
    <div
      class="layout-sidebar__brand"
      :class="{ 'layout-sidebar__brand--collapsed': isCollapse }"
    >
      <el-icon class="layout-sidebar__brand-icon"><Shop /></el-icon>
      <span class="layout-sidebar__brand-title">数智工会商家端</span>
    </div>

    <el-menu
      ref="menuRef"
      :default-active="activeMenu"
      :default-openeds="defaultOpeneds"
      class="layout-sidebar-menu"
      background-color="transparent"
      text-color="#475569"
      active-text-color="#00a86b"
      :collapse="isCollapse"
      :collapse-transition="false"
      @select="handleMenuSelect"
      @scroll.passive="updateScrollHint"
    >
      <el-menu-item index="data-overview">
        <el-icon><Menu /></el-icon>
        <template #title>数据概览</template>
      </el-menu-item>

      <el-sub-menu index="product-group">
        <template #title>
          <el-icon><Goods /></el-icon>
          <span>商品管理</span>
        </template>
        <el-menu-item index="product-list">
          <el-icon><List /></el-icon>
          <template #title>商品列表</template>
        </el-menu-item>
        <el-menu-item index="product-apply">
          <el-icon><DocumentChecked /></el-icon>
          <template #title>上架申请</template>
        </el-menu-item>
      </el-sub-menu>

      <el-sub-menu index="order-group">
        <template #title>
          <el-icon><DocumentChecked /></el-icon>
          <span>订单管理</span>
        </template>
        <el-menu-item index="merchant-orders">
          <el-icon><Tickets /></el-icon>
          <template #title>全部订单</template>
        </el-menu-item>
        <el-menu-item index="wait-ship-orders">
          <el-icon><Promotion /></el-icon>
          <template #title>待发货订单</template>
        </el-menu-item>
      </el-sub-menu>

      <el-menu-item index="system-settings">
        <el-icon><Setting /></el-icon>
        <template #title>系统设置</template>
      </el-menu-item>
    </el-menu>

    <el-button
      v-if="canScrollMenu"
      class="layout-sidebar__scroll-hint"
      circle
      title="查看更多菜单"
      @click="scrollMenuToBottom"
    >
      <el-icon><ArrowDown /></el-icon>
    </el-button>
  </el-aside>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { isCollapse } from "@/utils/sidebarState";

const route = useRoute();
const router = useRouter();
const menuRef = ref(null);
const canScrollMenu = ref(false);

const sidebarWidth = computed(() => (isCollapse.value ? "64px" : "240px"));

const routeToMenuMap = {
  "/": "data-overview",
  "/product": "product-list",
  "/product-apply": "product-apply",
  "/wait-ship-orders": "wait-ship-orders",
  "/merchant-orders": "merchant-orders",
  "/system-settings": "system-settings",
};

const menuToRouteMap = {
  "data-overview": "/",
  "product-list": "/product",
  "product-apply": "/product-apply",
  "wait-ship-orders": "/wait-ship-orders",
  "merchant-orders": "/merchant-orders",
  "system-settings": "/system-settings",
};

// 根据当前路由同步左侧菜单选中态。
const activeMenu = computed(() => {
  return routeToMenuMap[route.path] || "data-overview";
});

const defaultOpeneds = computed(() => {
  if (["product-list", "product-apply"].includes(activeMenu.value)) {
    return ["product-group"];
  }
  if (["merchant-orders", "wait-ship-orders"].includes(activeMenu.value)) {
    return ["order-group"];
  }
  return [];
});

const handleMenuSelect = (index) => {
  const targetPath = menuToRouteMap[index];
  if (targetPath && targetPath !== route.path) {
    router.push(targetPath);
  }
};

const getMenuElement = () => menuRef.value?.$el || null;

const updateScrollHint = () => {
  const menuElement = getMenuElement();
  if (!menuElement) {
    canScrollMenu.value = false;
    return;
  }

  canScrollMenu.value =
    menuElement.scrollHeight - menuElement.scrollTop - menuElement.clientHeight > 4;
};

const scrollMenuToBottom = () => {
  const menuElement = getMenuElement();
  if (!menuElement) return;

  menuElement.scrollTo({
    top: menuElement.scrollHeight,
    behavior: "smooth",
  });
};

const updateScrollHintAfterRender = () => {
  nextTick(updateScrollHint);
};

onMounted(() => {
  updateScrollHintAfterRender();
  window.addEventListener("resize", updateScrollHint);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateScrollHint);
});

watch(() => route.path, updateScrollHintAfterRender);
watch(isCollapse, updateScrollHintAfterRender);
</script>

<style scoped>
.layout-sidebar {
  position: relative;
  height: 100%;
  padding: 8px;
  background: #ffffff;
  overflow: hidden;
}

.layout-sidebar::after {
  position: absolute;
  right: 8px;
  bottom: 8px;
  left: 8px;
  height: 56px;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0), #ffffff 78%);
  content: "";
  opacity: 0;
  transition: opacity 0.2s ease;
}

.layout-sidebar--can-scroll::after {
  opacity: 1;
}

.layout-sidebar__brand {
  height: 56px;
  margin-bottom: 8px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 14px;
  box-sizing: border-box;
  overflow: hidden;
  color: #00a86b;
  background: #ffffff;
}

.layout-sidebar__brand--collapsed {
  justify-content: center;
  padding: 0;
}

.layout-sidebar__brand-icon {
  flex-shrink: 0;
  font-size: 24px;
}

.layout-sidebar__brand-title {
  min-width: 0;
  color: #1e293b;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.5px;
  white-space: nowrap;
  overflow: hidden;
}

.layout-sidebar__brand--collapsed .layout-sidebar__brand-title {
  display: none;
}

.layout-sidebar-menu {
  height: calc(100% - 64px);
  border-right: none;
  border-radius: 16px;
  padding: 10px 8px;
  background: #ffffff;
  overflow-y: auto;
  scrollbar-width: none;
  --el-menu-bg-color: transparent;
  --el-menu-text-color: #475569;
  --el-menu-active-color: #00a86b;
  --el-menu-hover-bg-color: #f0fbf6;
}

.layout-sidebar-menu::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.layout-sidebar__scroll-hint {
  position: absolute;
  right: 50%;
  bottom: 16px;
  z-index: 2;
  width: 34px;
  height: 34px;
  color: #00a86b;
  background: #ecfdf5;
  border: 1px solid rgba(0, 168, 107, 0.18);
  box-shadow: 0 10px 26px rgba(0, 168, 107, 0.16);
  transform: translateX(50%);
}

.layout-sidebar__scroll-hint:hover,
.layout-sidebar__scroll-hint:focus {
  color: #008655;
  background: #dff8ec;
  border-color: rgba(0, 168, 107, 0.28);
}

.layout-sidebar-menu :deep(.el-menu) {
  background: transparent;
}

.layout-sidebar-menu :deep(.el-loading-mask) {
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(2px);
}

.layout-sidebar-menu :deep(.el-loading-spinner .path) {
  stroke: #00a86b;
}

.layout-sidebar-menu :deep(.el-loading-spinner .el-loading-text) {
  color: #00a86b;
}

.layout-sidebar-menu :deep(.el-sub-menu__title),
.layout-sidebar-menu :deep(.el-menu-item) {
  height: 44px;
  margin-bottom: 6px;
  border-radius: 12px;
  color: #475569;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.layout-sidebar-menu :deep(.el-sub-menu__title:hover),
.layout-sidebar-menu :deep(.el-menu-item:hover) {
  color: #008655;
  background: #f0fbf6;
}

.layout-sidebar-menu :deep(.el-menu-item.is-active) {
  color: #00a86b;
  font-weight: 600;
  background: #e6f7f0;
}

.layout-sidebar-menu :deep(.el-sub-menu .el-menu-item) {
  margin-left: 8px;
  background: transparent;
}

.layout-sidebar-menu :deep(.el-sub-menu .el-menu-item.is-active) {
  color: #00a86b;
  background: #e6f7f0;
}

.layout-sidebar-menu :deep(.el-sub-menu.is-opened > .el-sub-menu__title) {
  color: #008655;
  background: #f0fbf6;
}
</style>
