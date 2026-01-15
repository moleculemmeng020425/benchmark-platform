import { BasicFetchResult } from '/@/api/model/baseModel';

export interface OptionsItem {
  id: number;
  name: string;
}

export interface AllOptionsItem {
  units: OptionsItem[];
  types: OptionsItem[];
  systems: OptionsItem[];
}

export interface DemoOptionsItem {
  name: string;
  id: string;
}

export interface selectParams {
  id: number | string;
}

export interface systemSelectParams {
  unitId: number | null;
  typeId: number | null;
}

/**
 * @description: Request list return value
 */
export type DemoOptionsGetResultModel = BasicFetchResult<DemoOptionsItem>;
