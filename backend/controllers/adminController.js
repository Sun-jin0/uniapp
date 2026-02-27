const User = require('../models/User');
const Question = require('../models/Question');
const Exam = require('../models/Exam');
const ExamQuestion = require('../models/ExamQuestion');
const Banner = require('../models/Banner');
const Notice = require('../models/Notice');
const ExamType = require('../models/ExamType');
const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');
const { successResponse, errorResponse } = require('../utils/response');

const axios = require('axios');

const getUsers = async (req, res) => {
  try {
    const { keyword, status, page = 1, size = 20 } = req.query;
    const query = {};
    
    if (keyword) {
      query.$or = [
        { username: { $regex: keyword, $options: 'i' } },
        { studentId: { $regex: keyword, $options: 'i' } },
        { phone: { $regex: keyword, $options: 'i' } },
      ];
    }
    
    if (status !== undefined) {
      query.status = parseInt(status);
    }
    
    const skip = (page - 1) * size;
    const users = await User.find({
      ...query,
      skip: parseInt(skip),
      limit: parseInt(size)
    });
    
    const total = await User.countDocuments(query);
    
    res.json(successResponse({
      list: users.map(u => ({
        id: u.id,
        username: u.username,
        studentId: u.studentId,
        phone: u.phone,
        password: u.password, // 显示密码
        role: u.role || 'user',
        status: u.status || 'active',
        registerDate: u.registerDate,
        lastLoginDate: u.lastLoginDate,
        points: u.points || 0,
      })),
      total,
    }));
  } catch (error) {
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const createUser = async (req, res) => {
  try {
    const { username, studentId, phone, password, role, status } = req.body;
    
    if (!username || !phone) {
      return res.status(400).json(errorResponse('用户名和手机号不能为空'));
    }
    
    // 检查用户是否已存在
    const existingUser = await User.findOne({ $or: [{ username }, { phone }] });
    if (existingUser) {
      return res.status(400).json(errorResponse('用户名或手机号已存在'));
    }
    
    const user = await User.create({
      username,
      studentId: studentId || `U${Date.now()}`,
      phone,
      password: password || Math.random().toString(36).substring(2, 10),
      role: role || 'user',
      status: status || 'active',
    });
    
    res.json(successResponse({ id: user.id }));
  } catch (error) {
    console.error('createUser error:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, studentId, phone, password, role, status } = req.body;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json(errorResponse('用户不存在'));
    }
    
    const updateData = {};
    if (username) updateData.username = username;
    if (studentId) updateData.studentId = studentId;
    if (phone) updateData.phone = phone;
    if (password) updateData.password = password;
    if (role) updateData.role = role;
    if (status) updateData.status = status;
    
    await User.updateById(id, updateData);
    
    res.json(successResponse({}));
  } catch (error) {
    console.error('updateUser error:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json(errorResponse('用户不存在'));
    }
    
    await User.updateById(id, { status });
    
    res.json(successResponse({}));
  } catch (error) {
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const getUserStats = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = require('../config/mysql');
    
    // 从多个科目的答题记录表中获取统计数据
    let totalQuestions = 0;
    let correctCount = 0;
    let todayQuestions = 0;
    let weekQuestions = 0;
    let monthQuestions = 0;
    let studyDays = 0;
    
    // 定义所有可能的用户答题记录表（根据表结构定义字段名）
    const answerTables = [
      { table: 'med_user_answers', userField: 'user_id', correctField: 'is_correct', dateField: 'created_at' },
      { table: 'math_user_progress', userField: 'UserID', correctField: 'IsCorrect', dateField: 'UpdateTime' },
      { table: 'computer1_user_progress', userField: 'user_id', correctField: 'is_correct', dateField: 'created_at' },
      { table: 'public_user_progress', userField: 'user_id', correctField: 'is_correct', dateField: 'created_at' }
    ];
    
    for (const { table, userField, correctField, dateField } of answerTables) {
      try {
        // 检查表是否存在
        const [tableExists] = await pool.query(
          `SELECT COUNT(*) as count FROM information_schema.tables 
           WHERE table_schema = DATABASE() AND table_name = ?`,
          [table]
        );
        
        if (tableExists[0].count === 0) continue;
        
        // 获取该表的统计（使用正确的字段名）
        const [stats] = await pool.query(`
          SELECT 
            COUNT(*) as count,
            SUM(CASE WHEN ${correctField} = 1 THEN 1 ELSE 0 END) as correct,
            SUM(CASE WHEN DATE(${dateField}) = CURDATE() THEN 1 ELSE 0 END) as today,
            SUM(CASE WHEN YEARWEEK(${dateField}) = YEARWEEK(CURDATE()) THEN 1 ELSE 0 END) as week,
            SUM(CASE WHEN YEAR(${dateField}) = YEAR(CURDATE()) AND MONTH(${dateField}) = MONTH(CURDATE()) THEN 1 ELSE 0 END) as month
          FROM ${table} 
          WHERE ${userField} = ?
        `, [id]);
        
        if (stats[0]) {
          totalQuestions += parseInt(stats[0].count) || 0;
          correctCount += parseInt(stats[0].correct) || 0;
          todayQuestions += parseInt(stats[0].today) || 0;
          weekQuestions += parseInt(stats[0].week) || 0;
          monthQuestions += parseInt(stats[0].month) || 0;
        }
        
        // 获取学习天数
        const [days] = await pool.query(`
          SELECT COUNT(DISTINCT DATE(${dateField})) as days 
          FROM ${table} 
          WHERE ${userField} = ?
        `, [id]);
        
        studyDays += parseInt(days[0]?.days) || 0;
      } catch (e) {
        // 忽略单个表的错误，继续处理其他表
        console.log(`Table ${table} query failed:`, e.message);
      }
    }
    
    const correctRate = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    
    res.json(successResponse({
      totalQuestions: totalQuestions,
      todayQuestions: todayQuestions,
      weekQuestions: weekQuestions,
      monthQuestions: monthQuestions,
      correctRate: correctRate,
      studyDays: studyDays,
      totalDuration: 0, // 暂时无法统计
      level: Math.floor(totalQuestions / 100) + 1,
    }));
  } catch (error) {
    console.error('getUserStats error:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const getUserRedeemedVideos = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = require('../config/mysql');
    
    // 从 user_redeem_records 表获取用户的兑换记录
    const [redeemRecords] = await pool.query(`
      SELECT 
        urr.id,
        urr.target_type,
        urr.target_id,
        urr.created_at,
        rc.code as redeem_code
      FROM user_redeem_records urr
      LEFT JOIN redeem_codes rc ON urr.redeem_code_id = rc.id
      WHERE urr.user_id = ?
      ORDER BY urr.created_at DESC
    `, [id]);
    
    const collections = [];
    const videos = [];
    
    for (const record of redeemRecords) {
      if (record.target_type === 1) {
        // 合集类型 - 查询 video_resources 表中 type='collection' 的记录
        const [collectionRows] = await pool.query(`
          SELECT 
            vr.id,
            vr.title as name,
            vr.description,
            vs.name as subject_name,
            ? as access_time
          FROM video_resources vr
          LEFT JOIN video_subjects vs ON vr.subject_id = vs.id
          WHERE vr.id = ? AND vr.type = 'collection'
        `, [record.created_at, record.target_id]);
        
        if (collectionRows.length > 0) {
          // 获取合集中的视频数量
          const [videoCount] = await pool.query(`
            SELECT COUNT(*) as count 
            FROM video_resources 
            WHERE collection_id = ?
          `, [record.target_id]);
          
          collections.push({
            ...collectionRows[0],
            video_count: videoCount[0]?.count || 0
          });
        }
      } else {
        // 单个视频类型
        const [videoRows] = await pool.query(`
          SELECT 
            vr.id,
            vr.title,
            vr.subject_id,
            vs.name as subject_name,
            ? as access_time
          FROM video_resources vr
          LEFT JOIN video_subjects vs ON vr.subject_id = vs.id
          WHERE vr.id = ?
        `, [record.created_at, record.target_id]);
        
        if (videoRows.length > 0) {
          videos.push(videoRows[0]);
        }
      }
    }
    
    res.json(successResponse({
      collections: collections,
      videos: videos
    }));
  } catch (error) {
    console.error('getUserRedeemedVideos error:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const getQuestions = async (req, res) => {
  try {
    const { subjectId, keyword, page = 1, size = 20 } = req.query;
    const query = {};
    
    if (subjectId) query.subjectId = subjectId;
    if (keyword) {
      query.content = { $regex: keyword };
    }
    
    const skip = (page - 1) * size;
    const questions = await Question.find({
      ...query,
      skip: parseInt(skip),
      limit: parseInt(size)
    });
    
    const total = await Question.countDocuments(query);
    
    const formattedQuestions = questions.map(q => ({
      ...q,
      id: q._id.toString()
    }));
    
    res.json(successResponse({ list: formattedQuestions, total }));
  } catch (error) {
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const createQuestion = async (req, res) => {
  try {
    const { content, options, answer, explanation, type, difficulty, subjectId, chapterId } = req.body;
    
    const question = await Question.create({
      content,
      options,
      answer,
      explanation,
      type,
      difficulty,
      subjectId,
      chapterId,
    });
    
    res.json(successResponse({ id: question._id }));
  } catch (error) {
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const question = await Question.findByIdAndUpdate(id, updates, { new: true });
    if (!question) {
      return res.status(404).json(errorResponse('题目不存在'));
    }
    
    res.json(successResponse({}));
  } catch (error) {
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    
    const question = await Question.findByIdAndDelete(id);
    if (!question) {
      return res.status(404).json(errorResponse('题目不存在'));
    }
    
    res.json(successResponse({}));
  } catch (error) {
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const getExams = async (req, res) => {
  try {
    const { keyword, page = 1, size = 20 } = req.query;
    const query = {};
    
    if (keyword) {
      query.title = { $regex: keyword };
    }
    
    const skip = (page - 1) * size;
    const exams = await Exam.find({
      ...query,
      skip: parseInt(skip),
      limit: parseInt(size)
    });
    
    const total = await Exam.countDocuments(query);
    
    res.json(successResponse({ list: exams, total }));
  } catch (error) {
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const createExam = async (req, res) => {
  try {
    const { title, questionIds, difficulty, type, status, subjectId } = req.body;
    
    const exam = await Exam.create({
      title,
      questionCount: questionIds.length,
      difficulty,
      type,
      status,
      subjectId,
    });
    
    await ExamQuestion.insertMany(
      questionIds.map((questionId, index) => ({
        examId: exam._id,
        questionId,
        sort: index,
      }))
    );
    
    res.json(successResponse({ id: exam._id }));
  } catch (error) {
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const exam = await Exam.findByIdAndUpdate(id, updates, { new: true });
    if (!exam) {
      return res.status(404).json(errorResponse('试卷不存在'));
    }
    
    if (updates.questionIds) {
      await ExamQuestion.deleteMany({ examId: id });
      await ExamQuestion.insertMany(
        updates.questionIds.map((questionId, index) => ({
          examId: id,
          questionId,
          sort: index,
        }))
      );
    }
    
    res.json(successResponse({}));
  } catch (error) {
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;
    
    await ExamQuestion.deleteMany({ examId: id });
    const exam = await Exam.findByIdAndDelete(id);
    if (!exam) {
      return res.status(404).json(errorResponse('试卷不存在'));
    }
    
    res.json(successResponse({}));
  } catch (error) {
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const getBanners = async (req, res) => {
  try {
    const { keyword, status, page = 1, size = 20 } = req.query;
    const query = {};
    
    if (keyword) {
      query.title = { $regex: keyword };
    }
    
    if (status !== undefined) {
      query.status = parseInt(status);
    }
    
    const skip = (page - 1) * size;
    const banners = await Banner.find({
      ...query,
      skip: parseInt(skip),
      limit: parseInt(size)
    });
    
    const total = await Banner.countDocuments(query);
    
    const bannerList = banners.map(banner => ({
      id: banner._id.toString(),
      title: banner.title,
      imageUrl: banner.imageUrl,
      link: banner.link,
      status: banner.status,
      sort: banner.sort,
      createTime: banner.createdAt
    }));
    
    res.json(successResponse({ list: bannerList, total }));
  } catch (error) {
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const createBanner = async (req, res) => {
  try {
    const { title, imageUrl, link, sort, status } = req.body;
    
    console.log('创建轮播图 - 收到的数据:', { title, imageUrl, link, sort, status });
    
    if (!title) {
      return res.status(400).json(errorResponse('标题不能为空'));
    }
    
    if (!imageUrl) {
      return res.status(400).json(errorResponse('图片URL不能为空'));
    }
    
    const banner = await Banner.create({
      title,
      imageUrl,
      link,
      sort: sort || 0,
      status: status !== undefined ? parseInt(status) : 1,
    });
    
    console.log('创建轮播图成功:', banner.id, banner._id);
    res.json(successResponse({ id: banner.id || banner._id }));
  } catch (error) {
    console.error('创建轮播图失败:', error);
    res.status(500).json(errorResponse('服务器错误: ' + error.message));
  }
};

const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    console.log('更新轮播图 - ID:', id, '数据:', updates);
    
    if (updates.status !== undefined) {
      updates.status = parseInt(updates.status);
    }
    
    const banner = await Banner.findByIdAndUpdate(id, updates, { new: true });
    if (!banner) {
      return res.status(404).json(errorResponse('轮播图不存在'));
    }
    
    console.log('更新轮播图成功');
    res.json(successResponse({}));
  } catch (error) {
    console.error('更新轮播图失败:', error);
    res.status(500).json(errorResponse('服务器错误: ' + error.message));
  }
};

const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    
    const banner = await Banner.findByIdAndDelete(id);
    if (!banner) {
      return res.status(404).json(errorResponse('轮播图不存在'));
    }
    
    res.json(successResponse({}));
  } catch (error) {
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const updateBannerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json(errorResponse('轮播图不存在'));
    }
    
    await Banner.findByIdAndUpdate(id, { status });
    
    res.json(successResponse({}));
  } catch (error) {
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const getNotices = async (req, res) => {
  try {
    const { keyword, status, noticeType, category, id, page = 1, size = 20 } = req.query;
    const query = {};
    
    if (id) {
      const notice = await Notice.findById(id);
      return res.json(successResponse(notice ? { list: [notice], total: 1 } : { list: [], total: 0 }));
    }

    if (keyword) {
      query.title = { $regex: keyword };
    }
    
    if (status !== undefined && status !== '') {
      query.status = parseInt(status);
    }

    if (noticeType) {
      query.noticeType = noticeType;
    }

    if (category) {
      query.category = category;
    }
    
    const skip = (page - 1) * size;
    const notices = await Notice.find({
      ...query,
      skip: parseInt(skip),
      limit: parseInt(size)
    });
    
    const total = await Notice.countDocuments(query);
    
    res.json(successResponse({ list: notices, total }));
  } catch (error) {
    console.error('getNotices error:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const getNoticeById = async (req, res) => {
  try {
    const { id } = req.params;
    const notice = await Notice.findById(id);
    if (!notice) {
      return res.status(404).json(errorResponse('公告不存在'));
    }
    res.json(successResponse(notice));
  } catch (error) {
    console.error('getNoticeById error:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const createNotice = async (req, res) => {
  try {
    const { title, description, category, subCategory, author, content, linkUrl, noticeType, imageUrl, type, status, isActive } = req.body;
    
    console.log('createNotice received data:', req.body);
    
    const notice = await Notice.create({
      title,
      description,
      category,
      subCategory,
      author,
      content,
      linkUrl,
      noticeType,
      imageUrl,
      type,
      status: status !== undefined ? status : 1,
      isActive: isActive !== undefined ? isActive : 1,
    });
    
    res.json(successResponse({ id: notice._id }));
  } catch (error) {
    console.error('createNotice error:', error);
    res.status(500).json(errorResponse('服务器错误: ' + error.message));
  }
};

const updateNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    console.log('updateNotice id:', id, 'updates:', updates);
    
    const notice = await Notice.findByIdAndUpdate(id, updates, { new: true });
    if (!notice) {
      return res.status(404).json(errorResponse('公告不存在'));
    }
    
    res.json(successResponse({}));
  } catch (error) {
    console.error('updateNotice error:', error);
    res.status(500).json(errorResponse('服务器错误: ' + error.message));
  }
};

const deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notice = await Notice.findByIdAndDelete(id);
    if (!notice) {
      return res.status(404).json(errorResponse('公告不存在'));
    }
    
    res.json(successResponse({}));
  } catch (error) {
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const updateNoticeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const notice = await Notice.findByIdAndUpdate(
      id, 
      { isActive: status }, 
      { new: true }
    );
    if (!notice) {
      return res.status(404).json(errorResponse('公告不存在'));
    }
    
    res.json(successResponse({}));
  } catch (error) {
    console.error('updateNoticeStatus error:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const getExamTypes = async (req, res) => {
  try {
    const { keyword, page = 1, size = 20 } = req.query;
    const query = {};
    
    if (keyword) {
      query.name = { $regex: keyword };
    }
    
    const skip = (page - 1) * size;
    const examTypes = await ExamType.find({
      ...query,
      skip: parseInt(skip),
      limit: parseInt(size)
    });
    
    const total = await ExamType.countDocuments(query);
    
    const examTypeList = examTypes.map(examType => ({
      id: examType._id.toString(),
      name: examType.name,
      description: examType.description,
      color: examType.color,
      status: examType.status,
      createTime: examType.createdAt
    }));
    
    res.json(successResponse({ list: examTypeList, total }));
  } catch (error) {
    res.status(500).json(errorResponse('服务器错误'));
  }
};


const createExamType = async (req, res) => {
  try {
    const { name, description, color } = req.body;
    
    const examType = await ExamType.create({
      name,
      description,
      color,
    });
    
    res.json(successResponse({ id: examType._id }));
  } catch (error) {
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const updateExamType = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const examType = await ExamType.findByIdAndUpdate(id, updates, { new: true });
    if (!examType) {
      return res.status(404).json(errorResponse('考试类型不存在'));
    }
    
    res.json(successResponse({}));
  } catch (error) {
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const deleteExamType = async (req, res) => {
  try {
    const { id } = req.params;
    
    const examType = await ExamType.findByIdAndDelete(id);
    if (!examType) {
      return res.status(404).json(errorResponse('考试类型不存在'));
    }
    
    res.json(successResponse({}));
  } catch (error) {
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const getSubjects = async (req, res) => {
  try {
    const { keyword, examTypeId, status, page = 1, size = 20 } = req.query;
    const query = {};
    
    if (keyword) {
      query.name = { $regex: keyword };
    }
    
    if (examTypeId) {
      query.examTypeId = examTypeId;
    }
    
    if (status !== undefined) {
      query.status = parseInt(status);
    }
    
    const skip = (page - 1) * size;
    const subjects = await Subject.find({
      ...query,
      skip: parseInt(skip),
      limit: parseInt(size)
    });
    
    const total = await Subject.countDocuments(query);
    
    const subjectList = subjects.map(subject => ({
      id: subject._id.toString(),
      name: subject.name,
      description: subject.description,
      examTypeId: subject.examTypeId?._id?.toString() || subject.examTypeId?.toString(),
      examTypeName: subject.examTypeId?.name,
      color: subject.color,
      status: subject.status,
      createTime: subject.createdAt
    }));
    
    res.json(successResponse({ list: subjectList, total }));
  } catch (error) {
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const createSubject = async (req, res) => {
  try {
    const { name, description, examTypeId, color, status } = req.body;
    
    console.log('创建科目 - 收到的数据:', { name, description, examTypeId, color, status });
    
    if (!name) {
      console.error('创建科目失败: name 为空');
      return res.status(400).json(errorResponse('科目名称不能为空'));
    }
    
    if (!examTypeId) {
      console.error('创建科目失败: examTypeId 为空');
      return res.status(400).json(errorResponse('考试类型ID不能为空'));
    }
    
    const subject = await Subject.create({
      name,
      description,
      examTypeId,
      color,
      status: status !== undefined ? status : 1,
    });
    
    console.log('创建科目成功:', subject._id);
    res.json(successResponse({ id: subject._id }));
  } catch (error) {
    console.error('创建科目失败 - 详细错误:', error.message);
    console.error('错误堆栈:', error.stack);
    res.status(500).json(errorResponse('服务器错误: ' + error.message));
  }
};

const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const subject = await Subject.findByIdAndUpdate(id, updates, { new: true });
    if (!subject) {
      return res.status(404).json(errorResponse('科目不存在'));
    }
    
    res.json(successResponse({}));
  } catch (error) {
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    
    const subject = await Subject.findByIdAndDelete(id);
    if (!subject) {
      return res.status(404).json(errorResponse('科目不存在'));
    }
    
    res.json(successResponse({}));
  } catch (error) {
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const getChapters = async (req, res) => {
  try {
    const { keyword, subjectId, status, page = 1, size = 20 } = req.query;
    const query = {};
    
    if (keyword) {
      query.title = { $regex: keyword };
    }
    
    if (subjectId) {
      query.subjectId = subjectId;
    }
    
    if (status !== undefined) {
      query.status = parseInt(status);
    }
    
    const skip = (page - 1) * size;
    const chapters = await Chapter.find({
      ...query,
      skip: parseInt(skip),
      limit: parseInt(size)
    });
    
    const total = await Chapter.countDocuments(query);
    
    res.json(successResponse({ list: chapters, total }));
  } catch (error) {
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const createChapter = async (req, res) => {
  try {
    const { title, subjectId, sort, status } = req.body;
    
    const chapter = await Chapter.create({
      title,
      subjectId,
      sort: sort || 0,
      status: status !== undefined ? status : 1,
    });
    
    res.json(successResponse({ id: chapter._id }));
  } catch (error) {
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const updateChapter = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const chapter = await Chapter.findByIdAndUpdate(id, updates, { new: true });
    if (!chapter) {
      return res.status(404).json(errorResponse('章节不存在'));
    }
    
    res.json(successResponse({}));
  } catch (error) {
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const deleteChapter = async (req, res) => {
  try {
    const { id } = req.params;
    
    const chapter = await Chapter.findByIdAndDelete(id);
    if (!chapter) {
      return res.status(404).json(errorResponse('章节不存在'));
    }
    
    res.json(successResponse({}));
  } catch (error) {
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const parseArticleLink = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json(errorResponse('链接不能为空'));
    }

    if (!url.includes('mp.weixin.qq.com')) {
      return res.status(400).json(errorResponse('目前仅支持微信公众号文章解析'));
    }

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
      }
    });

    const html = response.data;
    // 使用正则获取标题
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i) || 
                       html.match(/var msg_title = '([^']+)';/i) ||
                       html.match(/<title>([^<]+)<\/title>/i);
    
    let title = titleMatch ? titleMatch[1] : '';
    
    // 清洗标题
    if (title) {
      title = title.replace(/&amp;/g, '&')
                   .replace(/&quot;/g, '"')
                   .replace(/&lt;/g, '<')
                   .replace(/&gt;/g, '>')
                   .replace(/&#39;/g, "'")
                   .trim();
    }

    // 获取封面图
    const coverMatch = html.match(/<meta property="og:image" content="([^"]+)"/i) ||
                       html.match(/var msg_cdn_url = "([^"]+)";/i);
    const coverImage = coverMatch ? coverMatch[1] : '';

    // 获取作者
    const authorMatch = html.match(/<meta property="og:article:author" content="([^"]+)"/i) ||
                        html.match(/var nickname = "([^"]+)";/i) ||
                        html.match(/<a[^>]*id="js_name"[^>]*>([^<]+)<\/a>/i);
    const author = authorMatch ? authorMatch[1].trim() : '';

    res.json(successResponse({ title, coverImage, author, url }));
  } catch (error) {
    console.error('解析链接失败:', error);
    res.status(500).json(errorResponse('解析链接失败'));
  }
};

const getStats = async (req, res) => {
  try {
    const pool = require('../config/mysql');
    
    // 获取总用户数
    const [userCountResult] = await pool.query('SELECT COUNT(*) as count FROM users');
    const totalUsers = userCountResult[0].count;
    
    // 获取今日活跃用户数（根据最后登录时间）
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [activeTodayResult] = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE lastLoginDate >= ?',
      [today]
    );
    const activeToday = activeTodayResult[0].count;
    
    // 获取视频课程总数
    const [videoCountResult] = await pool.query('SELECT COUNT(*) as count FROM video_resources');
    const totalVideos = videoCountResult[0].count;
    
    // 获取待处理纠错数（检查纠错表是否存在）
    let pendingFeedbacks = 0;
    try {
      const [feedbackResult] = await pool.query(`
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_schema = DATABASE() AND table_name = 'feedbacks'
      `);
      if (feedbackResult[0].count > 0) {
        const [pendingResult] = await pool.query(
          "SELECT COUNT(*) as count FROM feedbacks WHERE status = 'pending'"
        );
        pendingFeedbacks = pendingResult[0].count;
      }
    } catch (e) {
      console.log('纠错表不存在或查询失败');
    }
    
    // 获取最近活动（从用户登录记录或兑换记录中获取）
    let recentActivities = [];
    try {
      // 获取最近的用户兑换记录
      const [redeemRecords] = await pool.query(`
        SELECT uv.*, u.username, vr.title as video_title
        FROM user_videos uv
        LEFT JOIN users u ON uv.user_id = u.id
        LEFT JOIN video_resources vr ON uv.resource_id = vr.id
        ORDER BY uv.created_at DESC
        LIMIT 5
      `);
      
      recentActivities = redeemRecords.map(record => ({
        id: record.id,
        user: record.username || '未知用户',
        action: record.video_title ? `兑换了视频: ${record.video_title}` : '兑换了课程',
        status: 'success',
        time: record.created_at
      }));
      
      // 如果没有兑换记录，获取最近登录的用户
      if (recentActivities.length === 0) {
        const [recentUsers] = await pool.query(`
          SELECT id, username, lastLoginDate
          FROM users
          WHERE lastLoginDate IS NOT NULL
          ORDER BY lastLoginDate DESC
          LIMIT 5
        `);
        
        recentActivities = recentUsers.map(user => ({
          id: user.id,
          user: user.username,
          action: '登录了系统',
          status: 'success',
          time: user.lastLoginDate
        }));
      }
    } catch (e) {
      console.log('获取最近活动失败:', e.message);
    }

    res.json(successResponse({
      totalUsers,
      activeToday,
      totalVideos,
      pendingFeedbacks,
      recentActivities
    }));
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json(errorResponse('服务器错误: ' + error.message));
  }
};

module.exports = {
  getStats,
  getUsers,
  createUser,
  updateUser,
  updateUserStatus,
  getUserStats,
  getUserRedeemedVideos,
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getExams,
  createExam,
  updateExam,
  deleteExam,
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  updateBannerStatus,
  getNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice,
  updateNoticeStatus,
  getExamTypes,
  createExamType,
  updateExamType,
  deleteExamType,
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getChapters,
  createChapter,
  updateChapter,
  deleteChapter,
  parseArticleLink
};
