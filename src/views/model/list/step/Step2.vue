<template>
  <div class="step2">
    <a-alert message="选择系统测点作为模型输出。" show-icon />
    <a-descriptions :column="2" class="mt-5">
      <a-descriptions-item label="模型名称"> {{ beforeData.modelName }} </a-descriptions-item>
      <a-descriptions-item label="目标参数名称"> {{ beforeData.targetName }} </a-descriptions-item>
      <a-descriptions-item label="滑动窗速度">
        {{ beforeData.movingWindows.movingSpeed }}
      </a-descriptions-item>
      <a-descriptions-item label="滑动窗长度">
        {{ beforeData.movingWindows.windowLength }}
      </a-descriptions-item>
      <a-descriptions-item label="取样间隔">
        {{ beforeData.movingWindows.samplingInterval }}
      </a-descriptions-item>
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
          labelField="name"
          valueField="id"
          :params="searchParams"
          @search="debounceOptionsFn"
        /> </template
    ></BasicForm>
  </div>
</template>
<script lang="ts">
  import { defineComponent, computed, unref, ref, PropType, toRaw } from 'vue';
  import { BasicForm, useForm, ApiSelect } from '/@/components/Form';
  import { step2Schemas } from './data';
  import { Alert, Divider, Descriptions } from 'ant-design-vue';
  import { pointListApi } from '/@/api/benchmark/select';
  import { type Recordable } from '@vben/types';
  import { useDebounceFn } from '@vueuse/core';

  export default defineComponent({
    components: {
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
      const [register, { validate, setFieldsValue }] = useForm({
        labelWidth: 100,
        schemas: step2Schemas,
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

      async function customResetFunc() {
        emit('prev');
      }

      async function customSubmitFunc() {
        try {
          const values = await validate();
          const target = values['targetPoint'].split('|');
          const targetParameter = {
            description: target[0],
            targetPoint: target[1],
            unit: target[2],
            upperlimit: target[3],
            lowerlimit: target[4],
          };

          const modelInfo = toRaw(props.beforeData);
          modelInfo['targetParameter'] = targetParameter;
          emit('next', modelInfo);
        } catch (error) {
          console.error(error);
        }
      }

      const keyword = ref<string>('');
      const searchParams = computed<Recordable>(() => {
        return { keyword: unref(keyword) };
      });

      function onSearch(value: string) {
        setFieldsValue({ targetPoint: '0' });
        keyword.value = value;
      }
      let debounceOptionsFn = useDebounceFn(onSearch, 300);
      return {
        register,
        pointListApi,
        onSearch: useDebounceFn(onSearch, 300),
        searchParams,
        handleReset: () => {
          keyword.value = '';
        },
        debounceOptionsFn,
      };
    },
  });
</script>
<style lang="less" scoped>
  .step2 {
    width: 450px;
    margin: 0 auto;
  }
</style>
