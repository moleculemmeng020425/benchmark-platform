<template>
  <div class="step5">
    <a-result status="success" title="新建成功" sub-title="可查看模型进行编辑">
      <template #extra>
        <a-button type="primary" @click="redo"> 再建一个 </a-button>
        <a-button @click="goTrain"> 查看模型 </a-button>
      </template>
    </a-result>
    <div class="desc-wrap">
      <a-descriptions :column="1" class="mt-5">
        <a-descriptions-item label="模型名称"> 测试模型 </a-descriptions-item>
        <a-descriptions-item label="目标参数名称"> 送风机电流 </a-descriptions-item>
        <a-descriptions-item label="滑动窗速度"> 600 </a-descriptions-item>
        <a-descriptions-item label="滑动窗长度"> 120 </a-descriptions-item>
        <a-descriptions-item label="取样间隔"> 30 </a-descriptions-item>
      </a-descriptions>
    </div>
  </div>
</template>
<script lang="ts">
  import { defineComponent } from 'vue';
  import { Result, Descriptions } from 'ant-design-vue';
  import { useGo } from '/@/hooks/web/usePage';

  export default defineComponent({
    components: {
      [Result.name]: Result,
      [Descriptions.name]: Descriptions,
      [Descriptions.Item.name]: Descriptions.Item,
    },
    props: {
      modelId: {
        type: Number,
      },
    },
    emits: ['redo'],
    setup(props, { emit }) {
      const go = useGo();
      const goTrain = () => {
        go(`/model/train/${props.modelId}`);
      };
      return {
        redo: () => {
          emit('redo');
        },
        goTrain,
      };
    },
  });
</script>
<style lang="less" scoped>
  .step5 {
    width: 600px;
    margin: 0 auto;
  }

  .desc-wrap {
    margin-top: 24px;
    padding: 24px 40px;
    background-color: @background-color-light;
  }
</style>
