import { defHttp } from '/@/utils/http/axios';
import { ModelCardItem, ModelQueryParams, ModelInfo } from './model/models';

enum Api {
  MODEL_CARD_LIST = '/model/card/list',
  MODEL_INFO = '/model/info/',
  MODEL_SAVE = '/model/',
  MODEL_DATA = '/model/data/',
  CALCULATE_BACK = '/model/data/calculate/',
  OPTIMISTIC = '/optimistic',
  BENCHMARK_HISTORY = '/benchmark/history',
}
export const modelCardListApi = (params?: ModelQueryParams) =>
  defHttp.get<ModelCardItem[]>({ url: Api.MODEL_CARD_LIST, params });

export const modelInfoApi = (id: any) => defHttp.get<ModelInfo>({ url: Api.MODEL_INFO + id });

export const updateModelInfo = (params: any) =>
  defHttp.patch<Boolean>({ url: Api.MODEL_INFO, params });

export const modelSaveApi = (params?: any) =>
  defHttp.post<number>({ url: Api.MODEL_SAVE, data: params });

export const modelDataApi = (id: any, params: any) =>
  defHttp.get<any>({ url: Api.MODEL_DATA + id, params });

export const calculateBackApi = (id: any, params: any) =>
  defHttp.post<boolean>({ url: Api.CALCULATE_BACK + id, params });
export const getOptimisticApi = (params: any) =>
  defHttp.get<any>({ url: Api.OPTIMISTIC, params, timeout: 10000 });

export const getBenchmarkHistoryApi = (params: any) =>
  defHttp.get<any>({ url: Api.BENCHMARK_HISTORY, params, timeout: 60000 });

export const getExaHistoryApi = (params: any) =>
  defHttp.get<any>({ url: '/exa/history', params, timeout: 60000 });


