import { CSSProperties } from 'vue';

export interface ModelItem {
  id: number;
  icon: string;
  title: string;
  value: number;
  total: number;
  color: string;
  creatTime: string;
  status: string;
  creator: string;
  description: string;
  headStyle: CSSProperties;
  bodyStyle: CSSProperties;
}
