
import request from './request';

export default {
  // Subjects
  getSubjects() {
    return request.get('/admin/video/subjects');
  },
  createSubject(data) {
    return request.post('/admin/video/subjects', data);
  },
  updateSubject(id, data) {
    return request.put(`/admin/video/subjects/${id}`, data);
  },
  deleteSubject(id) {
    return request.delete(`/admin/video/subjects/${id}`);
  },

  // Categories
  getCategories(subjectId) {
    return request.get('/admin/video/categories', { subject_id: subjectId });
  },
  createCategory(data) {
    return request.post('/admin/video/categories', data);
  },
  updateCategory(id, data) {
    return request.put(`/admin/video/categories/${id}`, data);
  },
  deleteCategory(id) {
    return request.delete(`/admin/video/categories/${id}`);
  },

  // Resources
  getResources(params) {
    return request.get('/admin/video/resources', params);
  },
  getResourceDetail(id) {
    return request.get(`/admin/video/resources/${id}`);
  },
  createResource(data) {
    return request.post('/admin/video/resources', data);
  },
  updateResource(id, data) {
    return request.put(`/admin/video/resources/${id}`, data);
  },
  deleteResource(id) {
    return request.delete(`/admin/video/resources/${id}`);
  },

  // Batch
  batchUpdateResources(ids, data) {
    return request.post('/admin/video/resources/batch-update', { ids, data });
  },
  batchDeleteResources(ids) {
    return request.post('/admin/video/resources/batch-delete', { ids });
  },
  batchUpdateBySubject(subjectId, data) {
    return request.post('/admin/video/resources/batch-update-subject', { subjectId, data });
  },
  batchUpdateByCategory(categoryId, data) {
    return request.post('/admin/video/resources/batch-update-category', { categoryId, data });
  },

  // Codes
  generateCodes(data) {
    return request.post('/admin/video/codes/generate', data);
  },
  getCodes(params) {
    return request.get('/admin/video/codes', params);
  },
  
  // Feedbacks
  getFeedbacks(params) {
    return request.get('/admin/video/feedbacks', params);
  },

  // Bilibili
  parseBiliLink(url) {
    return request.get('/video/parse-bili', { url });
  }
};
