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
import { getOptimisticApi, getBenchmarkHistoryApi, getExaHistoryApi } from '/@/api/benchmark/models';

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

async function fetchTrendByParams(params: { modelId: number; st?: string; et?: string }) {
  try {
    trendLoading.value = true;

    // 蓝线：SQL
    const bestResp = await getBenchmarkHistoryApi(params);
    trendData.value = normalizeTimeValue(unwrapList(bestResp));

    // 黄线：EXA
    const exaResp = await getExaHistoryApi(params);
    realtimeTrendData.value = normalizeTimeValue(unwrapList(exaResp));
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
