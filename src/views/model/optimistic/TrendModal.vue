<template>
  <BasicModal
    @register="registerModal"
    title="历史最优值趋势"
    :width="900"
    :minHeight="600"
    :showOkBtn="false"
    :showCancelBtn="false"
  >
    <div class="p-4">
      <ARadioGroup v-model:value="selectedRange" button-style="solid" @change="onRangeChange">
        <ARadioButton value="7d">最近七天</ARadioButton>
        <ARadioButton value="3d">最近三天</ARadioButton>
        <ARadioButton value="1d">最近一天</ARadioButton>
      </ARadioGroup>

      <div class="mt-4" style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
        <span>开始时间</span>
        <ADatePicker
          v-model:value="startTime"
          show-time
          format="YYYY-MM-DD HH:mm:ss"
          valueFormat="YYYY-MM-DD HH:mm:ss"
          placeholder="请选择开始时间"
        />

        <span>结束时间</span>
        <ADatePicker
          v-model:value="endTime"
          show-time
          format="YYYY-MM-DD HH:mm:ss"
          valueFormat="YYYY-MM-DD HH:mm:ss"
          placeholder="请选择结束时间"
        />

        <AButton type="primary" @click="onQuery">查询</AButton>
      </div>
    </div>

    <div :style="{ width: '100%', height: '350px' }">
      <div class="h-full flex justify-center items-center" v-if="loading">
        <ASpin size="large" />
      </div>

      <div class="h-full flex justify-center items-center" v-else-if="isEmpty">
        <AEmpty description="暂无数据" />
      </div>

      <div ref="chartRef" :style="{ width: '100%', height: '350px' }" v-show="!loading && !isEmpty"></div>
    </div>

    <!-- 数值对比区域 -->
    <div class="value-comparison p-4" v-if="!loading && !isEmpty">
      <ADivider>数值对比</ADivider>
      
      <!-- 目标参数对比 -->
      <div class="comparison-section">
        <ADescriptions bordered :column="2" size="small">
          <ADescriptionsItem label="目标参数">{{ modelRecord?.targetName || '-' }}</ADescriptionsItem>
          <ADescriptionsItem label="优化方向">{{ optimizeDirection }}</ADescriptionsItem>
          <ADescriptionsItem label="当前实时值">
            <span :class="valueCompareClass">{{ latestRealValue ?? '-' }}</span>
          </ADescriptionsItem>
          <ADescriptionsItem label="历史最优值">
            <span class="best-value">{{ latestBestValue ?? '-' }}</span>
          </ADescriptionsItem>
          <ADescriptionsItem label="差值">
            <span :class="diffClass">{{ valueDiff }}</span>
          </ADescriptionsItem>
          <ADescriptionsItem label="状态">
            <ATag :color="statusColor">{{ statusText }}</ATag>
          </ADescriptionsItem>
        </ADescriptions>
      </div>

      <!-- 边界参数 -->
      <div class="comparison-section mt-4" v-if="modelRecord?.boundaryName">
        <div class="section-title">边界参数</div>
        <ADescriptions bordered :column="1" size="small">
          <ADescriptionsItem label="边界参数名称">{{ modelRecord?.boundaryName || '-' }}</ADescriptionsItem>
          <ADescriptionsItem label="当前边界值">{{ modelRecord?.boundaryValue || '-' }}</ADescriptionsItem>
        </ADescriptions>
      </div>
    </div>
  </BasicModal>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue';
import type { PropType } from 'vue';
import { BasicModal, useModalInner } from '/@/components/Modal';
import { useECharts } from '/@/hooks/web/useECharts';
import dayjs from 'dayjs';
import { Radio, DatePicker, Button, Spin, Empty, message, Divider, Descriptions, Tag } from 'ant-design-vue';

type Point = { time: any; value: number | null };
type ModelRecord = {
  modelId?: number;
  targetName?: string;
  boundaryName?: string;
  targetValue?: string;
  boundaryValue?: string;
  historyBest?: string;
};

const props = defineProps({
  data: { type: Array as PropType<Point[]>, default: () => [] }, // best
  realtimeData: { type: Array as PropType<Point[]>, default: () => [] }, // real
  loading: { type: Boolean, default: false },
  modelRecord: { type: Object as PropType<ModelRecord>, default: () => ({}) },
  optimalType: { type: String as PropType<'min' | 'max'>, default: 'min' }, // 寻优类型
});

const emit = defineEmits<{
  (e: 'time-range-change', range: string): void;
  (e: 'time-range-query', payload: { st: string; et: string }): void;
}>();

const ARadioGroup = Radio.Group;
const ARadioButton = Radio.Button;
const ADatePicker = DatePicker;
const AButton = Button;
const ASpin = Spin;
const AEmpty = Empty;
const ADivider = Divider;
const ADescriptions = Descriptions;
const ADescriptionsItem = Descriptions.Item;
const ATag = Tag;

const selectedRange = ref<'7d' | '3d' | '1d'>('3d');

const startTime = ref<string | undefined>(undefined);
const endTime = ref<string | undefined>(undefined);

function onRangeChange(e: any) {
  const v = e?.target?.value;
  selectedRange.value = v;
  emit('time-range-change', v);
}

function onQuery() {
  if (!startTime.value || !endTime.value) {
    message.warning('请选择开始时间和结束时间');
    return;
  }
  const st = dayjs(startTime.value);
  const et = dayjs(endTime.value);
  if (!st.isValid() || !et.isValid()) {
    message.warning('时间格式不合法');
    return;
  }
  if (st.isAfter(et)) {
    message.warning('开始时间不能晚于结束时间');
    return;
  }
  emit('time-range-query', { st: startTime.value, et: endTime.value });
}

const isEmpty = computed(() => (props.data?.length ?? 0) === 0 && (props.realtimeData?.length ?? 0) === 0);

const chartRef = ref<HTMLDivElement | null>(null);
const { setOptions, resize } = useECharts(chartRef as any);

const [registerModal] = useModalInner(async () => {
  await nextTick();
  resize?.();
});

watch(
  () => [props.data, props.realtimeData, props.loading],
  async ([bestData, realData, loading]) => {
    if (loading) return;

    const best = Array.isArray(bestData) ? bestData : [];
    const real = Array.isArray(realData) ? realData : [];

    if (best.length === 0 && real.length === 0) return;

    // ===== 1) 统一转成 ts，并过滤掉未来点 =====
    const nowTs = dayjs().valueOf();

    const toTs = (t: any): number | null => {
      if (t == null) return null;
      // 如果后端给的是 number（毫秒/秒），你可以在这里判一下数量级
      if (typeof t === 'number') {
        // 经验：秒级通常是 10位，毫秒是 13位
        const n = t < 1e12 ? t * 1000 : t;
        return Number.isFinite(n) ? n : null;
      }
      const s = String(t).trim();
      if (!s) return null;
      // 兼容 "YYYY-MM-DD HH:mm:ss"
      const d = dayjs(s);
      return d.isValid() ? d.valueOf() : null;
    };

    const bestPts = best
      .map((i) => ({ ts: toTs(i?.time), v: i?.value ?? null }))
      .filter((p) => p.ts != null && p.ts <= nowTs)
      .sort((a, b) => (a.ts! - b.ts!)) as { ts: number; v: number | null }[];

    const realPts = real
      .map((i) => ({ ts: toTs(i?.time), v: i?.value ?? null }))
      .filter((p) => p.ts != null && p.ts <= nowTs)
      .sort((a, b) => (a.ts! - b.ts!)) as { ts: number; v: number | null }[];

    // ===== 2) x轴只用"主曲线"的时间（优先 real），不会引入额外未来刻度 =====
    const xPts = realPts.length > 0 ? realPts : bestPts;
    const xTsArr = Array.from(new Set(xPts.map((p) => p.ts))).sort((a, b) => a - b);

    // 兜底：过滤后可能为空
    if (xTsArr.length === 0) return;

    const xLabels = xTsArr.map((ts) => dayjs(ts).format('YYYY-MM-DD HH:mm:ss'));

    // ===== 3) real：按自己的时间轴直接映射 =====
    const realMap = new Map<number, number | null>();
    realPts.forEach((p) => realMap.set(p.ts, p.v));
    const realSeries = xTsArr.map((ts) => (realMap.has(ts) ? realMap.get(ts)! : null));

    // ===== 4) best：按时间"向后填充"(last observation carried forward)
    // 不再用字符串精确匹配，改成 <= 的指针推进，解决"差几秒/毫秒对不上"的问题
    let bestIdx = 0;
    let lastBest: number | null = null;
    const bestSeries = xTsArr.map((ts) => {
      while (bestIdx < bestPts.length && bestPts[bestIdx].ts <= ts) {
        lastBest = bestPts[bestIdx].v;
        bestIdx++;
      }
      return lastBest; // 没出现过 best 点之前会是 null；出现过之后就始终有值
    });

    // ===== 5) 画图 =====
    setOptions(
      {
        tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
        legend: { data: ['历史最优值', '历史值'] },
        xAxis: { type: 'category', data: xLabels },
        yAxis: { type: 'value', name: '值' },
        series: [
          { 
            name: '历史最优值', 
            type: 'line', 
            smooth: true, 
            showSymbol: false, 
            data: bestSeries,
            lineStyle: { color: '#1890ff' },
            itemStyle: { color: '#1890ff' }
          },
          { 
            name: '历史值', 
            type: 'line', 
            smooth: true, 
            showSymbol: false, 
            data: realSeries,
            lineStyle: { color: '#faad14' },
            itemStyle: { color: '#faad14' }
          },
        ],
      } as any
    );

    await nextTick();
    resize?.();
  },
  { immediate: true }
);

// ===== 数值对比计算属性 =====

// 获取最新的实时值
const latestRealValue = computed(() => {
  const real = props.realtimeData || [];
  if (real.length === 0) return null;
  const sorted = [...real].filter(p => p?.value != null).sort((a, b) => {
    const ta = dayjs(a.time).valueOf();
    const tb = dayjs(b.time).valueOf();
    return tb - ta; // 降序，最新的在前
  });
  return sorted.length > 0 ? Number(sorted[0].value).toFixed(4) : null;
});

// 获取最新的最优值
const latestBestValue = computed(() => {
  const best = props.data || [];
  if (best.length === 0) return null;
  const sorted = [...best].filter(p => p?.value != null).sort((a, b) => {
    const ta = dayjs(a.time).valueOf();
    const tb = dayjs(b.time).valueOf();
    return tb - ta; // 降序，最新的在前
  });
  return sorted.length > 0 ? Number(sorted[0].value).toFixed(4) : null;
});

// 优化方向（目标值越低越好 = min，越高越好 = max）
const optimizeDirection = computed(() => {
  return props.optimalType === 'max' ? '越高越好' : '越低越好';
});

// 差值计算
const valueDiff = computed(() => {
  const real = latestRealValue.value;
  const best = latestBestValue.value;
  if (real == null || best == null) return '-';
  const diff = parseFloat(real) - parseFloat(best);
  const sign = diff > 0 ? '+' : '';
  return `${sign}${diff.toFixed(4)}`;
});

// 值对比样式类
const valueCompareClass = computed(() => {
  const real = latestRealValue.value;
  const best = latestBestValue.value;
  if (real == null || best == null) return '';
  const diff = parseFloat(real) - parseFloat(best);
  // 根据 optimalType 判断好坏
  // min: 实时值小于最优值是好的（diff < 0）
  // max: 实时值大于最优值是好的（diff > 0）
  if (props.optimalType === 'max') {
    return diff > 0 ? 'value-good' : 'value-bad';
  }
  return diff > 0 ? 'value-bad' : 'value-good';
});

// 差值样式类
const diffClass = computed(() => {
  const real = latestRealValue.value;
  const best = latestBestValue.value;
  if (real == null || best == null) return '';
  const diff = parseFloat(real) - parseFloat(best);
  // 根据 optimalType 判断差值的好坏
  if (props.optimalType === 'max') {
    return diff > 0 ? 'diff-good' : 'diff-bad';
  }
  return diff > 0 ? 'diff-bad' : 'diff-good';
});

// 判断当前值是否优于最优值
const isCurrentBetter = computed(() => {
  const real = latestRealValue.value;
  const best = latestBestValue.value;
  if (real == null || best == null) return null;
  const realNum = parseFloat(real);
  const bestNum = parseFloat(best);
  // min: 越小越好，realNum < bestNum 表示更优
  // max: 越大越好，realNum > bestNum 表示更优
  if (props.optimalType === 'max') {
    return realNum > bestNum;
  }
  return realNum < bestNum;
});

// 状态文字
const statusText = computed(() => {
  const real = latestRealValue.value;
  const best = latestBestValue.value;
  if (real == null || best == null) return '数据不足';
  const diff = Math.abs(parseFloat(real) - parseFloat(best));

  if (isCurrentBetter.value) return '优于最优值';
  if (diff < 5) return '接近最优值';
  return '需要优化';
});

// 状态颜色
const statusColor = computed(() => {
  const real = latestRealValue.value;
  const best = latestBestValue.value;
  if (real == null || best == null) return 'default';
  const diff = Math.abs(parseFloat(real) - parseFloat(best));

  if (isCurrentBetter.value) return 'success';
  if (diff < 5) return 'warning';
  return 'error';
});

</script>

<style lang="less" scoped>
.value-comparison {
  background: #fafafa;
  border-radius: 8px;
  margin-top: 8px;
}

.comparison-section {
  margin-bottom: 16px;
}

.section-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.best-value {
  color: #1890ff;
  font-weight: 600;
}

.value-good {
  color: #52c41a;
  font-weight: 600;
}

.value-bad {
  color: #ff4d4f;
  font-weight: 600;
}

.diff-good {
  color: #52c41a;
  font-weight: 600;
}

.diff-bad {
  color: #ff4d4f;
  font-weight: 600;
}
</style>
