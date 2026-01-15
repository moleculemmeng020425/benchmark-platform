<template>
  <div class="step1">
    <div class="step1-form">
      <BasicForm @register="register" />
    </div>
    <a-divider />
    <h3>说明</h3>
    <h4>建模参数</h4>
    <p>
      如果需要可以放建模信息说明. 如果需要可以放建模信息说明. 如果需要可以放建模信息说明.
      如果需要可以放建模信息说明. 如果需要可以放建模信息说明. 如果需要可以放建模信息说明.
    </p>
    <h4>滑动窗参数</h4>
    <p>
      如果需要可以放建模信息说明. 如果需要可以放建模信息说明. 如果需要可以放建模信息说明.
      如果需要可以放建模信息说明. 如果需要可以放建模信息说明. 如果需要可以放建模信息说明.
    </p>
  </div>
</template>
<script lang="ts">
  import { defineComponent } from 'vue';
  import { BasicForm, useForm } from '/@/components/Form';
  import { step1Schemas } from './data';

  import { Select, Input, Divider } from 'ant-design-vue';

  export default defineComponent({
    components: {
      BasicForm,
      [Select.name]: Select,
      [Input.name]: Input,
      [Input.Group.name]: Input.Group,
      [Divider.name]: Divider,
    },
    emits: ['next'],
    setup(_, { emit }) {
      const [register, { validate }] = useForm({
        labelWidth: 100,
        schemas: step1Schemas,
        actionColOptions: {
          span: 14,
        },
        showResetButton: true,
        submitButtonOptions: {
          text: '下一步',
        },
        submitFunc: customSubmitFunc,
      });

      async function customSubmitFunc() {
        try {
          const values = await validate();
          const modelInfo = {
            modelName: values.modelName,
            movingWindows: {
              movingSpeed: values.movingSpeed,
              samplingInterval: values.samplingInterval,
              windowLength: values.windowLength,
            },
            condition: null,
          };
          emit('next', modelInfo);
        } catch (error) {
          //
        }
      }

      return { register };
    },
  });
</script>
<style lang="less" scoped>
  .step1 {
    &-form {
      width: 450px;
      margin: 0 auto;
    }

    h3 {
      margin: 0 0 12px;
      color: @text-color;
      font-size: 16px;
      line-height: 32px;
    }

    h4 {
      margin: 0 0 4px;
      color: @text-color;
      font-size: 14px;
      line-height: 22px;
    }

    p {
      color: @text-color;
    }
  }

  .pay-select {
    width: 20%;
  }

  .pay-input {
    width: 70%;
  }
</style>
