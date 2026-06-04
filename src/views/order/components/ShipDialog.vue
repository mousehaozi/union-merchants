<template>
  <el-dialog
    :model-value="modelValue"
    title="订单发货"
    width="820px"
    align-center
    :destroy-on-close="true"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="ship-dialog-content">
      <el-alert
        title="同地址订单可合并发货，同一批次内填写的全部运单号会同步到所选订单详情中。"
        type="success"
        :closable="false"
        show-icon
      />

      <section class="ship-section">
        <div class="section-title">收货地址</div>
        <div class="address-card">
          <div class="receiver-line">
            <span class="receiver-name">{{ baseOrder?.receiverName || "-" }}</span>
            <span class="receiver-phone">{{ baseOrder?.receiverPhone || "-" }}</span>
          </div>
          <div class="address-text">{{ fullAddress }}</div>
        </div>
      </section>

      <section class="ship-section">
        <div class="section-title">
          合并发货订单
          <span class="section-subtitle">已选 {{ selectedOrderNos.length }} 单</span>
        </div>

        <div v-loading="sameAddressLoading" class="same-address-list">
          <el-checkbox-group v-model="selectedOrderNos">
            <div
              v-for="order in orderOptions"
              :key="order.orderNo"
              class="same-address-item"
              :class="{ 'same-address-item--checked': selectedOrderNos.includes(order.orderNo) }"
            >
              <el-checkbox :label="order.orderNo">
                <div class="order-option-content">
                  <div class="order-option-main">
                    <span class="order-no">{{ order.orderNo }}</span>
                    <span class="product-name">{{ order.productNameSnapshot || "待发货订单" }}</span>
                  </div>
                  <div class="order-option-meta">
                    <span>数量 {{ order.quantity || "-" }}</span>
                    <span>{{ formatCurrency(order.orderAmount) }}</span>
                  </div>
                </div>
              </el-checkbox>
            </div>
          </el-checkbox-group>
          <el-empty
            v-if="!sameAddressLoading && orderOptions.length === 0"
            description="暂无同地址待发货订单"
            :image-size="72"
          />
        </div>
      </section>

      <section class="ship-section">
        <div class="section-title">运单号</div>
        <div class="tracking-list">
          <div v-for="(_, index) in trackingList" :key="index" class="tracking-row">
            <el-input
              v-model="trackingList[index]"
              placeholder="请输入运单号，例如：YT202606020001"
              clearable
            />
            <el-button
              plain
              type="danger"
              :icon="Delete"
              :disabled="trackingList.length === 1"
              @click="removeTracking(index)"
            >
              删除
            </el-button>
          </div>
          <el-button plain type="primary" :icon="Plus" @click="addTracking">
            增加运单号
          </el-button>
        </div>
      </section>

      <section class="ship-section">
        <div class="section-title">发货备注</div>
        <el-input
          v-model="remark"
          type="textarea"
          :rows="3"
          maxlength="200"
          show-word-limit
          placeholder="可填写合并发货说明，非必填"
        />
      </section>

      <div class="ship-summary">
        <span>本次发货订单金额合计</span>
        <strong>{{ formatCurrency(selectedTotalAmount) }}</strong>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button :icon="Close" @click="emit('update:modelValue', false)">取消</el-button>
        <el-button
          type="primary"
          :icon="Promotion"
          :loading="submitLoading"
          @click="submitShip"
        >
          确认发货
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { Close, Delete, Plus, Promotion } from "@element-plus/icons-vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  baseOrder: {
    type: Object,
    default: null,
  },
  sameAddressOrders: {
    type: Array,
    default: () => [],
  },
  sameAddressLoading: {
    type: Boolean,
    default: false,
  },
  submitLoading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "submit"]);

const selectedOrderNos = ref([]);
const trackingList = ref([""]);
const remark = ref("");

const orderOptions = computed(() => {
  const orderMap = new Map();

  if (props.baseOrder?.orderNo) {
    orderMap.set(props.baseOrder.orderNo, props.baseOrder);
  }

  props.sameAddressOrders.forEach((order) => {
    if (!order?.orderNo) return;
    orderMap.set(order.orderNo, {
      ...orderMap.get(order.orderNo),
      ...order,
    });
  });

  return Array.from(orderMap.values());
});

const fullAddress = computed(() => {
  if (!props.baseOrder) return "-";
  return [
    props.baseOrder.province,
    props.baseOrder.city,
    props.baseOrder.district,
    props.baseOrder.detailAddress,
  ].filter(Boolean).join("");
});

const selectedTotalAmount = computed(() => {
  return orderOptions.value
    .filter((order) => selectedOrderNos.value.includes(order.orderNo))
    .reduce((sum, order) => sum + Number(order.orderAmount || 0), 0);
});

const resetForm = () => {
  selectedOrderNos.value = props.baseOrder?.orderNo ? [props.baseOrder.orderNo] : [];
  trackingList.value = [""];
  remark.value = "";
};

const formatCurrency = (value) => {
  const numberValue = Number(value || 0);
  return `¥${numberValue.toFixed(2)}`;
};

const addTracking = () => {
  trackingList.value.push("");
};

const removeTracking = (index) => {
  if (trackingList.value.length === 1) return;
  trackingList.value.splice(index, 1);
};

const submitShip = () => {
  const normalizedTrackingList = trackingList.value
    .map((item) => item.trim())
    .filter(Boolean);

  if (selectedOrderNos.value.length === 0) {
    ElMessage.warning("请选择至少一个待发货订单");
    return;
  }

  if (normalizedTrackingList.length === 0) {
    ElMessage.warning("请至少填写一个运单号");
    return;
  }

  emit("submit", {
    orderList: selectedOrderNos.value,
    trackingList: normalizedTrackingList,
    remark: remark.value.trim(),
  });
};

watch(() => props.modelValue, (visible) => {
  if (visible) {
    resetForm();
  }
});

watch(() => props.baseOrder?.orderNo, () => {
  if (props.modelValue) {
    resetForm();
  }
});
</script>

<style scoped>
.ship-dialog-content {
  max-height: 80vh;
  overflow-y: auto;
  padding-right: 15px;
}

.ship-section {
  margin-top: 18px;
}

.section-title {
  margin-bottom: 10px;
  color: #0f172a;
  font-size: 15px;
  font-weight: 700;
}

.section-subtitle {
  margin-left: 8px;
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
}

.address-card {
  padding: 14px 16px;
  border: 1px solid #dbeafe;
  border-radius: 14px;
  background: #f8fafc;
}

.receiver-line {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.receiver-name {
  color: #0f172a;
  font-weight: 700;
}

.receiver-phone,
.address-text {
  color: #475569;
}

.same-address-list {
  min-height: 96px;
}

.same-address-item {
  margin-bottom: 10px;
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #ffffff;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;
}

.same-address-item--checked {
  border-color: rgba(0, 168, 107, 0.35);
  background: #f0fbf6;
}

.same-address-item :deep(.el-checkbox) {
  width: 100%;
  height: auto;
}

.same-address-item :deep(.el-checkbox__label) {
  flex: 1;
}

.order-option-content {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
}

.order-option-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.order-no {
  color: #334155;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
}

.product-name {
  color: #0f172a;
  font-weight: 600;
}

.order-option-meta {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #64748b;
  font-size: 13px;
}

.tracking-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tracking-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
}

.ship-summary {
  margin-top: 18px;
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 14px;
  color: #475569;
  background: #f8fafc;
}

.ship-summary strong {
  color: #00a86b;
  font-size: 18px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
