const express = require('express');
const router = express.Router();
const adminMathController = require('../controllers/adminMathController');

// 科目列表
router.get('/math/subjects', adminMathController.getSubjects);
router.post('/math/admin/subjects', adminMathController.createSubject);
router.put('/math/admin/subjects/:id', adminMathController.updateSubject);
router.delete('/math/admin/subjects/:id', adminMathController.deleteSubject);

// 纠错管理 (使用不同的路径避免与mathRoutes冲突)
router.get('/math/admin/corrections', adminMathController.getCorrections);
router.put('/math/admin/corrections/:id', adminMathController.ignoreCorrection);
router.delete('/math/admin/corrections/:id', adminMathController.deleteCorrection);

// 题目管理
router.get('/math/admin/questions', adminMathController.adminSearchQuestions);
router.get('/math/admin/questions/:questionId/detail', adminMathController.getQuestionForEdit);
router.post('/math/admin/questions', adminMathController.createQuestion);
router.put('/math/admin/questions/:questionId', adminMathController.updateQuestion);
router.delete('/math/admin/questions/:questionId', adminMathController.deleteQuestion);

// 兼容路由 - 与参考页面保持一致
router.get('/admin/math/questions', adminMathController.adminSearchQuestions);
router.post('/admin/math/questions', adminMathController.createQuestion);
router.put('/admin/math/questions/:questionId', adminMathController.updateQuestion);
router.delete('/admin/math/questions/:questionId', adminMathController.deleteQuestion);

// 搜索
router.get('/admin/math/search-questions', adminMathController.searchQuestions);
router.get('/admin/math/search-kp', adminMathController.searchKnowledgePoints);
router.get('/admin/math/kp/:kpId', adminMathController.getKnowledgePointDetail);
router.put('/admin/math/kp/:kpId', adminMathController.updateKnowledgePoint);

// 书籍/试卷管理 - 注意：更具体的路由要放在前面
router.get('/math/admin/books', adminMathController.getBooks);
router.post('/math/admin/books', adminMathController.createBook);

// 书籍章节管理 (放在 /:bookId 之前，避免被解析为bookId)
router.get('/math/admin/books/:bookId/chapters', adminMathController.getBookChapters);
router.post('/math/admin/books/:bookId/chapters', adminMathController.addBookChapter);
router.get('/math/admin/books/:bookId/chapters/:chapterName/questions', adminMathController.getBookChapterQuestions);
router.put('/math/admin/books/:bookId/chapters/:chapterName', adminMathController.updateBookChapter);
router.delete('/math/admin/books/:bookId/chapters/:chapterName', adminMathController.deleteBookChapter);

// 书籍题目管理
router.get('/math/admin/books/:bookId/questions', adminMathController.getBookQuestions);
router.put('/math/admin/books/:bookId/questions/:questionId', adminMathController.updateBookQuestion);
router.delete('/math/admin/books/:bookId/questions/:questionId', adminMathController.deleteBookQuestion);
router.post('/math/admin/books/:bookId/questions/batch-delete', adminMathController.batchDeleteBookQuestions);
router.post('/math/admin/books/:bookId/add-questions', adminMathController.addQuestionsToBook);

// 书籍基本操作 (放在最后，避免捕获其他路由)
router.put('/math/admin/books/:bookId', adminMathController.updateBook);
router.delete('/math/admin/books/:bookId', adminMathController.deleteBook);

// 批量导入
router.post('/math/admin/import-questions', adminMathController.importQuestions);
router.post('/math/admin/import-complex-questions', adminMathController.importComplexQuestions);
router.post('/math/admin/import-from-files', adminMathController.importFromFiles);

// 相关题管理
router.post('/math/admin/related-questions', adminMathController.saveRelatedQuestions);

module.exports = router;
