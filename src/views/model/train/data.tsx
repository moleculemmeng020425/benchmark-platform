import { BasicColumn } from '/@/components/Table/src/types/table';

export const targetTableSchema: BasicColumn[] = [
  {
    title: '描述',
    width: 150,
    dataIndex: 'description',
    edit: true,
  },
  {
    title: '点号',
    width: 150,
    dataIndex: 'targetPoint',
  },
  {
    title: '寻优判断逻辑',
    width: 150,
    dataIndex: 'marktype',
    edit: true,
    editComponent: 'Select',
    editComponentProps: {
      options: [
        {
          label: '越大越好',
          value: 'max',
        },
        {
          label: '越小越好',
          value: 'min',
        },
      ],
    },
  },
  {
    title: '单位',
    width: 150,
    dataIndex: 'unit',
    edit: true,
  },
  {
    title: '上限	',
    width: 150,
    dataIndex: 'upperlimit',
    edit: true,
  },
  {
    title: '下限',
    width: 150,
    dataIndex: 'lowerlimit',
    edit: true,
  },
  {
    title: '历史值',
    width: 150,
    dataIndex: 'value',
  },
];

export const boundaryTableSchema: BasicColumn[] = [
  {
    title: '描述',
    width: 150,
    dataIndex: 'description',
    edit: true,
  },
  {
    title: '点号',
    width: 150,
    dataIndex: 'targetPoint',
  },
  {
    title: '单位',
    width: 150,
    dataIndex: 'unit',
    edit: true,
  },
  {
    title: '上限	',
    width: 150,
    dataIndex: 'upperlimit',
    edit: true,
  },
  {
    title: '下限',
    width: 150,
    dataIndex: 'lowerlimit',
    edit: true,
  },
  {
    title: '网格数',
    width: 150,
    dataIndex: 'gridNumber',
    edit: true,
  },
  {
    title: '历史值',
    width: 150,
    dataIndex: 'value',
  },
];

export const relationTableSchema: BasicColumn[] = [
  {
    title: '描述',
    width: 150,
    dataIndex: 'description',
    edit: true,
  },
  {
    title: '点号',
    width: 150,
    dataIndex: 'targetPoint',
  },
  {
    title: '单位',
    width: 150,
    dataIndex: 'unit',
    edit: true,
  },
  {
    title: '上限	',
    width: 150,
    dataIndex: 'upperlimit',
    edit: true,
  },
  {
    title: '下限',
    width: 150,
    dataIndex: 'lowerlimit',
    edit: true,
  },
  {
    title: '历史值',
    width: 150,
    dataIndex: 'value',
  },
];
