<template>
  <el-dialog
    :model-value="modelValue"
    title="订单详情"
    width="760px"
    align-center
    :destroy-on-close="true"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="order-detail-dialog-content" v-loading="loading">
      <el-empty v-if="!detail && !loading" description="暂无订单详情" />

      <template v-else-if="detail">
        <section class="detail-card">
          <div class="detail-card__title">订单信息</div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="订单编号">
              <span class="mono-text">{{ detail.orderNo }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="支付单号">
              <span class="mono-text">{{ detail.payOrderNo || "-" }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="订单状态">
              <el-tag :type="getOrderStatusTagType(detail.status)" effect="light">
                {{ getOrderStatusText(detail.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="支付状态">
              <el-tag :type="getPayStatusTagType(detail.payStatus)" effect="light">
                {{ getPayStatusText(detail.payStatus) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="支付方式">
              {{ getPayTypeText(detail.payType) }}
            </el-descriptions-item>
            <el-descriptions-item label="订单金额">
              <span class="amount-text">{{ formatCurrency(detail.orderAmount) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              {{ formatDate(detail.createTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="支付时间">
              {{ formatDate(detail.payTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="发货时间">
              {{ formatDate(detail.shipTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="商家名称">
              {{ detail.companyName || "-" }}
            </el-descriptions-item>
          </el-descriptions>
        </section>

        <section class="detail-card">
          <div class="detail-card__title">商品快照</div>
          <div class="snapshot-layout">
            <el-image
              v-if="detail.productCoverSnapshot"
              class="snapshot-cover"
              :src="getImageUrl(detail.productCoverSnapshot)"
              :preview-src-list="[getImageUrl(detail.productCoverSnapshot)]"
              preview-teleported
              fit="cover"
            />
            <div v-else class="snapshot-cover snapshot-cover--empty">暂无图片</div>

            <el-descriptions :column="2" border class="snapshot-descriptions">
              <el-descriptions-item label="商品名称">
                {{ detail.productNameSnapshot || "-" }}
              </el-descriptions-item>
              <el-descriptions-item label="规格">
                {{ detail.specNameSnapshot || "-" }}
              </el-descriptions-item>
              <el-descriptions-item label="单价">
                {{ formatCurrency(detail.unitPrice) }}
              </el-descriptions-item>
              <el-descriptions-item label="数量">
                {{ detail.quantity || 0 }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </section>

        <section class="detail-card">
          <div class="detail-card__title">收货地址</div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="收货人">
              {{ detail.receiverName || "-" }}
            </el-descriptions-item>
            <el-descriptions-item label="联系电话">
              {{ detail.receiverPhone || "-" }}
            </el-descriptions-item>
            <el-descriptions-item label="完整地址" :span="2">
              {{ fullAddress }}
            </el-descriptions-item>
          </el-descriptions>
        </section>

        <section class="detail-card">
          <div class="detail-card__title">物流信息</div>
          <div v-if="trackingList.length" class="tracking-list">
            <el-tag
              v-for="trackingNo in trackingList"
              :key="trackingNo"
              type="success"
              effect="light"
            >
              {{ trackingNo }}
            </el-tag>
          </div>
          <el-empty v-else description="暂无运单号" :image-size="72" />
        </section>
      </template>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button :icon="Close" @click="emit('update:modelValue', false)">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from "vue";
import { Close } from "@element-plus/icons-vue";
import { formatDate } from "@/utils/date.js";
import { getImageUrl } from "@/utils/getimage.js";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  detail: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);

const trackingList = computed(() => {
  return Array.isArray(props.detail?.trackingList) ? props.detail.trackingList : [];
});

const fullAddress = computed(() => {
  if (!props.detail) return "-";
  return [
    props.detail.province,
    props.detail.city,
    props.detail.district,
    props.detail.detailAddress,
  ].filter(Boolean).join("");
});

const formatCurrency = (value) => {
  const numberValue = Number(value || 0);
  return `¥${numberValue.toFixed(2)}`;
};

const getOrderStatusText = (status) => {
  const map = {
    0: "未支付",
    1: "待发货",
    2: "待收货",
    3: "已收货",
    4: "已取消",
    UNPAID: "未支付",
    PAID: "已支付",
    CANCELED: "已取消",
  };
  return map[status] || "未知";
};

const getOrderStatusTagType = (status) => {
  const map = {
    0: "info",
    1: "warning",
    2: "primary",
    3: "success",
    4: "danger",
    UNPAID: "info",
    PAID: "success",
    CANCELED: "danger",
  };
  return map[status] || "info";
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
</script>

<style scoped>
.order-detail-dialog-content {
  max-height: 80vh;
  overflow-y: auto;
  padding-right: 15px;
}

.detail-card {
  margin-bottom: 16px;
}

.detail-card:last-child {
  margin-bottom: 0;
}

.detail-card__title {
  margin-bottom: 10px;
  color: #0f172a;
  font-size: 15px;
  font-weight: 700;
}

.snapshot-layout {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.snapshot-cover {
  width: 120px;
  height: 120px;
  flex: 0 0 120px;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  overflow: hidden;
}

.snapshot-cover--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 13px;
}

.snapshot-descriptions {
  flex: 1;
  min-width: 0;
}

.mono-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: #334155;
}

.amount-text {
  color: #00a86b;
  font-weight: 700;
}

.tracking-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .snapshot-layout {
    flex-direction: column;
  }

  .snapshot-cover {
    width: 100%;
    max-width: 180px;
    height: 180px;
  }
}
</style>
