import { request, BASE_URL } from './request.js'

export default {
  getUserList: (params) => {
    return request({
      url: '/admin/users',
      method: 'GET',
      data: params
    })
  },

  updateUserStatus: (id, data) => {
    return request({
      url: `/admin/users/${id}/status`,
      method: 'PUT',
      data: data
    })
  },

  getQuestions: (params) => {
    return request({
      url: '/admin/questions',
      method: 'GET',
      data: params
    })
  },

  createQuestion: (data) => {
    return request({
      url: '/admin/questions',
      method: 'POST',
      data: data
    })
  },

  updateQuestion: (id, data) => {
    return request({
      url: `/admin/questions/${id}`,
      method: 'PUT',
      data: data
    })
  },

  deleteQuestion: (id) => {
    return request({
      url: `/admin/questions/${id}`,
      method: 'DELETE'
    })
  },

  getExams: (params) => {
    return request({
      url: '/admin/exams',
      method: 'GET',
      data: params
    })
  },

  createExam: (data) => {
    return request({
      url: '/admin/exams',
      method: 'POST',
      data: data
    })
  },

  updateExam: (id, data) => {
    return request({
      url: `/admin/exams/${id}`,
      method: 'PUT',
      data: data
    })
  },

  deleteExam: (id) => {
    return request({
      url: `/admin/exams/${id}`,
      method: 'DELETE'
    })
  },

  getSubjects: (params) => {
    return request({
      url: '/admin/subjects',
      method: 'GET',
      data: params
    })
  },

  createSubject: (data) => {
    return request({
      url: '/admin/subjects',
      method: 'POST',
      data: data
    })
  },

  updateSubject: (id, data) => {
    return request({
      url: `/admin/subjects/${id}`,
      method: 'PUT',
      data: data
    })
  },

  // 数学题目管理
  getMathCorrections: (params) => {
    return request({
      url: '/admin/math/corrections',
      method: 'GET',
      data: params
    })
  },

  ignoreMathCorrection: (id) => {
    return request({
      url: `/admin/math/corrections/${id}/ignore`,
      method: 'POST'
    })
  },

  searchMathQuestions: (params) => {
    return request({
      url: '/admin/math/search-questions',
      method: 'GET',
      data: params
    })
  },

  searchKnowledgePoints: (params) => {
    return request({
      url: '/admin/math/search-kp',
      method: 'GET',
      data: params
    })
  },

  getKnowledgePointDetail: (kpId) => {
    return request({
      url: `/admin/math/kp/${kpId}`,
      method: 'GET'
    })
  },

  updateKnowledgePoint: (kpId, data) => {
    return request({
      url: `/admin/math/kp/${kpId}`,
      method: 'PUT',
      data: data
    })
  },

  getMathQuestionDetail: (questionId) => {
    return request({
      url: `/admin/math/questions/${questionId}`,
      method: 'GET'
    })
  },

  createMathQuestion: (data) => {
    return request({
      url: '/admin/math/questions',
      method: 'POST',
      data: data
    })
  },

  updateMathQuestion: (questionId, data) => {
    return request({
      url: `/admin/math/questions/${questionId}`,
      method: 'PUT',
      data: data
    })
  },

  deleteMathQuestion: (questionId) => {
    return request({
      url: `/admin/math/questions/${questionId}`,
      method: 'DELETE'
    })
  },

  deleteMathCorrection: (id) => {
    return request({
      url: `/admin/math/corrections/${id}`,
      method: 'DELETE'
    })
  },

  // 书籍管理
  getMathBooks: (params) => {
    return request({
      url: '/admin/math/books',
      method: 'GET',
      data: params
    })
  },
  
  createMathBook: (data) => {
    return request({
      url: '/admin/math/books',
      method: 'POST',
      data: data
    })
  },

  // 网盘资源管理
  getPanResources: (params) => {
    return request({
      url: '/admin/pan-resources',
      method: 'GET',
      data: params
    })
  },

  createPanResource: (data) => {
    return request({
      url: '/admin/pan-resources',
      method: 'POST',
      data: data
    })
  },

  updatePanResource: (id, data) => {
    return request({
      url: `/admin/pan-resources/${id}`,
      method: 'PUT',
      data: data
    })
  },

  deletePanResource: (id) => {
    return request({
      url: `/admin/pan-resources/${id}`,
      method: 'DELETE'
    })
  },

  parsePanResources: (data) => {
    return request({
      url: '/admin/pan-resources/parse',
      method: 'POST',
      data: data
    })
  },

  importPanResources: (data) => {
    return request({
      url: '/admin/pan-resources/import',
      method: 'POST',
      data: data
    })
  },

  batchDeletePanResources: (data) => {
    return request({
      url: '/admin/pan-resources/batch-delete',
      method: 'POST',
      data: data
    })
  },

  batchUpdatePanResourcesCategory: (data) => {
    return request({
      url: '/admin/pan-resources/batch-update-category',
      method: 'POST',
      data: data
    })
  },

  getPanCategories: (full = false) => {
    return request({
      url: '/admin/pan-categories',
      method: 'GET',
      data: { full }
    })
  },

  createPanCategory: (data) => {
    return request({
      url: '/admin/pan-categories',
      method: 'POST',
      data: data
    })
  },

  updatePanCategory: (id, data) => {
    return request({
      url: `/admin/pan-categories/${id}`,
      method: 'PUT',
      data: data
    })
  },

  deletePanCategory: (id) => {
    return request({
      url: `/admin/pan-categories/${id}`,
      method: 'DELETE'
    })
  },

  updateMathBook: (bookId, data) => {
    return request({
      url: `/admin/math/books/${bookId}`,
      method: 'PUT',
      data: data
    })
  },

  deleteMathBook: (bookId) => {
    return request({
      url: `/admin/math/books/${bookId}`,
      method: 'DELETE'
    })
  },

  getBookQuestions: (bookId) => {
    return request({
      url: `/admin/math/books/${bookId}/questions`,
      method: 'GET'
    })
  },

  getMathSubjects: () => {
    return request({
      url: '/admin/math/subjects',
      method: 'GET'
    })
  },

  // 题目导入
  importMathQuestions: (data) => {
    return request({
      url: '/math/admin/import-questions',
      method: 'POST',
      data: data
    })
  },

  importMathComplexQuestions: (data) => {
    return request({
      url: '/math/admin/import-complex-questions',
      method: 'POST',
      data: data
    })
  },

  deleteSubject: (id) => {
    return request({
      url: `/admin/subjects/${id}`,
      method: 'DELETE'
    })
  },

  // 练习页面导航管理 (MySQL)
  getNavSubjects: () => {
    return request({
      url: '/admin/nav-subjects',
      method: 'GET'
    })
  },

  createNavSubject: (data) => {
    return request({
      url: '/admin/nav-subjects',
      method: 'POST',
      data
    })
  },

  updateNavSubject: (id, data) => {
    return request({
      url: `/admin/nav-subjects/${id}`,
      method: 'PUT',
      data
    })
  },

  deleteNavSubject: (id) => {
    return request({
      url: `/admin/nav-subjects/${id}`,
      method: 'DELETE'
    })
  },

  getNavCategories: (params) => {
    return request({
      url: '/admin/nav-categories',
      method: 'GET',
      data: params
    })
  },

  createNavCategory: (data) => {
    return request({
      url: '/admin/nav-categories',
      method: 'POST',
      data
    })
  },

  updateNavCategory: (id, data) => {
    return request({
      url: `/admin/nav-categories/${id}`,
      method: 'PUT',
      data
    })
  },

  deleteNavCategory: (id) => {
    return request({
      url: `/admin/nav-categories/${id}`,
      method: 'DELETE'
    })
  },

  createPublicCategory: (data) => {
    return request({
      url: '/admin/public-categories',
      method: 'POST',
      data
    })
  },

  updatePublicCategory: (id, data) => {
    return request({
      url: `/admin/public-categories/${id}`,
      method: 'PUT',
      data
    })
  },

  deletePublicCategory: (id) => {
    return request({
      url: `/admin/public-categories/${id}`,
      method: 'DELETE'
    })
  },

  getChapters: (params) => {
    return request({
      url: '/admin/chapters',
      method: 'GET',
      data: params
    })
  },

  createChapter: (data) => {
    return request({
      url: '/admin/chapters',
      method: 'POST',
      data: data
    })
  },

  updateChapter: (id, data) => {
    return request({
      url: `/admin/chapters/${id}`,
      method: 'PUT',
      data: data
    })
  },

  deleteChapter: (id) => {
    return request({
      url: `/admin/chapters/${id}`,
      method: 'DELETE'
    })
  },

  getStatistics: () => {
    return request({
      url: '/admin/statistics',
      method: 'GET'
    })
  },

  getBanners: (params) => {
    return request({
      url: '/admin/banners',
      method: 'GET',
      data: params
    })
  },

  createBanner: (data) => {
    return request({
      url: '/admin/banners',
      method: 'POST',
      data: data
    })
  },

  updateBanner: (id, data) => {
    return request({
      url: `/admin/banners/${id}`,
      method: 'PUT',
      data: data
    })
  },

  deleteBanner: (id) => {
    return request({
      url: `/admin/banners/${id}`,
      method: 'DELETE'
    })
  },
  
  updateBannerStatus: (id, status) => {
    return request({
      url: `/admin/banners/${id}/status`,
      method: 'PUT',
      data: { status }
    })
  },

  getSystemSettings: () => {
    return request({
      url: '/admin/configs',
      method: 'GET'
    })
  },

  updateSystemSettings: (data) => {
    return request({
      url: '/admin/configs',
      method: 'POST',
      data: data
    })
  },

  getConfigs: () => {
    return request({
      url: '/admin/configs',
      method: 'GET'
    })
  },

  updateConfig: (data) => {
    return request({
      url: '/admin/configs',
      method: 'POST',
      data: data
    })
  },

  uploadImage: (filePath) => {
    return new Promise((resolve, reject) => {
      uni.uploadFile({
        url: BASE_URL.replace('/api', '') + '/api/upload/image',
        filePath: filePath,
        name: 'image',
        success: (res) => {
          if (res.statusCode === 200) {
            try {
              const data = JSON.parse(res.data);
              if (data.code === 0) {
                resolve(data);
              } else {
                reject(new Error(data.message || '上传失败'));
              }
            } catch (e) {
              reject(new Error('解析响应失败'));
            }
          } else {
            reject(new Error('上传失败: ' + res.statusCode));
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  },

  getNotices: (params) => {
    return request({
      url: '/admin/notices',
      method: 'GET',
      data: params
    })
  },

  getNoticeById: (id) => {
    return request({
      url: `/admin/notices/${id}`,
      method: 'GET'
    })
  },

  createNotice: (data) => {
    return request({
      url: '/admin/notices',
      method: 'POST',
      data: data
    })
  },

  updateNotice: (id, data) => {
    return request({
      url: `/admin/notices/${id}`,
      method: 'PUT',
      data: data
    })
  },

  deleteNotice: (id) => {
    return request({
      url: `/admin/notices/${id}`,
      method: 'DELETE'
    })
  },

  parseArticleLink: (data) => {
    return request({
      url: '/admin/articles/parse-link',
      method: 'POST',
      data: data
    })
  },

  updateNoticeStatus: (id, isActive) => {
    return request({
      url: `/admin/notices/${id}`,
      method: 'PUT',
      data: { isActive }
    })
  },

  getExamTypes: (params) => {
    return request({
      url: '/admin/exam-types',
      method: 'GET',
      data: params
    })
  },

  createExamType: (data) => {
    return request({
      url: '/admin/exam-types',
      method: 'POST',
      data: data
    })
  },

  updateExamType: (id, data) => {
    return request({
      url: `/admin/exam-types/${id}`,
      method: 'PUT',
      data: data
    })
  },

  deleteExamType: (id) => {
    return request({
      url: `/admin/exam-types/${id}`,
      method: 'DELETE'
    })
  },

  // 首页卡片管理
  getHomepageCards: () => {
    return request({
      url: '/admin/homepage-cards',
      method: 'GET'
    })
  },

  createHomepageCard: (data) => {
    return request({
      url: '/admin/homepage-cards',
      method: 'POST',
      data: data
    })
  },

  updateHomepageCard: (id, data) => {
    return request({
      url: `/admin/homepage-cards/${id}`,
      method: 'PUT',
      data: data
    })
  },

  deleteHomepageCard: (id) => {
    return request({
      url: `/admin/homepage-cards/${id}`,
      method: 'DELETE'
    })
  },

  // 政治板块管理
  getPoliticsSections: () => {
    return request({
      url: '/admin/politics/sections',
      method: 'GET'
    })
  },

  createPoliticsSection: (data) => {
    return request({
      url: '/admin/politics/sections',
      method: 'POST',
      data: data
    })
  },

  updatePoliticsSection: (id, data) => {
    return request({
      url: `/admin/politics/sections/${id}`,
      method: 'PUT',
      data: data
    })
  },

  deletePoliticsSection: (id) => {
    return request({
      url: `/admin/politics/sections/${id}`,
      method: 'DELETE'
    })
  },

  getSectionBooks: (sectionId) => {
    return request({
      url: `/admin/politics/sections/${sectionId}/books`,
      method: 'GET'
    })
  },

  addBookToSection: (sectionId, data) => {
    return request({
      url: `/admin/politics/sections/${sectionId}/books`,
      method: 'POST',
      data: data
    })
  },

  removeBookFromSection: (sectionId, bookId) => {
    return request({
      url: `/admin/politics/sections/${sectionId}/books/${bookId}`,
      method: 'DELETE'
    })
  }
};
