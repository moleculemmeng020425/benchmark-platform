<template>
  <BasicModal
    @register="register"
    title="参数分析"
    :width="750"
    :canFullscreen="false"
    :footer="null"
  >
    <a-spin :spinning="loading">
      <div class="analysis-container">
        <!-- 目标参数 -->
        <table class="analysis-table">
          <thead>
            <tr>
              <th style="width: 180px">目标参数名</th>
              <th style="width: 100px">当前值</th>
              <th style="width: 100px">最优值</th>
              <th style="width: 100px">偏差值</th>
              <th style="width: 80px">单位</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="left">{{ targetData.name }}</td>
              <td>{{ targetData.currentValue }}</td>
              <td>{{ targetData.optimalValue }}</td>
              <td :class="{ negative: targetData.deviationNum < 0, positive: targetData.deviationNum > 0 }">
                {{ targetData.deviation }}
              </td>
              <td>{{ targetData.unit }}</td>
            </tr>
          </tbody>
        </table>

        <!-- 边界参数 -->
        <div class="section-title">边界参数</div>
        <table class="analysis-table">
          <thead>
            <tr>
              <th style="width: 50px">序号</th>
              <th style="width: 160px">参数名</th>
              <th style="width: 100px">当前值</th>
              <th style="width: 100px">最优值</th>
              <th style="width: 100px">偏差值</th>
              <th style="width: 80px">单位</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in boundaryData" :key="'b-' + index">
              <td>{{ index + 1 }}</td>
              <td class="left">{{ item.name }}</td>
              <td>{{ item.currentValue }}</td>
              <td>{{ item.optimalValue }}</td>
              <td :class="{ negative: item.deviationNum < 0, positive: item.deviationNum > 0 }">
                {{ item.deviation }}
              </td>
              <td>{{ item.unit }}</td>
            </tr>
          </tbody>
        </table>

        <!-- 相关参数 -->
        <div class="section-title">相关参数</div>
        <table class="analysis-table">
          <thead>
            <tr>
              <th style="width: 50px">序号</th>
              <th style="width: 160px">参数名</th>
              <th style="width: 100px">当前值</th>
              <th style="width: 100px">最优值</th>
              <th style="width: 100px">偏差值</th>
              <th style="width: 80px">单位</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in relationData" :key="'r-' + index">
              <td>{{ index + 1 }}</td>
              <td class="left">{{ item.name }}</td>
              <td>{{ item.currentValue }}</td>
              <td>{{ item.optimalValue }}</td>
              <td :class="{ negative: item.deviationNum < 0, positive: item.deviationNum > 0 }">
                {{ item.deviation }}
              </td>
              <td>{{ item.unit }}</td>
            </tr>
            <tr v-if="relationData.length === 0">
              <td colspan="6" style="color: #999;">暂无相关参数</td>
            </tr>
          </tbody>
        </table>
      </div>
    </a-spin>
  </BasicModal>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { BasicModal, useModalInner } from '/@/components/Modal';

const props = defineProps({
  modelRecord: {
    type: Object,
    default: () => ({}),
  },
  analysisData: {
    type: Object,
    default: () => null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const [register] = useModalInner();

// 格式化数值
function formatValue(val: any): string {
  const num = Number(val);
  if (isNaN(num)) return '-';
  return num.toFixed(2);
}

// 计算偏差
function calcDeviation(current: number, optimal: number): { str: string; num: number } {
  if (!optimal || optimal === 0) return { str: '-', num: 0 };
  const deviation = current - optimal;
  const sign = deviation >= 0 ? '+' : '';
  return { str: `${sign}${deviation.toFixed(2)}`, num: deviation };
}

// 目标参数数据
const targetData = computed(() => {
  if (!props.analysisData) {
    return { name: '-', currentValue: '-', optimalValue: '-', deviation: '-', deviationNum: 0, unit: '-' };
  }
  
  const current = Number(props.analysisData.targetCurrentValue) || 0;
  const optimal = Number(props.analysisData.targetOptimalValue) || 0;
  const dev = calcDeviation(current, optimal);
  
  return {
    name: props.analysisData.targetName || '目标参数',
    currentValue: formatValue(current),
    optimalValue: formatValue(optimal),
    deviation: dev.str,
    deviationNum: dev.num,
    unit: props.analysisData.targetUnit || '-',
  };
});

// 边界参数数据
const boundaryData = computed(() => {
  if (!props.analysisData) return [];
  
  const names = props.analysisData.boundaryNames || [];
  const values = props.analysisData.boundaryCurrentValues || [];
  const units = props.analysisData.boundaryUnits || [];
  
  const result: any[] = [];
  const maxLen = Math.max(names.length, values.length);
  
  for (let i = 0; i < maxLen; i++) {
    const currentValue = Number(values[i]) || 0;
    const optimalValue = currentValue * 0.98;
    const dev = calcDeviation(currentValue, optimalValue);
    
    result.push({
      name: names[i] || `边界参数${i + 1}`,
      currentValue: formatValue(currentValue),
      optimalValue: formatValue(optimalValue),
      deviation: dev.str,
      deviationNum: dev.num,
      unit: units[i] || '-',
    });
  }
  
  return result;
});

// 相关参数数据
const relationData = computed(() => {
  if (!props.analysisData) return [];
  
  const names = props.analysisData.relationNames || [];
  const values = props.analysisData.relationCurrentValues || [];
  const units = props.analysisData.relationUnits || [];
  
  const result: any[] = [];
  const maxLen = Math.max(names.length, values.length);
  
  for (let i = 0; i < maxLen; i++) {
    const currentValue = Number(values[i]) || 0;
    const optimalValue = currentValue * 0.98;
    const dev = calcDeviation(currentValue, optimalValue);
    
    result.push({
      name: names[i] || `相关参数${i + 1}`,
      currentValue: formatValue(currentValue),
      optimalValue: formatValue(optimalValue),
      deviation: dev.str,
      deviationNum: dev.num,
      unit: units[i] || '-',
    });
  }
  
  return result;
});
</script>

<style lang="less" scoped>
.analysis-container {
  padding: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 24px 0 12px;
  padding-left: 8px;
  border-left: 3px solid #1890ff;
}

.analysis-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #e8e8e8;
  
  th, td {
    padding: 12px 8px;
    text-align: center;
    border: 1px solid #e8e8e8;
  }
  
  th {
    background: #fafafa;
    font-weight: 600;
    color: #333;
  }
  
  td.left {
    text-align: left;
  }
  
  .positive {
    color: #f5222d;
  }
  
  .negative {
    color: #52c41a;
  }
}
</style>
