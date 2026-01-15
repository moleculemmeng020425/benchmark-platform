import { defHttp } from '/@/utils/http/axios';
import {
  DemoOptionsItem,
  selectParams,
  OptionsItem,
  AllOptionsItem,
  systemSelectParams,
} from './model/optionsModel';

enum Api {
  LIST = '/select/list',
  UNIT_LIST = '/select/unit/options',
  SYSTEM_LIST = '/select/system/options',
  POINT_LIST = '/select/point/options',
}

export const optionListApi = () => defHttp.get<AllOptionsItem>({ url: Api.LIST });

/**
 * @description: 获取机组选项
 */
export const unitListApi = (params?: selectParams) =>
  defHttp.get<DemoOptionsItem[]>({ url: Api.UNIT_LIST, params });

/**
 * @description: 获取系统机组
 */
export const systemListApi = (params?: selectParams) =>
  defHttp.get<DemoOptionsItem[]>({ url: Api.UNIT_LIST, params });

/**
 * @description: 获取子系统选项
 */
export const subSystemListApi = (params?: systemSelectParams) =>
  defHttp.get<OptionsItem[]>({ url: Api.SYSTEM_LIST, params });

export const pointListApi = (params?: string) =>
  defHttp.get<OptionsItem[]>({ url: Api.POINT_LIST, params });
