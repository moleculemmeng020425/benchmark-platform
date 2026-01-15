<template>
  <BasicModal
    v-bind="$attrs"
    destroyOnClose
    @register="register"
    title="请选择回算时间"
    @visible-change="handleVisibleChange"
    :onOk="handleOk"
  >
    <div style="height: 20px">
      <a-form :model="model" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
        <a-form-item label="开始时间" name="st">
          <a-date-picker show-time v-model:value="model.st" style="width: 80%" />
        </a-form-item>
        <a-form-item label="结束时间" name="et">
          <a-date-picker show-time v-model:value="model.et" style="width: 80%" />
        </a-form-item>
      </a-form>
    </div>
  </BasicModal>
</template>
<script lang="ts">
  import { defineComponent, ref, nextTick } from 'vue';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { calculateBackApi } from '/@/api/benchmark/models';
  import dayjs, { Dayjs } from 'dayjs';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { DatePicker, Form, FormItem } from 'ant-design-vue';

  export default defineComponent({
    components: { BasicModal, AForm: Form, ADatePicker: DatePicker, AFormItem: FormItem },
    props: {
      userData: { type: Object },
    },
    setup(props) {
      const modelRef = ref({});

      const [register, { closeModal }] = useModalInner((data) => {
        data && onDataReceive(data);
      });

      function onDataReceive(data) {
        const currentDate: Dayjs = dayjs();
        const lastMonthDate: Dayjs = currentDate.subtract(1, 'month');

        modelRef.value = { id: data.id, st: lastMonthDate, et: currentDate };
      }

      function handleVisibleChange(v) {
        v && props.userData && nextTick(() => onDataReceive(props.userData));
      }
      const { createMessage } = useMessage();
      function handleOk() {
        console.log(111);
        submit();
      }
      async function submit() {
        const id = modelRef.value.id;
        const time = {
          st: modelRef.value.st.toDate(),
          et: modelRef.value.et.toDate(),
        };
        console.log(time);
        const calculateRes = await calculateBackApi(id, time);
        if (calculateRes) {
          createMessage.success('回算提交成功');
        } else {
          createMessage.error('回算异常');
        }
        closeModal();
      }

      return { register, model: modelRef, handleVisibleChange, handleOk };
    },
  });
</script>
