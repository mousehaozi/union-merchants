<template>
  <div class="page-container wait-ship-page">
    <CommonLayout>
      <template #search>
        <el-form
          :inline="true"
          :model="searchForm"
          class="search-form"
          size="default"
        >
          <el-form-item label="收货人姓名">
            <el-input
              v-model="searchForm.receiverName"
              clearable
              placeholder="请输入收货人姓名"
              style="width: 200px"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="收货人手机号">
            <el-input
              v-model="searchForm.receiverPhone"
              clearable
              placeholder="请输入收货人手机号"
              style="width: 220px"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="下单用户名">
            <el-input
              v-model="searchForm.userName"
              clearable
              placeholder="请输入下单用户名"
              style="width: 200px"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              plain
              :icon="Search"
              :loading="loading"
              @click="handleSearch"
            >
              搜索
            </el-button>
            <el-button plain :icon="Refresh" @click="handleReset">
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </template>

      <template #actions>
        <div class="page-toolbar">
          <div class="toolbar-actions">
            <el-button
              plain
              :icon="Refresh"
              :loading="loading"
              @click="loadOrders"
            >
              刷新列表
            </el-button>
          </div>
        </div>
      </template>

      <template #table>
        <el-table
          :data="tableData"
          style="width: 100%"
          height="100%"
          v-loading="loading"
          class="wait-ship-table"
          empty-text="暂无待发货订单"
        >
          <el-table-column
            label="订单编号"
            width="230"
            align="left"
            show-overflow-tooltip
          >
            <template #default="scope">
              <span class="order-no-text">{{ scope.row.orderNo }}</span>
            </template>
          </el-table-column>

          <el-table-column
            label="商品信息"
            min-width="260"
            align="left"
            show-overflow-tooltip
          >
            <template #default="scope">
              <div class="product-cell">
                <el-image
                  v-if="scope.row.productCoverSnapshot"
                  class="product-cover"
                  :src="getImageUrl(scope.row.productCoverSnapshot)"
                  :preview-src-list="[
                    getImageUrl(scope.row.productCoverSnapshot),
                  ]"
                  preview-teleported
                  fit="cover"
                />
                <div v-else class="product-cover product-cover--empty">
                  暂无图片
                </div>
                <div class="product-info">
                  <span class="product-name">{{
                    scope.row.productNameSnapshot || "-"
                  }}</span>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="数量" width="90" align="center">
            <template #default="scope">
              {{ scope.row.quantity || 0 }}
            </template>
          </el-table-column>

          <el-table-column label="订单金额" width="130" align="center">
            <template #default="scope">
              <span class="amount-text">{{
                formatCurrency(scope.row.orderAmount)
              }}</span>
            </template>
          </el-table-column>

          <el-table-column label="支付方式" width="120" align="center">
            <template #default="scope">
              {{ getPayTypeText(scope.row.payType) }}
            </template>
          </el-table-column>

          <el-table-column label="支付状态" width="110" align="center">
            <template #default="scope">
              <el-tag
                :type="getPayStatusTagType(scope.row.payStatus)"
                effect="light"
              >
                {{ getPayStatusText(scope.row.payStatus) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="订单状态" width="110" align="center">
            <template #default="scope">
              <el-tag type="warning" effect="light">
                {{ getOrderStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column
            label="操作"
            width="190"
            align="center"
            fixed="right"
          >
            <template #default="scope">
              <el-button
                link
                type="primary"
                size="default"
                :icon="View"
                @click="handleView(scope.row)"
              >
                详情
              </el-button>
              <el-button
                link
                type="success"
                size="default"
                :icon="Promotion"
                @click="handleOpenShip(scope.row)"
              >
                发货
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>

      <template #pagination>
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="pageNum"
            v-model:page-size="pageSize"
            :page-sizes="[5, 10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </template>
    </CommonLayout>

    <OrderDetailDialog
      v-model="detailDialogVisible"
      :detail="detailData"
      :loading="detailLoading"
    />

    <ShipDialog
      v-model="shipDialogVisible"
      :base-order="shipBaseOrder"
      :same-address-orders="sameAddressOrders"
      :same-address-loading="sameAddressLoading"
      :submit-loading="shipSubmitLoading"
      @submit="handleShipSubmit"
    />
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { Promotion, Refresh, Search, View } from "@element-plus/icons-vue";
import CommonLayout from "@/components/commonLayout.vue";
import {
  getMerchantOrderDetail,
  getSameAddressWaitShipOrders,
  getWaitShipOrderPage,
  shipMerchantOrders,
} from "@/api/orderApi.js";
import { getImageUrl } from "@/utils/getimage.js";
import OrderDetailDialog from "./components/OrderDetailDialog.vue";
import ShipDialog from "./components/ShipDialog.vue";

defineOptions({
  name: "WaitShipOrders",
});

const searchForm = reactive({
  receiverName: "",
  receiverPhone: "",
  userName: "",
});

const tableData = ref([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(10);
const loading = ref(false);

const detailDialogVisible = ref(false);
const detailLoading = ref(false);
const detailData = ref(null);

const shipDialogVisible = ref(false);
const shipBaseOrder = ref(null);
const sameAddressOrders = ref([]);
const sameAddressLoading = ref(false);
const shipSubmitLoading = ref(false);

const normalizeSearchValue = (value) => {
  const text = String(value ?? "").trim();
  return text || undefined;
};

const loadOrders = async () => {
  loading.value = true;
  try {
    const res = await getWaitShipOrderPage({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      receiverName: normalizeSearchValue(searchForm.receiverName),
      receiverPhone: normalizeSearchValue(searchForm.receiverPhone),
      userName: normalizeSearchValue(searchForm.userName),
    });

    if (res && (res.code === 200 || res.code === 0) && res.data) {
      tableData.value = res.data.records || [];
      total.value = res.data.total || 0;
    } else {
      ElMessage.error(res?.message || "获取待发货订单失败");
    }
  } catch (err) {
    console.error("获取待发货订单错误:", err);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pageNum.value = 1;
  loadOrders();
};

const handleReset = () => {
  Object.assign(searchForm, {
    receiverName: "",
    receiverPhone: "",
    userName: "",
  });
  pageNum.value = 1;
  loadOrders();
};

const handleSizeChange = (val) => {
  pageSize.value = val;
  pageNum.value = 1;
  loadOrders();
};

const handleCurrentChange = (val) => {
  pageNum.value = val;
  loadOrders();
};

const handleView = async (row) => {
  detailDialogVisible.value = true;
  detailData.value = null;
  detailLoading.value = true;

  try {
    const res = await getMerchantOrderDetail(row.orderNo);
    if (res && (res.code === 200 || res.code === 0) && res.data) {
      detailData.value = res.data;
    } else {
      ElMessage.error(res?.message || "获取订单详情失败");
    }
  } catch (err) {
    console.error("获取订单详情错误:", err);
  } finally {
    detailLoading.value = false;
  }
};

const handleOpenShip = async (row) => {
  shipDialogVisible.value = true;
  shipBaseOrder.value = { ...row };
  sameAddressOrders.value = [];
  sameAddressLoading.value = true;

  try {
    const detailRes = await getMerchantOrderDetail(row.orderNo);
    if (
      !(
        detailRes &&
        (detailRes.code === 200 || detailRes.code === 0) &&
        detailRes.data
      )
    ) {
      ElMessage.error(detailRes?.message || "获取发货订单详情失败");
      return;
    }

    const detail = detailRes.data;
    shipBaseOrder.value = detail;

    if (!detail.addressId) {
      sameAddressOrders.value = [detail];
      ElMessage.warning("当前订单缺少地址 ID，无法查询同地址订单");
      return;
    }

    const sameAddressRes = await getSameAddressWaitShipOrders({
      addressId: detail.addressId,
    });

    if (
      sameAddressRes &&
      (sameAddressRes.code === 200 || sameAddressRes.code === 0)
    ) {
      sameAddressOrders.value = Array.isArray(sameAddressRes.data)
        ? sameAddressRes.data
        : [];
    } else {
      sameAddressOrders.value = [detail];
      ElMessage.error(sameAddressRes?.message || "查询同地址订单失败");
    }
  } catch (err) {
    console.error("打开发货弹窗错误:", err);
  } finally {
    sameAddressLoading.value = false;
  }
};

const handleShipSubmit = async (payload) => {
  shipSubmitLoading.value = true;
  try {
    const res = await shipMerchantOrders(payload);
    if (res && (res.code === 200 || res.code === 0)) {
      ElMessage.success("发货成功");
      shipDialogVisible.value = false;
      await loadOrders();
    } else {
      ElMessage.error(res?.message || "发货失败");
    }
  } catch (err) {
    console.error("订单发货错误:", err);
  } finally {
    shipSubmitLoading.value = false;
  }
};

const formatCurrency = (value) => {
  const numberValue = Number(value || 0);
  return `¥${numberValue.toFixed(2)}`;
};

const getOrderStatusText = (status) => {
  const map = {
    1: "待发货",
    2: "待收货",
    3: "已收货",
  };
  return map[status] || "待发货";
};

const getPayStatusText = (status) => {
  const map = {
    0: "未支付",
    1: "已支付",
    2: "已退款",
  };
  return map[status] || "未知";
};

const getPayStatusTagType = (status) => {
  const map = {
    0: "info",
    1: "success",
    2: "warning",
  };
  return map[status] || "info";
};

const getPayTypeText = (type) => {
  const map = {
    COIN: "积分支付",
    WECHAT: "微信支付",
    ALIPAY: "支付宝",
  };
  return map[type] || type || "-";
};

onMounted(() => {
  loadOrders();
});
</script>

<style scoped>
.page-container {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.page-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  margin: 0 0 6px;
  color: #0f172a;
  font-size: 20px;
  font-weight: 700;
}

.page-subtitle {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.toolbar-actions {
  flex: 0 0 auto;
}

.wait-ship-table {
  border-radius: 12px;
  overflow: hidden;
}

.order-no-text {
  color: #334155;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.product-cover {
  width: 52px;
  height: 52px;
  flex: 0 0 52px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.product-cover--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 11px;
}

.product-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-name {
  color: #0f172a;
  font-weight: 600;
  line-height: 1.4;
}

.product-meta {
  color: #94a3b8;
  font-size: 12px;
}

.amount-text {
  color: #00a86b;
  font-weight: 700;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .page-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
