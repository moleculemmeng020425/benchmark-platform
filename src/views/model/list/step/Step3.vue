<template>
  <div class="step3">
    <a-alert message="选择系统测点作为模型输出。" show-icon />
    <a-descriptions :column="1" class="mt-5">
      <a-descriptions-item label="模型名称"> 测试模型 </a-descriptions-item>
      <a-descriptions-item label="目标参数名称"> 送风机电流 </a-descriptions-item>
      <a-descriptions-item label="滑动窗速度"> 600 </a-descriptions-item>
      <a-descriptions-item label="滑动窗长度"> 120 </a-descriptions-item>
      <a-descriptions-item label="取样间隔"> 30 </a-descriptions-item>
    </a-descriptions>
    <a-divider />
    <BasicForm @register="register">
      <template #remoteSearch="{ model, field }">
        <ApiSelect
          :api="pointListApi"
          showSearch
          v-model:value="model[field]"
          :filterOption="false"
          resultField="list"
          :labelField="field"
          valueField="id"
          :params="searchParams"
          @search="(query) => onSearch(query, field)"
        />
      </template>
      <template #add="{ field }">
        <Button v-if="Number(field) === 0" @click="add">+</Button>
        <Button v-if="field > 0" @click="del(field)">-</Button>
      </template></BasicForm
    >
  </div>
</template>
<script lang="ts">
  import { defineComponent, ref, computed, unref, PropType, toRaw } from 'vue';
  import { BasicForm, useForm, ApiSelect } from '/@/components/Form';
  import { step3Schemas } from './data';
  import { Alert, Divider, Descriptions } from 'ant-design-vue';
  import { Button } from '/@/components/Button';
  import { pointListApi } from '/@/api/benchmark/select';
  import { type Recordable } from '@vben/types';
  import { useDebounceFn } from '@vueuse/core';

  export default defineComponent({
    components: {
      Button,
      BasicForm,
      ApiSelect,
      [Alert.name]: Alert,
      [Divider.name]: Divider,
      [Descriptions.name]: Descriptions,
      [Descriptions.Item.name]: Descriptions.Item,
    },
    props: {
      beforeData: {
        type: Object as PropType<Record<string, any> | null | undefined>,
      },
    },
    emits: ['next', 'prev'],
    setup(props, { emit }) {
      const [register, { appendSchemaByField, removeSchemaByField, validate, setFieldsValue }] =
        useForm({
          labelWidth: 100,
          schemas: step3Schemas,
          actionColOptions: {
            span: 14,
          },
          resetButtonOptions: {
            text: '上一步',
          },
          submitButtonOptions: {
            text: '下一步',
          },
          resetFunc: customResetFunc,
          submitFunc: customSubmitFunc,
        });
      const n = ref(2);

      function add() {
        appendSchemaByField(
          [
            {
              field: `point${n.value}`,
              component: 'Input',
              label: '边界参数' + n.value,
              required: true,
              slot: 'remoteSearch',
              colProps: {
                span: 16,
              },
            },
            {
              field: `${n.value}`,
              component: 'Input',
              label: ' ',
              slot: 'add',
              colProps: {
                span: 2,
              },
            },
          ],
          '',
        );
        n.value++;
      }

      function del(field) {
        removeSchemaByField([`point${field}`, `${field}`]);
        n.value--;
      }

      async function customResetFunc() {
        emit('prev');
      }

      async function customSubmitFunc() {
        try {
          const values = await validate();
          const boundaryParameter = [];
          for (const key in values) {
            if (key.startsWith('point')) {
              const point = values[key].split('|');
              const p = {
                description: point[0],
                targetPoint: point[1],
                unit: point[2],
                upperlimit: point[3],
                lowerlimit: point[4],
              };
              boundaryParameter.push(p);
            }
          }
          console.log(props.beforeData);
          const modelInfo = toRaw(props.beforeData);
          modelInfo['boundaryParameter'] = boundaryParameter;
          emit('next', modelInfo);
        } catch (error) {
          console.error(error);
        }
      }

      const keyword = ref<string>('');
      const searchParams = computed<Recordable>(() => {
        return { keyword: unref(keyword) };
      });

      function onSearch(value: string, field: string) {
        const kv = {};
        kv[field] = '0';
        setFieldsValue(kv);
        keyword.value = value;
      }

      return {
        register,
        del,
        add,
        onSearch: useDebounceFn(onSearch, 300),
        searchParams,
        pointListApi,
        handleReset: () => {
          keyword.value = '';
        },
      };
    },
  });
</script>
<style lang="less" scoped>
  .step3 {
    width: 450px;
    margin: 0 auto;
  }
</style>
