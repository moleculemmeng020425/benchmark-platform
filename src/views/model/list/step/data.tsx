import { FormSchema } from '/@/components/Form';

export const step1Schemas: FormSchema[] = [
  {
    field: 'modelName',
    component: 'Input',
    label: '模型名称',
    required: true,
    defaultValue: '',
    colProps: {
      span: 24,
    },
  },
  {
    field: 'targetName',
    component: 'Input',
    label: '目标参数名称',
    required: true,
    colProps: {
      span: 24,
    },
  },
  {
    field: 'movingSpeed',
    component: 'InputNumber',
    label: '滑动窗速度',
    defaultValue: 600,
    required: true,
  },
  {
    field: 'windowLength',
    component: 'InputNumber',
    label: '滑动窗长度',
    required: true,
    defaultValue: 120,
  },
  {
    field: 'samplingInterval',
    component: 'InputNumber',
    label: '取样间隔',
    required: true,
    defaultValue: 30,
  },
];

export const step2Schemas: FormSchema[] = [
  {
    field: 'targetPoint',
    component: 'Input',
    label: '目标参数',
    helpMessage: ['输入关键词搜索点号'],
    required: true,
    slot: 'remoteSearch',
    colProps: {
      span: 24,
    },
  },
];

export const step3Schemas: FormSchema[] = [
  {
    field: 'point0',
    component: 'Input',
    label: '边界参数1',
    required: true,
    slot: 'remoteSearch',
    colProps: {
      span: 16,
    },
  },
  {
    field: '0',
    component: 'Input',
    label: ' ',
    slot: 'add',
    colProps: {
      span: 2,
    },
  },
];
export const step4Schemas: FormSchema[] = [
  {
    field: 'point0',
    component: 'Input',
    label: '相关参数1',
    required: true,
    slot: 'remoteSearch',
    colProps: {
      span: 16,
    },
  },
  {
    field: '0',
    component: 'Input',
    label: ' ',
    slot: 'add',
    colProps: {
      span: 2,
    },
  },
];
