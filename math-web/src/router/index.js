import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Login',
    component: () => import('@/pages/Login.vue')
  },
  {
    path: '/pages/math/math-bookshelf',
    name: 'Bookshelf',
    component: () => import('@/pages/math-bookshelf.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/pages/math/math-practice',
    name: 'Practice',
    component: () => import('@/pages/math-practice.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/pages/math/math-book-detail',
    name: 'BookDetail',
    component: () => import('@/pages/math-book-detail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/pages/math/math-question-detail',
    name: 'QuestionDetail',
    component: () => import('@/pages/math-question-detail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/pages/math/math-smart-paper-config',
    name: 'SmartPaper',
    component: () => import('@/pages/math-smart-paper-config.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/pages/math/math-my-papers',
    name: 'MyPapers',
    component: () => import('@/pages/math-my-papers.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/pages/math/math-my-favorites',
    name: 'Favorites',
    component: () => import('@/pages/math-my-favorites.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/pages/math/math-all-books',
    name: 'AllBooks',
    component: () => import('@/pages/math-all-books.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/pages/math/math-curated-bank',
    name: 'CuratedBank',
    component: () => import('@/pages/math-curated-bank.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/pages/math/math-curated-bank-detail',
    name: 'CuratedBankDetail',
    component: () => import('@/pages/math-curated-bank-detail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/pages/math/math-generated-paper',
    name: 'GeneratedPaper',
    component: () => import('@/pages/math-generated-paper.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/pages/math/math-generated-paper-analysis',
    name: 'GeneratedPaperAnalysis',
    component: () => import('@/pages/math-generated-paper-analysis.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/pages/math/profile-math',
    name: 'Profile',
    component: () => import('@/pages/profile-math.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/pages/math/math-practice-search',
    name: 'PracticeSearch',
    component: () => import('@/pages/math-practice-search.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/pages/practice-search',
    name: 'PracticeSearchAlt',
    component: () => import('@/pages/practice-search.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/pages/math/math-question-search',
    name: 'QuestionSearch',
    component: () => import('@/pages/math-question-search.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  
  if (to.meta.requiresAuth && !token) {
    next('/')
  } else {
    next()
  }
})

export default router
