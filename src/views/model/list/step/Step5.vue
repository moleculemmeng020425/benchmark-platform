<template>
  <div class="step5">
    <a-alert message="选择模型的寻优逻辑，决定如何计算最优值。" show-icon />
    <div class="optimal-type-form mt-5">
      <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
        <a-form-item label="寻优逻辑" required>
          <a-radio-group v-model:value="optimalType" button-style="solid" size="large">
            <a-radio-button value="min">
              <div class="radio-content">
                <span class="radio-title">最小值最优</span>
                <span class="radio-desc">煤耗、能耗、损耗等越小越好的指标</span>
              </div>
            </a-radio-button>
            <a-radio-button value="max">
              <div class="radio-content">
                <span class="radio-title">最大值最优</span>
                <span class="radio-desc">效率、产出等越大越好的指标</span>
              </div>
            </a-radio-button>
          </a-radio-group>
        </a-form-item>
        <a-form-item :wrapper-col="{ offset: 6, span: 18 }">
          <a-alert
            :message="optimalTypeDescription"
            type="info"
            show-icon
          />
        </a-form-item>
      </a-form>
    </div>
    <a-divider />
    <div class="step-buttons">
      <a-button style="margin-right: 10px" @click="handlePrev">上一步</a-button>
      <a-button type="primary" :loading="loading" @click="handleNext">创建模型</a-button>
    </div>
  </div>
</template>
<script lang="ts">
  import { defineComponent, ref, computed, toRaw, PropType } from 'vue';
  import { Alert, Form, Radio, Divider, Button } from 'ant-design-vue';
  import { modelSaveApi } from '/@/api/benchmark/models';

  export default defineComponent({
    components: {
      [Alert.name]: Alert,
      [Form.name]: Form,
      [Form.Item.name]: Form.Item,
      [Radio.name]: Radio,
      [Radio.Group.name]: Radio.Group,
      [Radio.Button.name]: Radio.Button,
      [Divider.name]: Divider,
      [Button.name]: Button,
    },
    props: {
      beforeData: {
        type: Object as PropType<Record<string, any> | null | undefined>,
      },
      systemId: {
        type: Number,
      },
    },
    emits: ['next', 'prev'],
    setup(props, { emit }) {
      const optimalType = ref('min');
      const loading = ref(false);

      const optimalTypeDescription = computed(() => {
        if (optimalType.value === 'min') {
          return '系统将寻找目标参数的最小值作为最优值，适用于供电煤耗、厂用电率、排放量等指标。';
        } else {
          return '系统将寻找目标参数的最大值作为最优值，适用于锅炉效率、机组效率、发电量等指标。';
        }
      });

      function handlePrev() {
        emit('prev');
      }

      async function handleNext() {
        try {
          loading.value = true;
          const modelInfo = toRaw(props.beforeData);
          // 将 optimalType 添加到 movingWindows 中
          if (modelInfo && modelInfo.movingWindows) {
            modelInfo.movingWindows.optimalType = optimalType.value;
          }

          const model = {
            systemId: props.systemId,
            modelInfo: modelInfo,
          };

          console.log('提交模型数据:', model);
          const modelId = await modelSaveApi(model);

          setTimeout(() => {
            loading.value = false;
            emit('next', modelId);
          }, 1500);
        } catch (error) {
          loading.value = false;
          console.error(error);
        }
      }

      return {
        optimalType,
        optimalTypeDescription,
        loading,
        handlePrev,
        handleNext,
      };
    },
  });
</script>
<style lang="less" scoped>
  .step5 {
    width: 550px;
    margin: 0 auto;
  }

  .optimal-type-form {
    padding: 20px 0;
  }

  .radio-content {
    display: flex;
    flex-direction: column;
    padding: 10px 20px;
    text-align: center;
  }

  .radio-title {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 4px;
  }

  .radio-desc {
    font-size: 12px;
    color: #666;
  }

  .step-buttons {
    text-align: center;
    margin-top: 20px;
  }

  :deep(.ant-radio-button-wrapper) {
    height: auto;
    line-height: 1.5;
    margin-right: 16px;
  }

  :deep(.ant-radio-button-wrapper:last-child) {
    margin-right: 0;
  }
</style>
