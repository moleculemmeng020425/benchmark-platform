<template>
  <BasicDrawer :isDetail="true" title="新建模型">
    <PageWrapper title="新建模型" contentBackground contentClass="p-4">
      <div class="step-form-form">
        <a-steps :current="current">
          <a-step title="填写基本信息" />
          <a-step title="目标参数选择" />
          <a-step title="边界参数选择" />
          <a-step title="相关参数选择" />
          <a-step title="完成" />
        </a-steps>
      </div>
      <div class="mt-5">
        <Step1 @next="handleStep1Next" v-show="current === 0" />
        <Step2
          :beforeData="step1Data"
          @prev="handleStepPrev"
          @next="handleStep2Next"
          v-show="current === 1"
          v-if="initStep2"
        />
        <Step3
          :beforeData="step2Data"
          @prev="handleStepPrev"
          @next="handleStep3Next"
          v-show="current === 2"
          v-if="initStep3"
        />
        <Step4
          :beforeData="step3Data"
          :systemId="systemId"
          @prev="handleStepPrev"
          @next="handleStep4Next"
          v-show="current === 3"
          v-if="initStep4"
        />
        <Step5 :modelId="step4Data" v-show="current === 4" @redo="handleRedo" v-if="initStep5" />
      </div>
    </PageWrapper>
  </BasicDrawer>
</template>
<script lang="ts">
  import { defineComponent, ref, reactive, toRefs } from 'vue';
  import { BasicDrawer } from '/@/components/Drawer';
  import { PageWrapper } from '/@/components/Page';
  import { Steps } from 'ant-design-vue';
  import Step1 from './step/Step1.vue';
  import Step2 from './step/Step2.vue';
  import Step3 from './step/Step3.vue';
  import Step4 from './step/Step4.vue';
  import Step5 from './step/Step5.vue';

  export default defineComponent({
    components: {
      Step1,
      Step2,
      Step3,
      Step4,
      Step5,
      BasicDrawer,
      PageWrapper,
      [Steps.name]: Steps,
      [Steps.Step.name]: Steps.Step,
    },
    props: {
      systemId: {
        type: Number,
      },
    },
    setup() {
      const current = ref(0);
      const step1Data = ref(null);
      const step2Data = ref(null);
      const step3Data = ref(null);
      const step4Data = ref(null);

      const state = reactive({
        initStep2: false,
        initStep3: false,
        initStep4: false,
        initStep5: false,
      });
      function handleStep1Next(step1Values: any) {
        current.value++;
        console.log(step1Values);
        step1Data.value = step1Values;
        state.initStep2 = true;
      }
      function handleStepPrev() {
        current.value--;
      }
      function handleStep2Next(step2Values: any) {
        current.value++;
        step2Data.value = step2Values;
        console.log(222, step2Values);
        state.initStep3 = true;
      }
      function handleStep3Next(step3Values: any) {
        current.value++;
        step3Data.value = step3Values;
        console.log(333, step3Values);
        state.initStep4 = true;
      }
      function handleStep4Next(step4Values: any) {
        current.value++;
        step4Data.value = step4Values;
        console.log(444, step4Values);
        state.initStep5 = true;
      }

      function handleRedo() {
        current.value = 0;
        state.initStep2 = false;
        state.initStep3 = false;
        state.initStep4 = false;
        state.initStep5 = false;
      }
      return {
        step1Data,
        step2Data,
        step3Data,
        step4Data,
        current,
        handleRedo,
        handleStepPrev,
        handleStep1Next,
        handleStep2Next,
        handleStep3Next,
        handleStep4Next,
        ...toRefs(state),
      };
    },
  });
</script>
<style lang="less" scoped>
  .step-form-content {
    padding: 24px;
    background-color: @component-background;
  }

  .step-form-form {
    width: 750px;
    margin: 0 auto;
  }
</style>
