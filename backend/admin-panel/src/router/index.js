import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../pages/Login.vue'),
    meta: { title: '登录', public: true }
  },
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../pages/Dashboard.vue'),
    meta: { title: '仪表盘' }
  },
  {
    path: '/user/list',
    name: 'UserList',
    component: () => import('../pages/UserManage.vue'),
    meta: { title: '用户管理' }
  },
  {
    path: '/article/list',
    name: 'ArticleList',
    component: () => import('../pages/ArticleList.vue'),
    meta: { title: '文章管理' }
  },
  {
    path: '/article/edit',
    name: 'ArticleEdit',
    component: () => import('../pages/ArticleEdit.vue'),
    meta: { title: '编辑文章' }
  },
  {
    path: '/video/list',
    name: 'VideoList',
    component: () => import('../pages/VideoAdmin.vue'),
    meta: { title: '视频课程管理' }
  },
  {
    path: '/questions/med',
    name: 'MedQuestions',
    component: () => import('../pages/MedManage.vue'),
    meta: { title: '西医题库管理', type: 'med' }
  },
  {
    path: '/questions/math',
    name: 'MathQuestions',
    component: () => import('../pages/MathManage.vue'),
    meta: { title: '数学题库管理', type: 'math' }
  },
  {
    path: '/questions/politics',
    name: 'PoliticsQuestions',
    component: () => import('../pages/PoliticsManage.vue'),
    meta: { title: '政治题库管理', type: 'politics' }
  },
  {
    path: '/questions/public',
    name: 'PublicQuestions',
    component: () => import('../pages/PublicManagement.vue'),
    meta: { title: '公共课题库管理', type: 'public' }
  },
  {
    path: '/questions/computer',
    name: 'ComputerQuestions',
    component: () => import('../pages/ComputerManage.vue'),
    meta: { title: '计算机题库管理', type: 'computer' }
  },
  {
    path: '/computer/manage',
    name: 'ComputerManage',
    component: () => import('../pages/ComputerManage.vue'),
    meta: { title: '计算机综合管理' }
  },
  {
    path: '/computer/tutorials',
    name: 'TutorialManage',
    component: () => import('../pages/TutorialManage.vue'),
    meta: { title: '教辅管理' }
  },
  {
    path: '/computer/tutorials/:id/chapters',
    name: 'TutorialChapters',
    component: () => import('../pages/TutorialChapterManage.vue'),
    meta: { title: '教辅章节管理' }
  },
  {
    path: '/questions/import',
    name: 'QuestionImport',
    component: () => import('../pages/QuestionImport.vue'),
    meta: { title: '题目导入' }
  },
  {
    path: '/banner',
    name: 'BannerManage',
    component: () => import('../pages/BannerManage.vue'),
    meta: { title: '轮播图管理' }
  },
  {
    path: '/questions/public-manage',
    name: 'PublicManagement',
    component: () => import('../pages/PublicManagement.vue'),
    meta: { title: '公共课综合管理' }
  },
  {
    path: '/questions/public-import',
    name: 'PublicImport',
    component: () => import('../pages/PublicImport.vue'),
    meta: { title: '公共课导入' }
  },
  {
    path: '/questions/public-bulk-import',
    name: 'PublicBulkImport',
    component: () => import('../pages/PublicBulkImport.vue'),
    meta: { title: '公共课批量导入' }
  },
  {
    path: '/questions/politics-manage',
    name: 'PoliticsManage',
    component: () => import('../pages/PoliticsManage.vue'),
    meta: { title: '政治综合管理' }
  },
  {
    path: '/questions/computer-manage',
    name: 'ComputerManage',
    component: () => import('../pages/ComputerManage.vue'),
    meta: { title: '计算机综合管理' }
  },
  {
    path: '/questions/math-manage',
    name: 'MathManage',
    component: () => import('../pages/MathManage.vue'),
    meta: { title: '数学综合管理' }
  },
  {
    path: '/questions/med-manage',
    name: 'MedManage',
    component: () => import('../pages/MedManage.vue'),
    meta: { title: '西医综合管理' }
  },
  {
    path: '/questions/chapter',
    name: 'ChapterManage',
    component: () => import('../pages/ChapterManage.vue'),
    meta: { title: '章节管理' }
  },
  {
    path: '/nav',
    name: 'NavManage',
    component: () => import('../pages/NavManage.vue'),
    meta: { title: '导航管理' }
  },
  {
    path: '/homepage-card',
    name: 'HomepageCardManage',
    component: () => import('../pages/HomepageCardManage.vue'),
    meta: { title: '首页卡片管理' }
  },
  {
    path: '/content/notice',
    name: 'ContentNotice',
    component: () => import('../pages/ContentManage.vue'),
    meta: { title: '公告管理' }
  },
  {
    path: '/system/config',
    name: 'ConfigManage',
    component: () => import('../pages/ConfigManage.vue'),
    meta: { title: '系统配置' }
  },
  {
    path: '/system/database',
    name: 'DatabaseManage',
    component: () => import('../pages/DatabaseManage.vue'),
    meta: { title: '数据库管理' }
  },
  {
    path: '/system/pan',
    name: 'PanManage',
    component: () => import('../pages/PanManage.vue'),
    meta: { title: '网盘管理' }
  },
  {
    path: '/online-exam',
    name: 'OnlineExamManage',
    component: () => import('../pages/OnlineExamManage.vue'),
    meta: { title: '在线考试管理' }
  },
  {
    path: '/image-storage',
    name: 'ImageStorageManage',
    component: () => import('../pages/ImageStorageManage.vue'),
    meta: { title: '图床管理' }
  },
  {
    path: '/computer/papers',
    name: 'ComputerPaperManage',
    component: () => import('../pages/ComputerPaperManage.vue'),
    meta: { title: '计算机试卷管理' }
  },
  {
    path: '/computer/tutorials',
    name: 'TutorialManage',
    component: () => import('../pages/TutorialManage.vue'),
    meta: { title: '教辅管理' }
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('admin_token')
  if (to.path !== '/login' && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router
