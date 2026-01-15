<template>
  <PageWrapper contentFullHeight>
    <a-card>
      <UnitSelect @option-selected="handleOptionSelected" />
      <BasicTable @register="optimisticTable">
        <template #action="{ record }">
          <TableAction
            :actions="[
              {
                label: '趋势',
                onClick: () => handleTrendClick(record),
              },
              {
                label: '分析',
                onClick: () => handleAnalysisClick(record),
              },
            ]"
          />
        </template>
      </BasicTable>
    </a-card>

    <TrendModal
      @register="registerModal"
      :data="trendData"
      :realtimeData="realtimeTrendData"
      :loading="trendLoading"
      :modelRecord="currentRecord"
      :optimalType="currentOptimalType"
      @time-range-change="onTrendRangeChange"
      @time-range-query="onTrendRangeQuery"
    />

    <AnalysisModal
      @register="registerAnalysisModal"
      :modelRecord="currentRecord"
      :analysisData="analysisData"
      :loading="analysisLoading"
    />
  </PageWrapper>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { PageWrapper } from '/@/components/Page';
import { BasicTable, useTable, TableAction } from '/@/components/Table';
import type { BasicColumn } from '/@/components/Table/src/types/table';
import { useModal } from '/@/components/Modal';
import dayjs from 'dayjs';

import UnitSelect from './UnitSelect.vue';
import TrendModal from './TrendModal.vue';
import AnalysisModal from './AnalysisModal.vue';
import { getOptimisticApi, getBenchmarkHistoryApi, getExaHistoryApi, modelInfoApi } from '/@/api/benchmark/models';

// ========== state ==========
const loading = ref<boolean>(false);
const selectData = ref<any>(null);
const systemId = ref<any>(null);
const search = ref<any>(null);
const st = ref<string>('');
const et = ref<string>('');

const trendData = ref<any[]>([]); // 蓝线：SQL（benchmark_history）
const realtimeTrendData = ref<any[]>([]); // 黄线：EXA
const currentRecord = ref<any>(null);
const trendLoading = ref<boolean>(false);

// 分析弹窗相关
const analysisData = ref<any>(null);
const analysisLoading = ref<boolean>(false);

// 当前模型的寻优类型
const currentOptimalType = ref<'min' | 'max'>('min');

// ========== table ==========
const tableSchema: BasicColumn[] = [
  { title: '目标参数名称', dataIndex: 'targetName' },
  { title: '边界参数名称', dataIndex: 'boundaryName' },
  { title: '当前目标值', dataIndex: 'targetValue' },
  { title: '当前边界值\t', dataIndex: 'boundaryValue' },
  {
    title: '历史最优值\t',
    dataIndex: 'historyBest',
    width: '600px',
    customRender: ({ text }: any) => {
      if (typeof text === 'string' && text.startsWith('[[') && text.endsWith(']]')) {
        try {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed) && Array.isArray(parsed[0]) && typeof parsed[0][0] === 'number') {
            return parsed[0][0];
          }
        } catch (e) {
          return text;
        }
      }
      return text;
    },
  },
  { title: '操作', key: 'action', width: 120, slots: { customRender: 'action' } },
];

const [optimisticTable, { setTableData }] = useTable({
  columns: tableSchema,
  pagination: true,
  bordered: true,
  canResize: false,
});

// ========== modal ==========
const [registerModal, { openModal }] = useModal();
const [registerAnalysisModal, { openModal: openAnalysisModal }] = useModal();

// ========== helpers ==========
function unwrapList(resp: any): any[] {
  if (Array.isArray(resp)) return resp;
  if (resp && Array.isArray(resp.result)) return resp.result;
  return [];
}

function normalizeTimeValue(list: any[]): any[] {
  return (list || [])
    .filter((x: any) => x && x.time != null)
    .map((x: any) => ({
      time: x.time,
      value: x.value == null ? null : Number(x.value),
    }));
}

/**
 * 根据边界参数当前值计算网格索引
 * @param currentValue 当前值
 * @param lowerLimit 下限
 * @param upperLimit 上限
 * @param gridNumber 网格数
 * @returns 网格索引 (从0开始)
 */
function calculateGridIndex(
  currentValue: number,
  lowerLimit: number,
  upperLimit: number,
  gridNumber: number
): number {
  if (gridNumber <= 0 || upperLimit <= lowerLimit) return 0;

  // 处理边界情况
  if (currentValue <= lowerLimit) return 0;
  if (currentValue >= upperLimit) return gridNumber - 1;

  const gridSize = (upperLimit - lowerLimit) / gridNumber;
  const index = Math.floor((currentValue - lowerLimit) / gridSize);

  // 确保索引在有效范围内
  return Math.min(Math.max(0, index), gridNumber - 1);
}

/**
 * 根据边界参数配置和当前值计算 B_ID
 * @param boundaryParams 边界参数配置数组
 * @param boundaryValues 边界参数当前值数组
 * @returns B_ID 字符串，格式如 "B-3-9" 或 "3-9"
 */
function calculateBID(
  boundaryParams: Array<{ lowerlimit: number; upperlimit: number; gridNumber: number }>,
  boundaryValues: number[]
): string {
  if (!boundaryParams || boundaryParams.length === 0 || !boundaryValues || boundaryValues.length === 0) {
    return '';
  }

  const gridIndices: number[] = [];

  for (let i = 0; i < boundaryParams.length && i < boundaryValues.length; i++) {
    const param = boundaryParams[i];
    const value = boundaryValues[i];

    const gridIndex = calculateGridIndex(
      value,
      Number(param.lowerlimit) || 0,
      Number(param.upperlimit) || 100,
      Number(param.gridNumber) || 10
    );

    gridIndices.push(gridIndex);
  }

  // 返回格式如 "B-3-9" 或根据后端要求调整
  return 'B-' + gridIndices.join('-');
}

// ========== main ==========
async function getOptimistic() {
  const params = {
    id: systemId.value,
    search: search.value,
    st: st.value,
    et: et.value,
  };
  const result = await getOptimisticApi(params);
  setTableData(result);
}

function handleOptionSelected(values: any) {
  selectData.value = values;
  systemId.value = values['system'];
  search.value = values['name'];

  const [startDate, endDate] = values['time'];
  st.value = dayjs(startDate.toDate()).format('YYYY-MM-DD HH:mm:ss');
  et.value = dayjs(endDate.toDate()).format('YYYY-MM-DD HH:mm:ss');

  getOptimistic();
}

/**
 * 解析边界参数值字符串/数组为数值数组
 */
function parseBoundaryValues(boundaryValue: any): number[] {
  if (!boundaryValue) return [];

  const bvStr = String(boundaryValue);
  if (bvStr.startsWith('[')) {
    try {
      return JSON.parse(bvStr).map(Number);
    } catch {
      return bvStr.replace(/[\[\]]/g, '').split(',').map(Number);
    }
  }
  return bvStr.split(',').map(Number);
}

async function fetchTrendByParams(params: { modelId: number; st?: string; et?: string }) {
  try {
    trendLoading.value = true;

    // 获取模型信息，以便获取边界参数配置
    const modelInfo = await modelInfoApi(params.modelId);
    const boundaryParams = modelInfo?.boundaryParameter || [];
    const optimalType = modelInfo?.movingWindows?.optimalType || 'min';

    // 更新当前寻优类型供 TrendModal 使用
    currentOptimalType.value = optimalType as 'min' | 'max';

    // 黄线：EXA 实时数据（包含边界参数实时值）
    const exaResp = await getExaHistoryApi(params);
    const exaList = unwrapList(exaResp);
    realtimeTrendData.value = normalizeTimeValue(exaList);

    // TODO: 后端支持 b_id 和 type 参数后，将此开关设为 true
    const ENABLE_BID_FILTER = false;

    // 蓝线：获取历史最优值
    let bestResp;

    if (ENABLE_BID_FILTER && boundaryParams.length > 0) {
      // 获取当前边界参数的实时值
      let currentBoundaryValues: number[] = [];

      if (currentRecord.value?.boundaryValue) {
        currentBoundaryValues = parseBoundaryValues(currentRecord.value.boundaryValue);
      } else if (exaList.length > 0) {
        const latestExa = exaList[exaList.length - 1];
        if (latestExa?.boundaryValues) {
          currentBoundaryValues = parseBoundaryValues(latestExa.boundaryValues);
        }
      }

      const bId = calculateBID(boundaryParams, currentBoundaryValues);
      console.log('计算得到的 B_ID:', bId, '边界参数值:', currentBoundaryValues);

      // 带 B_ID 和 type 参数请求
      const benchmarkParams = {
        ...params,
        b_id: bId,
        type: optimalType,
      };
      bestResp = await getBenchmarkHistoryApi(benchmarkParams);
    } else {
      // 原始请求（不带 B_ID 筛选）
      bestResp = await getBenchmarkHistoryApi(params);
    }

    trendData.value = normalizeTimeValue(unwrapList(bestResp));

  } catch (error) {
    console.error('获取或显示趋势数据时出错:', error);
    trendData.value = [];
    realtimeTrendData.value = [];
  } finally {
    trendLoading.value = false;
  }
}

/** radio 快捷范围：7d/3d/1d */
async function fetchTrendData(range: string) {
  if (!currentRecord.value?.modelId) {
    console.error('无法获取趋势数据：当前记录无效');
    return;
  }

  const endTime = dayjs();
  let startTime = endTime.subtract(3, 'days');

  if (range === '7d') startTime = endTime.subtract(7, 'days');
  else if (range === '3d') startTime = endTime.subtract(3, 'days');
  else if (range === '1d') startTime = endTime.subtract(1, 'day');

  await fetchTrendByParams({
    modelId: currentRecord.value.modelId,
    st: startTime.format('YYYY-MM-DD HH:mm:ss'),
    et: endTime.format('YYYY-MM-DD HH:mm:ss'),
  });
}

function onTrendRangeChange(range: string) {
  fetchTrendData(range);
}

/** 自定义时间段（TrendModal 点击“查询”触发） */
function onTrendRangeQuery(payload: { st: string; et: string }) {
  if (!currentRecord.value?.modelId) {
    console.error('无法获取趋势数据：当前记录无效');
    return;
  }

  fetchTrendByParams({
    modelId: currentRecord.value.modelId,
    st: payload.st,
    et: payload.et,
  });
}

async function handleTrendClick(record: any) {
  currentRecord.value = record;
  openModal(true, {});
  await fetchTrendData('3d');
}

async function handleAnalysisClick(record: any) {
  currentRecord.value = record;
  analysisLoading.value = true;
  
  console.log('分析按钮点击，record:', record);
  
  try {
    // 解析边界参数名称
    let boundaryNames: string[] = [];
    if (record.boundaryName) {
      // boundaryName 格式可能是 ["参数1","参数2"] 或 "参数1,参数2"
      if (record.boundaryName.startsWith('[')) {
        try {
          boundaryNames = JSON.parse(record.boundaryName);
        } catch {
          boundaryNames = record.boundaryName.split(',');
        }
      } else {
        boundaryNames = record.boundaryName.split(',');
      }
    }
    
    // 解析边界参数当前值
    let boundaryValues: number[] = [];
    if (record.boundaryValue) {
      // boundaryValue 格式可能是 [1,2] 或 "1,2"
      const bvStr = String(record.boundaryValue);
      if (bvStr.startsWith('[')) {
        try {
          boundaryValues = JSON.parse(bvStr);
        } catch {
          boundaryValues = bvStr.replace(/[\[\]]/g, '').split(',').map(Number);
        }
      } else {
        boundaryValues = bvStr.split(',').map(Number);
      }
    }
    
    // 解析历史最优值
    let optimalValue = 0;
    if (record.historyBest) {
      const hbStr = String(record.historyBest);
      if (hbStr.startsWith('[[')) {
        try {
          const parsed = JSON.parse(hbStr);
          optimalValue = parsed[0]?.[0] || 0;
        } catch {
          optimalValue = Number(hbStr) || 0;
        }
      } else {
        optimalValue = Number(hbStr) || 0;
      }
    }
    
    // 解析单位
    let targetUnit = record.targetUnit || '';
    let boundaryUnits: string[] = [];
    if (record.boundaryUnit) {
      const buStr = String(record.boundaryUnit);
      if (buStr.startsWith('[')) {
        try {
          boundaryUnits = JSON.parse(buStr);
        } catch {
          boundaryUnits = buStr.replace(/[\[\]]/g, '').split(',');
        }
      }
    }
    
    // 解析相关参数（如果有的话）
    let relationNames: string[] = [];
    let relationValues: number[] = [];
    let relationUnits: string[] = [];
    
    if (record.relationName) {
      const rnStr = String(record.relationName);
      if (rnStr.startsWith('[')) {
        try {
          relationNames = JSON.parse(rnStr);
        } catch {
          relationNames = rnStr.replace(/[\[\]]/g, '').split(',');
        }
      } else {
        relationNames = rnStr.split(',');
      }
    }
    
    if (record.relationValue) {
      const rvStr = String(record.relationValue);
      if (rvStr.startsWith('[')) {
        try {
          relationValues = JSON.parse(rvStr);
        } catch {
          relationValues = rvStr.replace(/[\[\]]/g, '').split(',').map(Number);
        }
      } else {
        relationValues = rvStr.split(',').map(Number);
      }
    }
    
    if (record.relationUnit) {
      const ruStr = String(record.relationUnit);
      if (ruStr.startsWith('[')) {
        try {
          relationUnits = JSON.parse(ruStr);
        } catch {
          relationUnits = ruStr.replace(/[\[\]]/g, '').split(',');
        }
      }
    }
    
    analysisData.value = {
      targetName: record.targetName || '目标参数',
      targetCurrentValue: Number(record.targetValue) || 0,
      targetOptimalValue: optimalValue,
      targetUnit: targetUnit,
      boundaryNames: boundaryNames,
      boundaryCurrentValues: boundaryValues,
      boundaryUnits: boundaryUnits,
      relationNames: relationNames,
      relationCurrentValues: relationValues,
      relationUnits: relationUnits,
    };
    
    console.log('分析数据:', analysisData.value);
    
    openAnalysisModal(true, {});
  } catch (error) {
    console.error('获取分析数据时出错:', error);
  } finally {
    analysisLoading.value = false;
  }
}
</script>
