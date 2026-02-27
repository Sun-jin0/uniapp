import request from '@/api/request';

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
    return request.put('/admin/video/resources/batch', { ids, ...data });
  },
  batchDeleteResources(ids) {
    return request.delete('/admin/video/resources/batch', { ids });
  },

  // Collections
  getCollections() {
    return request.get('/admin/video/collections');
  },
  getCollectionDetail(id) {
    return request.get(`/admin/video/collections/${id}`);
  },
  createCollection(data) {
    return request.post('/admin/video/collections', data);
  },
  updateCollection(id, data) {
    return request.put(`/admin/video/collections/${id}`, data);
  },
  deleteCollection(id) {
    return request.delete(`/admin/video/collections/${id}`);
  },
  updateCollectionVideos(id, videoIds) {
    return request.put(`/admin/video/collections/${id}/videos`, { video_ids: videoIds });
  },

  // Codes
  getCodes(params) {
    return request.get('/admin/video/codes', params);
  },
  generateCodes(data) {
    return request.post('/admin/video/codes/generate', data);
  },
  generateCollectionCodes(data) {
    return request.post('/admin/video/codes/collection', data);
  },

  // Feedbacks
  getFeedbacks(params) {
    return request.get('/admin/video/feedbacks', params);
  },
  updateFeedback(id, data) {
    return request.put(`/admin/video/feedbacks/${id}`, data);
  },

  // Parse
  parseBiliLink(link) {
    return request.post('/admin/video/parse-bili', { link });
  }
};
