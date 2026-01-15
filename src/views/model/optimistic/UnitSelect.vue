<template>
  <a-form layout="inline" :model="formData" :label-col="labelCol" @finish="submitForm">
    <a-col :md="4">
      <a-form-item label="机组" name="unit" :label-col="{ span: 0 }" :wrapper-col="{ span: 24 }">
        <a-select
          v-model:value="formData.unit"
          style="width: 90%"
          @change="onUnitChange"
          :options="unitData.map((unit) => ({ value: unit.id, label: unit.name }))"
        />
      </a-form-item>
    </a-col>
    <a-col :md="4">
      <a-form-item label="系统" name="type" :label-col="{ span: 0 }" :wrapper-col="{ span: 24 }">
        <a-select
          v-model:value="formData.type"
          style="width: 90%"
          @change="onTypeChange"
          :options="typeData.map((type) => ({ value: type.id, label: type.name }))"
        />
      </a-form-item>
    </a-col>
    <a-col :md="4">
      <a-form-item
        label="子系统"
        name="system"
        :label-col="{ span: 0 }"
        :wrapper-col="{ span: 24 }"
      >
        <a-select
          v-model:value="formData.system"
          style="width: 90%"
          :options="systemData.map((system) => ({ value: system.id, label: system.name }))"
        />
      </a-form-item>
    </a-col>
    <a-col :md="5">
      <a-form-item name="time" label="时间选择">
        <a-range-picker
          v-model:value="formData.time"
          show-time
          :placeholder="['开始时间', '结束时间']"
        />
      </a-form-item>
    </a-col>
    <a-col :md="3">
      <a-form-item name="name" label="参数搜索">
        <a-input v-model:value="formData.name" style="width: 100%" />
      </a-form-item>
    </a-col>
    <a-col :md="2">
      <a-form-item>
        <a-button type="primary" html-type="submit">查询</a-button>
      </a-form-item>
    </a-col>
  </a-form>
  <a-divider />
</template>
<script lang="ts">
  import { ref, onMounted } from 'vue';
  import { Form, Select, Button, Col, Divider, RangePicker } from 'ant-design-vue';
  import { optionListApi, subSystemListApi } from '/@/api/benchmark/select';
  import { systemSelectParams, OptionsItem } from '/@/api/benchmark/model/optionsModel';
  import dayjs, { Dayjs } from 'dayjs';

  export default {
    components: {
      AFormItem: Form.Item,
      AForm: Form,
      ASelect: Select,
      AButton: Button,
      ACol: Col,
      ADivider: Divider,
      ARangePicker: RangePicker,
    },
    emits: ['optionSelected'],
    setup(props, context) {
      let unitData = ref<OptionsItem[]>([]);
      let typeData = ref<OptionsItem[]>([]);
      let systemData = ref<OptionsItem[]>([]);
      const formData = ref({
        unit: -1,
        type: -1,
        system: -1,
        name: null,
        time: [],
      });
      onMounted(async () => {
        const optionList = await optionListApi();
        console.log(111, optionList);
        unitData.value = optionList.units;
        typeData.value = optionList.types;
        systemData.value = optionList.systems;
        type RangeValue = [Dayjs, Dayjs];
        const currentDate: Dayjs = dayjs();
        const lastMonthDate: Dayjs = currentDate.subtract(1, 'month');
        const rangeValue: RangeValue = [lastMonthDate, currentDate];
        formData.value = {
          unit: unitData.value[0].id,
          type: typeData.value[0].id,
          system: systemData.value[0].id,
          name: null,
          time: rangeValue,
        };

        if (unitData.value.length > 0) {
          formData.value.unit = unitData.value[0].id;
        }
        if (typeData.value.length > 0) {
          formData.value.type = typeData.value[0].id;
        }
        if (systemData.value.length > 0) {
          formData.value.system = systemData.value[0].id;
        }
        console.log(formData.value);
        //第一次加载时传递参数
        context.emit('optionSelected', formData.value);
      });

      //点击查询按钮提交表单触发事件
      const submitForm = (values) => {
        console.log(111, values);
        context.emit('optionSelected', values);
      };
      const onFinishFailed = (errorInfo: any) => {
        console.log('Failed:', errorInfo);
      };
      const labelCol = { style: { width: '80px' } };

      // 机组下拉框改变事件
      const onUnitChange = async (_value) => {
        const param: systemSelectParams = {
          unitId: formData.value.unit,
          typeId: typeData.value[0].id,
        };
        systemData.value = await subSystemListApi(param);
        formData.value.system = systemData.value[0].id;
        formData.value.type = typeData.value[0].id;
      };

      // 系统下拉框改变事件
      const onTypeChange = async (_value) => {
        const param: systemSelectParams = {
          unitId: formData.value.unit,
          typeId: formData.value.type,
        };
        systemData.value = await subSystemListApi(param);
        formData.value.system = systemData.value[0].id;
      };

      return {
        formData,
        unitData,
        typeData,
        systemData,
        submitForm,
        onFinishFailed,
        labelCol,
        onUnitChange,
        onTypeChange,
      };
    },
  };
</script>
