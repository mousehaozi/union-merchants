<template>
  <el-dialog
    :model-value="modelValue"
    title="订单物流"
    width="760px"
    align-center
    :destroy-on-close="true"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="logistics-dialog-content" v-loading="loading">
      <el-empty
        v-if="!loading && logisticsList.length === 0"
        description="暂无物流信息"
      />

      <template v-else>
        <section class="logistics-summary">
          <div class="summary-item">
            <span class="summary-label">订单编号</span>
            <span class="summary-value mono-text">{{ orderNo || "-" }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">物流数量</span>
            <span class="summary-value">{{ logisticsList.length }} 个</span>
          </div>
        </section>

        <el-tabs
          v-if="logisticsList.length > 1"
          v-model="activeTrackingNo"
          class="logistics-tabs"
        >
          <el-tab-pane
            v-for="item in logisticsList"
            :key="getLogisticsKey(item)"
            :name="getLogisticsKey(item)"
            :label="getLogisticsTabLabel(item)"
          />
        </el-tabs>

        <section v-if="currentLogistics" class="logistics-card">
          <div class="logistics-card__header">
            <div class="logistics-title">
              <el-icon><Van /></el-icon>
              <span>{{ currentLogistics.comName || "物流信息" }}</span>
            </div>
            <el-tag :type="getStateTagType(currentLogistics.state)" effect="light">
              {{ getStateText(currentLogistics.state) }}
            </el-tag>
          </div>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="运单号">
              <span class="mono-text">{{ currentLogistics.trackingNo || "-" }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="物流公司">
              {{ currentLogistics.comName || currentLogistics.comCode || "-" }}
            </el-descriptions-item>
          </el-descriptions>
        </section>

        <section v-if="currentLogistics" class="logistics-card">
          <div class="logistics-card__title">物流轨迹</div>
          <div v-if="currentTraces.length" class="trace-container">
            <el-timeline class="trace-timeline">
              <el-timeline-item
                v-for="(trace, index) in currentTraces"
                :key="`${trace.time || trace.ftime || index}-${index}`"
                :timestamp="formatTraceTime(trace)"
                placement="top"
                :type="index === 0 ? 'success' : 'primary'"
              >
                <div class="trace-content">{{ trace.context || "-" }}</div>
                <div v-if="trace.areaName || trace.status" class="trace-meta">
                  <span v-if="trace.areaName">{{ trace.areaName }}</span>
                  <span v-if="trace.status">{{ trace.status }}</span>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>
          <el-empty v-else description="暂无物流轨迹" :image-size="72" />
        </section>
      </template>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button
          plain
          :icon="Refresh"
          :loading="loading"
          @click="loadLogistics"
        >
          刷新
        </el-button>
        <el-button :icon="Close" @click="emit('update:modelValue', false)">
          关闭
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { Close, Refresh, Van } from "@element-plus/icons-vue";
import { getMerchantOrderLogistics } from "@/api/orderApi.js";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  orderNo: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:modelValue"]);

const loading = ref(false);
const logisticsList = ref([]);
const activeTrackingNo = ref("");

const getLogisticsKey = (item) => {
  return item?.trackingNo || item?.comCode || item?.comName || item?.orderNo || "";
};

const currentLogistics = computed(() => {
  if (logisticsList.value.length === 0) return null;
  return (
    logisticsList.value.find((item) => getLogisticsKey(item) === activeTrackingNo.value) ||
    logisticsList.value[0]
  );
});

const currentTraces = computed(() => {
  const traces = Array.isArray(currentLogistics.value?.traces)
    ? currentLogistics.value.traces
    : [];
  return [...traces].sort((left, right) => {
    const leftTime = getTraceTimestamp(left);
    const rightTime = getTraceTimestamp(right);
    if (!leftTime || !rightTime) return 0;
    return rightTime - leftTime;
  });
});

const normalizeList = (value) => {
  return Array.isArray(value) ? value.filter(Boolean) : [];
};

const syncActiveTrackingNo = () => {
  const firstItem = logisticsList.value[0];
  activeTrackingNo.value = firstItem ? getLogisticsKey(firstItem) : "";
};

const loadLogistics = async () => {
  if (!props.orderNo) {
    logisticsList.value = [];
    activeTrackingNo.value = "";
    return;
  }

  loading.value = true;
  try {
    const res = await getMerchantOrderLogistics(props.orderNo);
    if (res && (res.code === 200 || res.code === 0)) {
      logisticsList.value = normalizeList(res.data);
      syncActiveTrackingNo();
    } else {
      logisticsList.value = [];
      syncActiveTrackingNo();
      ElMessage.error(res?.message || "查询物流失败");
    }
  } catch (err) {
    logisticsList.value = [];
    syncActiveTrackingNo();
    console.error("查询物流错误:", err);
    ElMessage.error(err?.message || "查询物流失败");
  } finally {
    loading.value = false;
  }
};

const getLogisticsTabLabel = (item) => {
  const companyText = item?.comName || item?.comCode || "物流";
  return item?.trackingNo ? `${companyText} ${item.trackingNo}` : companyText;
};

const getStateText = (state) => {
  const map = {
    0: "在途",
    1: "揽收",
    2: "疑难",
    3: "签收",
    4: "退签",
    5: "派件",
    6: "退回",
    7: "转投",
    10: "待清关",
    11: "清关中",
    12: "已清关",
    13: "清关异常",
    14: "拒签",
  };
  return map[state] || state || "未知";
};

const getStateTagType = (state) => {
  const map = {
    1: "primary",
    3: "success",
    5: "warning",
    2: "danger",
    4: "danger",
    6: "danger",
    13: "danger",
    14: "danger",
  };
  return map[state] || "info";
};

const formatTraceTime = (trace) => {
  return trace?.ftime || trace?.time || "-";
};

const getTraceTimestamp = (trace) => {
  const value = trace?.time || trace?.ftime;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

watch(
  () => [props.modelValue, props.orderNo],
  ([visible]) => {
    if (visible) {
      loadLogistics();
    }
  },
);
</script>

<style scoped>
.logistics-dialog-content {
  max-height: 80vh;
  overflow-y: auto;
  padding-right: 15px;
}

.logistics-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.summary-item {
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

.summary-label {
  display: block;
  margin-bottom: 6px;
  color: #64748b;
  font-size: 12px;
}

.summary-value {
  display: block;
  color: #0f172a;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logistics-tabs {
  margin-bottom: 16px;
}

.logistics-card {
  margin-bottom: 16px;
}

.logistics-card:last-child {
  margin-bottom: 0;
}

.logistics-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.logistics-card__title {
  margin-bottom: 10px;
  color: #0f172a;
  font-size: 15px;
  font-weight: 700;
}

.logistics-title {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #0f172a;
  font-size: 15px;
  font-weight: 700;
}

.trace-container {
  max-height: 360px;
  overflow-y: auto;
  padding: 12px 12px 4px 0;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.trace-timeline {
  padding: 0 0 0 12px;
}

.trace-content {
  color: #0f172a;
  line-height: 1.6;
}

.trace-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
  color: #64748b;
  font-size: 12px;
}

.mono-text {
  color: #334155;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

@media (max-width: 768px) {
  .logistics-summary {
    grid-template-columns: 1fr;
  }
}
</style>
