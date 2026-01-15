<template>
  <div class="grid md:grid-cols-4 gap-4">
    <template v-if="modelCardList.length > 0">
      <template v-for="item in modelCardList" :key="item.title">
        <Card
          size="small"
          :loading="loading"
          :title="item.title"
          :hoverable="true"
          :bodyStyle="item.bodyStyle"
          :headStyle="item.headStyle"
          @click="changeModel(item.id)"
        >
          <template #extra>
            <Icon :icon="item.icon" :size="30" color="white" />
          </template>
          <div class="p-2 px-5 grid md:grid-cols-3">
            <span>创建人: {{ item.creator }}</span
            ><span>创建时间: {{ item.creatTime }}</span
            ><span>模型状态: {{ item.status }}</span>
          </div>
        </Card>
      </template>
    </template>
    <Card
      size="small"
      class="icon-card"
      @click="openDrawer(true)"
      :hoverable="true"
      v-show="systemId != null"
      ><Icon icon="ic:sharp-add" :size="80" color="#a7a9a7"
    /></Card>
  </div>
  <CreateModel @register="registerDraw" :systemId="systemId" />
</template>
<script lang="ts" setup>
  import Icon from '@/components/Icon/Icon.vue';
  import { Card } from 'ant-design-vue';
  import { ModelItem } from './data';
  import { modelCardListApi } from '/@/api/benchmark/models';
  import { ModelQueryParams } from '/@/api/benchmark/model/models';
  import { watch, ref, PropType } from 'vue';
  import { useGo } from '/@/hooks/web/usePage';
  import CreateModel from './CreateModel.vue';
  import { useDrawer } from '/@/components/Drawer';

  const [registerDraw, { openDrawer }] = useDrawer();

  const props = defineProps({
    loading: {
      type: Boolean,
    },
    selectData: {
      type: Object as PropType<Record<string, any> | null | undefined>,
    },
    systemId: {
      type: Number,
    },
  });

  //点击模型卡片跳转训练页面
  const go = useGo();
  const changeModel = (id) => {
    go(`/model/train/${id}`);
  };

  const modelCardList = ref<Array<ModelItem>>([]);
  const colors = ['#8dc63f', '#dbb09e'];
  const statusStr = ['未下装', '已下装'];
  const icons = ['material-symbols:lock-open-right-outline', 'material-symbols:lock-outline'];

  watch(
    () => props.selectData,
    async (value) => {
      const queryParams: ModelQueryParams = {
        unitId: value?.unit,
        typeId: value?.type,
        systemId: value?.system,
        name: value?.name,
      };
      const modelList = await modelCardListApi(queryParams);
      const cardList: ModelItem[] = [];
      for (const modelCard of modelList) {
        // modelCard.status = 0;
        const card: ModelItem = {
          id: modelCard.id,
          title: modelCard.name,
          icon: icons[modelCard.status],
          value: 1,
          total: 1,
          color: colors[modelCard.status],
          status: statusStr[modelCard.status],
          creator: modelCard.creatName,
          description: modelCard.name,
          creatTime: modelCard.creatTime,
          headStyle: {
            backgroundColor: colors[modelCard.status],
            fontSize: '20px',
          },
          bodyStyle: {
            borderColor: colors[modelCard.status],
            borderWidth: '1px',
          },
        };
        cardList.push(card);
      }
      console.log(cardList);
      modelCardList.value = cardList;
    },
  );
</script>

<style>
  .icon-card {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f2f2f2;
  }
</style>
