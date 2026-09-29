import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('../layouts/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: '/dashboard',
        },
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('../views/DashboardView.vue'),
        },
        {
          path: 'company',
          name: 'Company',
          component: () => import('../views/CompanyView.vue'),
        },
        {
          path: 'categories',
          name: 'Categories',
          component: () => import('../views/CategoriesView.vue'),
        },
        {
          path: 'products',
          name: 'Products',
          component: () => import('../views/ProductsView.vue'),
        },
        {
          path: 'customers',
          name: 'Customers',
          component: () => import('../views/CustomersView.vue'),
        },
        {
          path: 'orders',
          name: 'Orders',
          component: () => import('../views/OrdersView.vue'),
        },
        {
          path: 'orders/:id',
          name: 'OrderDetail',
          component: () => import('../views/OrderDetailView.vue'),
        },
        {
          path: 'conversations',
          name: 'Conversations',
          component: () => import('../views/ConversationsView.vue'),
        },
        {
          path: 'conversations/:id',
          name: 'ConversationDetail',
          component: () => import('../views/ConversationDetailView.vue'),
        },
        {
          path: 'simulator',
          name: 'Simulator',
          component: () => import('../views/SimulatorView.vue'),
        },
        {
          path: 'settings',
          name: 'Settings',
          component: () => import('../views/SettingsView.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard',
    },
  ],
});

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else if (to.meta.public && authStore.isAuthenticated) {
    next('/dashboard');
  } else {
    next();
  }
});

export default router;
