import axios from 'axios'
import { ElMessage } from 'element-plus'

const service = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 可以在这里添加 token
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code !== 0 && res.code !== 200) {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  error => {
    // 忽略 401 错误，防止重复提示
    if (error.response && error.response.status === 401) {
       // optional: redirect to login
    } else {
       ElMessage.error(error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export const adminApi = {
  // 用户管理
  getUserList: (params) => service.get('/admin/users', { params }),
  updateUser: (id, data) => service.put(`/admin/users/${id}`, data),
  createUser: (data) => service.post('/admin/users', data),
  
  // 文章管理
  getNotices: (params) => service.get('/admin/notices', { params }),
  getNoticeDetail: (id) => service.get(`/admin/notices/${id}`),
  updateNotice: (id, data) => service.put(`/admin/notices/${id}`, data),
  updateNoticeStatus: (id, status) => service.put(`/admin/notices/${id}/status`, { status }),
  createNotice: (data) => service.post('/admin/notices', data),
  deleteNotice: (id) => service.delete(`/admin/notices/${id}`),
  parseWechatUrl: (url) => service.post('/admin/articles/parse-link', { url }),
  uploadImage: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return service.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  // 视频管理 (VideoAdmin 已经在使用之前的逻辑，这里为了统一也加上)
  getVideoResources: (params) => service.get('/admin/video-resources', { params }),
  updateVideoResource: (id, data) => service.put(`/admin/video-resources/${id}`, data),
  createVideoResource: (data) => service.post('/admin/video-resources', data),
  deleteVideoResource: (id) => service.delete(`/admin/video-resources/${id}`),
  
  // 轮播图管理
  getBanners: () => service.get('/admin/banners'),
  updateBanner: (id, data) => service.put(`/admin/banners/${id}`, data),
  updateBannerStatus: (id, status) => service.put(`/admin/banners/${id}/status`, { status }),
  createBanner: (data) => service.post('/admin/banners', data),
  deleteBanner: (id) => service.delete(`/admin/banners/${id}`),
  
  // 首页卡片
  getHomepageCards: () => service.get('/admin/homepage-cards'),
  updateHomepageCard: (id, data) => service.put(`/admin/homepage-cards/${id}`, data),
  createHomepageCard: (data) => service.post('/admin/homepage-cards', data),
  deleteHomepageCard: (id) => service.delete(`/admin/homepage-cards/${id}`),
  
  // 公共题库分类管理
  updatePublicCategory: (id, data) => service.post('/admin/question-bank/categories/update', { id, ...data }),
  createPublicCategory: (data) => service.post('/admin/question-bank/categories/add', data),
  deletePublicCategory: (id) => service.post('/admin/question-bank/categories/delete', { id }),
  
  // 题库管理 (通用 dispatcher)
  getQuestions: (type, params) => {
    const map = {
      'math': '/admin/math/search-questions',
      'computer': '/computer1/admin/questions',
      'public': '/admin/question-bank/questions/search',
      'med': '/med/admin/questions',
      'politics': '/admin/questions'
    }
    return service.get(map[type] || '/admin/questions', { params })
  },
  updateQuestion: (type, id, data) => {
    const map = {
      'math': `/admin/math/questions/${id}`,
      'computer': `/computer1/admin/questions/${id}`,
      'public': `/admin/question-bank/questions/update`, // Public uses POST for update usually based on publicRoutes
      'med': `/med/questions/${id}`
    }
    if (type === 'public') {
      return service.post(map[type], { id, ...data })
    }
    return service.put(map[type] || `/admin/questions/${id}`, data)
  },
  createQuestion: (type, data) => {
    const map = {
      'math': '/admin/math/questions',
      'computer': '/computer1/admin/questions', // Computer might not have create yet or uses import
      'public': '/admin/question-bank/questions/add',
      'med': '/med/admin/questions'
    }
    return service.post(map[type] || '/admin/questions', data)
  },
  deleteQuestion: (type, id) => {
    const map = {
      'math': `/admin/math/questions/${id}`,
      'computer': `/computer1/admin/questions/${id}`,
      'public': `/admin/question-bank/questions/delete`,
      'med': `/med/questions/${id}`
    }
    if (type === 'public') {
      return service.post(map[type], { id })
    }
    return service.delete(map[type] || `/admin/questions/${id}`)
  },
  importQuestions: (subject, data) => {
    // 根据科目分发到不同的导入接口
    const importMap = {
      'med': '/admin/med/import',
      'math': '/math/admin/import-questions',
      'computer': '/computer1/import',
      'politics': '/admin/politics/import', 
      'public': '/admin/question-bank/import'
    }
    const url = importMap[subject] || `/admin/questions/${subject}/import`
    
    // 适配不同后端的参数结构
    let payload = data
    if (subject === 'med') {
      payload = { filename: data.filename, jsonData: data.data }
    } else if (subject === 'math') {
      payload = { questions: data.data, bookId: data.bookId }
    } else if (subject === 'computer') {
      payload = { questions: data.data }
    }
    
    return service.post(url, payload)
  },
  getMedFiles: () => service.get('/admin/med/files'), // adminRoutes -> /med/files
  importMedFile: (data) => service.post('/admin/med/import', data), // adminRoutes -> /med/import

  // Dashboard
  getDashboardStats: () => service.get('/admin/stats'),

  // Configs
  getConfigs: () => service.get('/admin/configs'),
  saveConfigs: (data) => service.post('/admin/configs', data),

  // Public Management (Shared)
  getPublicCategories: (params) => service.get('/admin/question-bank/categories', { params }),
  
  // Politics Management
  getPoliticsSectionBooks: (sectionId) => service.get(`/admin/politics/sections/${sectionId}/books`),

  // Math Management
  getMathCorrections: (params) => service.get('/admin/math/corrections', { params }),
  ignoreMathCorrection: (id) => service.post(`/admin/math/corrections/${id}/ignore`),
  getMathBooks: (params) => service.get('/admin/math/books', { params }),
  getMathSubjects: () => service.get('/admin/math/subjects'),
  searchMathQuestions: (params) => service.get('/admin/math/search-questions', { params }),
  getMathQuestionDetail: (id) => service.get(`/admin/math/questions/${id}`),
  updateMathQuestion: (id, data) => service.put(`/admin/math/questions/${id}`, data),
  createMathQuestion: (data) => service.post('/admin/math/questions', data),
  deleteMathQuestion: (id) => service.delete(`/admin/math/questions/${id}`),
  createMathBook: (data) => service.post('/admin/math/books', data),
  updateMathBook: (id, data) => service.put(`/admin/math/books/${id}`, data),
  deleteMathBook: (id) => service.delete(`/admin/math/books/${id}`),

  // Med Management Aliases (Specific to Med Module)
  getMedCourses: () => service.get('/med/admin/courses'),
  getMedChapters: (params) => service.get('/med/admin/chapters', { params }),
  getMedFeedbacks: (params) => service.get('/med/feedbacks', { params }),
  searchMedQuestions: (params) => service.get('/med/admin/questions', { params }),
  updateMedFeedbackStatus: (id, data) => service.put(`/med/feedbacks/${id}`, data),
  getMedQuestionDetail: (id) => service.get(`/med/questions/${id}`),
  updateMedQuestion: (id, data) => service.put(`/med/questions/${id}`, data),
  updateMedCourse: (id, data) => service.put(`/med/admin/courses/${id}`, data),
  updateMedChapter: (id, data) => service.put(`/med/admin/chapters/${id}`, data),

  // Question Management (Courses/Subjects dispatcher)
  getCourses: (type) => {
    const map = {
      'math': '/admin/math/subjects',
      'computer': '/computer1/subjects',
      'public': '/subjects', // publicRoutes -> /subjects
      'med': '/med/admin/courses',
      'politics': '/politics/sections' // politicsRoutes -> /politics/sections
    }
    // Default to /admin/subjects if type is undefined or empty
    return service.get(map[type] || '/admin/subjects')
  },
  getFeedbacks: (type, params) => {
    const map = {
      'math': '/admin/math/corrections',
      'computer': '/computer1/feedbacks', // computer1Routes -> /computer1/feedbacks
      'public': '/admin/question-bank/feedbacks', // publicRoutes -> /admin/question-bank/feedbacks
      'med': '/med/feedbacks'
    }
    return service.get(map[type] || '/admin/question-bank/feedbacks', { params })
  },
  updateFeedback: (type, id, data) => {
    const map = {
      'computer': `/computer1/feedbacks/${id}`,
      'public': `/admin/question-bank/feedbacks/status`,
      'med': `/med/feedbacks/${id}`
    }
    if (type === 'public') {
      return service.post(map[type], { ids: [id], status: data.status })
    }
    return service.put(map[type] || `/admin/question-bank/feedbacks/${id}`, data)
  },
  replyFeedback: (type, id, data) => service.post(`/admin/questions/${type}/feedbacks/${id}/reply`, data),
  
  // Nav Subjects (Shared)
  getNavSubjects: () => service.get('/admin/nav-subjects'),
  // Alias for legacy calls
  getSubjects: () => service.get('/admin/nav-subjects'),
  getAdminSubjects: () => service.get('/admin/subjects'),
  
  // Missing methods restoration
  getBooks: (params) => service.get('/admin/question-bank/books', { params }), // publicRoutes -> /admin/question-bank/books
  getChapters: (params) => service.get('/admin/chapters', { params }), // adminRoutes -> /chapters
  createChapter: (data) => service.post('/admin/chapters', data),
  updateChapter: (id, data) => service.put(`/admin/chapters/${id}`, data),
  deleteChapter: (id) => service.delete(`/admin/chapters/${id}`),
  
  getCourseChapters: (type, courseId) => {
    const map = {
      'math': '/admin/math/chapters', // Not in routes, maybe books/:bookId/questions?
      'computer': '/computer1/chapters', // computer1Routes -> /computer1/chapters
      'public': '/question-bank/chapters', // publicRoutes -> /question-bank/chapters
      'med': '/med/admin/chapters'
    }
    // If specific math chapters endpoint doesn't exist, we might need to fallback or use book details
    return service.get(map[type] || '/admin/chapters', { params: { courseId, subjectId: courseId, course_id: courseId } })
  },

  // Computer Management
  getComputerSubjects: () => service.get('/computer1/subjects'),
  getComputerChapters: (params) => service.get('/computer1/chapters', { params }),
  getComputerFeedbacks: (params) => service.get('/computer1/feedbacks', { params }),
  searchComputerQuestions: (params) => service.get('/computer1/admin/questions', { params }),
  getComputerQuestionDetail: (id) => service.get(`/computer1/questions/${id}`),
  updateComputerQuestion: (id, data) => service.put(`/computer1/admin/questions/${id}`, data),
  deleteComputerQuestion: (id) => service.delete(`/computer1/admin/questions/${id}`),
  updateComputerFeedbackStatus: (id, data) => service.put(`/computer1/feedbacks/${id}`, data),
  importComputerPaper: (data) => service.post('/computer1/import-paper', data),
}

export const publicApi = {
  getPublicCategories: (params) => service.get('/question-bank/categories', { params }),
  getPublicBooks: (params) => service.get('/admin/question-bank/books', { params }),
  createBook: (data) => service.post('/admin/question-bank/books/add', data),
  updateBook: (id, data) => service.post('/admin/question-bank/books/update', { id, ...data }),
  deleteBook: (id) => service.post('/admin/question-bank/books/delete', { id }),
  getChapters: (params) => service.get('/admin/question-bank/chapters', { params }),
  createChapter: (data) => service.post('/admin/question-bank/chapters/add', data),
  updateChapter: (id, data) => service.post('/admin/question-bank/chapters/update', { id, ...data }),
  deleteChapter: (id) => service.post('/admin/question-bank/chapters/delete', { id }),
  updatePublicCategory: (id, data) => service.post('/admin/question-bank/categories/update', { id, ...data }),
  createPublicCategory: (data) => service.post('/admin/question-bank/categories/add', data),
  deletePublicCategory: (id) => service.post('/admin/question-bank/categories/delete', { id }),
  importPublicData: (data) => service.post('/question-bank/import', data),
  previewImportPublicData: (data) => service.post('/question-bank/preview-import', data),
  structureBook: (data) => service.post('/question-bank/structure', data),
  getFeedbacks: (params) => service.get('/admin/question-bank/feedbacks', { params }),
  replyFeedback: (id, data) => service.post(`/admin/question-bank/feedbacks/status`, { ids: [id], ...data }),
  updateFeedbackStatus: (id, status) => service.post(`/admin/question-bank/feedbacks/status`, { ids: [id], status }),
  batchUpdateFeedbackStatus: (ids, status) => service.post('/admin/question-bank/feedbacks/status', { ids, status }),
  getQuestions: (params) => service.get('/admin/question-bank/questions/search', { params }),
  getQuestionDetail: (id) => service.get(`/admin/question-bank/questions/${id}`),
  updateQuestion: (id, data) => service.post(`/admin/question-bank/questions/update`, { id, ...data }),
  createQuestion: (data) => service.post('/admin/question-bank/questions/add', data),
  deleteQuestion: (id) => service.post(`/admin/question-bank/questions/delete`, { id }),
  batchDeleteQuestions: (ids) => service.post('/admin/question-bank/questions/delete', { ids }),
  getResources: (params) => service.get('/admin/pan-resources', { params }),
  createResource: (data) => service.post('/admin/pan-resources/add', data),
  updateResource: (id, data) => service.post(`/admin/pan-resources/update`, { id, ...data }),
  deleteResource: (id) => service.post(`/admin/pan-resources/delete`, { id }),
}

export const adminVideoApi = {
  getSubjects: () => service.get('/admin/video/subjects'),
  createSubject: (data) => service.post('/admin/video/subjects', data),
  updateSubject: (id, data) => service.put(`/admin/video/subjects/${id}`, data),
  deleteSubject: (id) => service.delete(`/admin/video/subjects/${id}`),
  
  createCategory: (data) => service.post('/admin/video/categories', data),
  updateCategory: (id, data) => service.put(`/admin/video/categories/${id}`, data),
  deleteCategory: (id) => service.delete(`/admin/video/categories/${id}`),

  getResources: (params) => service.get('/admin/video/resources', { params }),
  getResourceDetail: (id) => service.get(`/admin/video/resources/${id}`),
  createResource: (data) => service.post('/admin/video/resources', data),
  updateResource: (id, data) => service.put(`/admin/video/resources/${id}`, data),
  deleteResource: (id) => service.delete(`/admin/video/resources/${id}`),
  batchUpdateResources: (ids, data) => service.post('/admin/video/resources/batch-update', { ids, ...data }),
  batchDeleteResources: (ids) => service.post('/admin/video/resources/batch-delete', { ids }),
  batchUpdateBySubject: (subjectId, data) => service.post(`/admin/video/subjects/${subjectId}/batch-update`, data),
  batchUpdateByCategory: (categoryId, data) => service.post(`/admin/video/categories/${categoryId}/batch-update`, data),

  getCodes: (params) => service.get('/admin/video/codes', { params }),
  generateCodes: (data) => service.post('/admin/video/codes/generate', data),
  
  getFeedbacks: (params) => service.get('/admin/video/feedbacks', { params }),
  parseBiliLink: (url) => service.post('/admin/video/parse-bili', { url }),
}

// Combine all into adminApi for default export (backward compatibility)
Object.assign(adminApi, {
  // Politics Section
  getPoliticsSections: () => service.get('/admin/politics/sections'),
  getSectionBooks: (sectionId) => service.get(`/admin/politics/sections/${sectionId}/books`),
  createPoliticsSection: (data) => service.post('/admin/politics/sections', data),
  updatePoliticsSection: (id, data) => service.put(`/admin/politics/sections/${id}`, data),
  deletePoliticsSection: (id) => service.delete(`/admin/politics/sections/${id}`),
  addPoliticsBookToSection: (sectionId, data) => service.post(`/admin/politics/sections/${sectionId}/books`, data),
  removePoliticsBookFromSection: (sectionId, bookId) => service.delete(`/admin/politics/sections/${sectionId}/books/${bookId}`),

  // Pan Resources
  getPanResources: (params) => service.get('/admin/pan-resources', { params }),
  getPanCategories: () => service.get('/admin/pan-categories'),
  createPanResource: (data) => service.post('/admin/pan-resources', data),
  updatePanResource: (id, data) => service.put(`/admin/pan-resources/${id}`, data),
  deletePanResource: (id) => service.delete(`/admin/pan-resources/${id}`),
  parsePanResources: (data) => service.post('/admin/pan-resources/parse', data),
  batchDeletePanResources: (data) => service.post('/admin/pan-resources/batch-delete', data),

  // Nav Management
  getNavSubjects: () => service.get('/admin/nav-subjects'),
  getNavCategories: (params) => service.get('/admin/nav-categories', { params }),
  createNavSubject: (data) => service.post('/admin/nav-subjects', data),
  updateNavSubject: (id, data) => service.put(`/admin/nav-subjects/${id}`, data),
  deleteNavSubject: (id) => service.delete(`/admin/nav-subjects/${id}`),
  createNavCategory: (data) => service.post('/admin/nav-categories', data),
  updateNavCategory: (id, data) => service.put(`/admin/nav-categories/${id}`, data),
  deleteNavCategory: (id) => service.delete(`/admin/nav-categories/${id}`),
})

export default adminApi
