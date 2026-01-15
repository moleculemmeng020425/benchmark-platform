export interface ModelCardItem {
  id: number;
  name: string;
  status: number;
  algorithm: string;
  creatName: string;
  creatTime: string;
}

interface MovingWindows {
  windowLength: number;
  samplingInterval: number;
  movingSpeed: number;
  optimalType?: 'min' | 'max';  // 寻优类型：min-越低越好，max-越高越好
}

export interface ModelInfo {
  id: number;
  btmState: string;
  unitID: string;
  createName: string;
  createTime: string;
  modelName: string;
  movingWindows: MovingWindows;
  steadyPoint: any[];
  targetParameter: any;
  relationParameter: any[];
  boundaryParameter: any[];
}

export interface ModelQueryParams {
  unitId: number;
  typeId: number;
  systemId: number;
  name?: string | null;
  status?: number | null;
  visible?: number | null;
  trash?: number | null;
}
