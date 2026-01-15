import type { AppRouteModule } from '/@/router/types';

import { LAYOUT } from '/@/router/constant';
import { t } from '/@/hooks/web/useI18n';

const model: AppRouteModule = {
  path: '/model',
  name: '模型中心',
  component: LAYOUT,
  redirect: '/model/list',
  meta: {
    orderNo: 10,
    icon: 'ion:grid-outline',
    title: t('routes.model.modelCenter'),
  },
  children: [
    {
      path: 'list',
      name: 'list',
      component: () => import('/@/views/model/list/index.vue'),
      meta: {
        // affix: true,
        title: t('routes.model.model'),
      },
    },
    {
      path: 'train/:id',
      name: 'train',
      component: () => import('/@/views/model/train/index.vue'),
      meta: {
        // affix: true,
        title: t('routes.model.train'),
        hideMenu: true,
      },
    },
    {
      path: 'trash',
      name: 'trash',
      component: () => import('/@/views/model/trash/index.vue'),
      meta: {
        title: t('routes.model.trash'),
      },
    },
    {
      path: 'optimistic',
      name: 'optimistic',
      component: () => import('/@/views/model/optimistic/index.vue'),
      meta: {
        title: '对标寻优',
      },
    },
  ],
};

export default model;
