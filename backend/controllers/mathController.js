const mysqlPool = require('../config/mysql');
const { successResponse, errorResponse } = require('../utils/response');
const crypto = require('crypto');

const getSubjects = async (req, res) => {
  try {
    const [subjects] = await mysqlPool.query('SELECT SubjectID as id, SubjectName as name, exam_type_id as examTypeId, SubjectID, SubjectName, exam_type_id FROM math_subjects ORDER BY SubjectName ASC');
    res.json(successResponse(subjects));
  } catch (error) {
    console.error('获取科目列表失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const getAllBooks = async (req, res) => {
  try {
    const [books] = await mysqlPool.query('SELECT * FROM math_books ORDER BY SortOrder ASC, BookTitle ASC');
    res.json(successResponse(books));
  } catch (error) {
    console.error('获取所有书籍失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const getBooksBySubject = async (req, res) => {
  try {
    const { subjectId, contentType } = req.query;
    
    if (!subjectId) {
      return res.status(400).json(errorResponse('科目ID不能为空'));
    }
    
    const parsedId = parseInt(subjectId);
    // 如果请求的是数一、数二、数三 (ID: 1, 2, 3)，则同时返回公共数学 (ID: 4) 的书籍
    const subjectIds = [parsedId];
    if ([1, 2, 3].includes(parsedId)) {
      subjectIds.push(4);
    }
    
    let sql = `
      SELECT DISTINCT b.* 
      FROM math_books b
      JOIN math_book_subjects mbs ON b.BookID = mbs.BookID
      WHERE mbs.SubjectID IN (?)
    `;
    const params = [subjectIds];

    if (contentType) {
      if (contentType === 'practice') {
        // 练习模块显示模拟卷和真题卷
        sql += ' AND b.ContentType IN ("mock_paper", "real_paper")';
      } else {
        sql += ' AND b.ContentType = ?';
        params.push(contentType);
      }
    }

    sql += ' ORDER BY b.VersionInfo DESC, b.SortOrder ASC, b.BookTitle ASC';
    
    const [books] = await mysqlPool.query(sql, params);
    
    res.json(successResponse(books));
  } catch (error) {
    console.error('获取书籍列表失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const getBookDetails = async (req, res) => {
  try {
    const { bookId } = req.params;
    const queryBookId = req.query.book_id;
    
    const finalBookId = bookId || queryBookId;
    
    if (!finalBookId) {
      return res.status(400).json(errorResponse('书籍ID不能为空'));
    }
    
    const [books] = await mysqlPool.query('SELECT * FROM math_books WHERE BookID = ?', [parseInt(finalBookId)]);
    const book = books[0];
    
    if (!book) {
      return res.status(404).json(errorResponse('书籍不存在'));
    }
    
    const [bookQuestions] = await mysqlPool.query(
      'SELECT * FROM math_bookquestions WHERE BookID = ? ORDER BY Sort ASC',
      [parseInt(finalBookId)]
    );
    
    res.json(successResponse({
      ...book,
      questions: bookQuestions
    }));
  } catch (error) {
    console.error('获取书籍详情失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const incrementLearnerCount = async (req, res) => {
  try {
    const { bookId } = req.params;
    if (!bookId) {
      return res.status(400).json(errorResponse('书籍ID不能为空'));
    }

    await mysqlPool.query(
      'UPDATE math_books SET LearnerCount = COALESCE(LearnerCount, 0) + 1 WHERE BookID = ?',
      [parseInt(bookId)]
    );

    res.json(successResponse({ message: '学习人数已更新' }));
  } catch (error) {
    console.error('更新学习人数失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const getBookPreview = async (req, res) => {
  try {
    const { bookId } = req.params;
    const queryBookId = req.query.book_id;
    
    const finalBookId = bookId || queryBookId;
    
    if (!finalBookId) {
      return res.status(400).json(errorResponse('书籍ID不能为空'));
    }
    
    const [books] = await mysqlPool.query('SELECT * FROM math_books WHERE BookID = ?', [parseInt(finalBookId)]);
    const book = books[0];
    
    if (!book) {
      return res.status(404).json(errorResponse('书籍不存在'));
    }
    
    const [bookQuestions] = await mysqlPool.query(
      'SELECT * FROM math_bookquestions WHERE BookID = ? ORDER BY Sort ASC',
      [parseInt(finalBookId)]
    );
    
    const questionIds = bookQuestions.map(bq => bq.QuestionID);
    
    if (questionIds.length === 0) {
      return res.json(successResponse({
        ...book,
        questions: []
      }));
    }

    const [questions] = await mysqlPool.query(
      'SELECT * FROM math_questions WHERE QuestionID IN (?)',
      [questionIds]
    );
    
    const questionsDict = {};
    questions.forEach(q => {
      questionsDict[q.QuestionID] = q;
    });
    
    const formattedQuestions = bookQuestions.map(bq => ({
      ...bq,
      QuestionText: questionsDict[bq.QuestionID]?.QuestionText || ''
    }));
    
    res.json(successResponse({
      ...book,
      questions: formattedQuestions
    }));
  } catch (error) {
    console.error('获取书籍预览失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const getFullQuestionsByBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    
    if (!bookId) {
      return res.status(400).json(errorResponse('书籍ID不能为空'));
    }
    
    const [bookQuestions] = await mysqlPool.query(
      'SELECT * FROM math_bookquestions WHERE BookID = ? ORDER BY Sort ASC',
      [parseInt(bookId)]
    );
    
    const questionIds = bookQuestions.map(bq => bq.QuestionID);
    
    const allQuestionsData = {};
    
    for (const questionId of questionIds) {
      const [questions] = await mysqlPool.query('SELECT * FROM math_questions WHERE QuestionID = ?', [questionId]);
      const [questionDetails] = await mysqlPool.query('SELECT * FROM math_questiondetails WHERE QuestionID = ?', [questionId]);
      const [relatedQuestions] = await mysqlPool.query(
        `SELECT r.*, q.QuestionText, q.QuestionImg, q.QuestionType, q.Difficulty, q.OriginalAnswerText
         FROM math_relatedquestions r
         JOIN math_questions q ON r.RelatedQuestionID = q.QuestionID
         WHERE r.SourceQuestionID = ?`,
        [questionId]
      );
      
      allQuestionsData[questionId] = {
        first_request: questions,
        second_request: questionDetails,
        third_request: relatedQuestions
      };
    }
    
    res.json(successResponse(allQuestionsData));
  } catch (error) {
    console.error('获取书籍完整题目数据失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const getQuestionDetails = async (req, res) => {
  try {
    const { questionId } = req.params;
    const globalQuestionId = req.query.global_question_id;
    const bookId = req.query.book_id;
    
    const finalQuestionId = questionId || globalQuestionId;
    
    if (!finalQuestionId) {
      return res.status(400).json(errorResponse('题目ID不能为空'));
    }
    
    const [questions] = await mysqlPool.query('SELECT * FROM math_questions WHERE QuestionID = ?', [parseInt(finalQuestionId)]);
    const question = questions[0];
    
    if (!question) {
      return res.status(404).json(errorResponse('题目不存在'));
    }
    
    const [questionDetails] = await mysqlPool.query('SELECT * FROM math_questiondetails WHERE QuestionID = ?', [parseInt(finalQuestionId)]);
    const [relatedQuestions] = await mysqlPool.query(
      `SELECT r.*, q.QuestionText, q.QuestionImg, q.QuestionType, q.Difficulty, q.OriginalAnswerText
       FROM math_relatedquestions r
       JOIN math_questions q ON r.RelatedQuestionID = q.QuestionID
       WHERE r.SourceQuestionID = ?`,
      [parseInt(finalQuestionId)]
    );
    
    let bookQuestion = null;
    let currentBookTitle = null;
    
    if (bookId) {
      const [bookQuestions] = await mysqlPool.query(
        'SELECT * FROM math_bookquestions WHERE BookID = ? AND QuestionID = ?',
        [parseInt(bookId), parseInt(finalQuestionId)]
      );
      bookQuestion = bookQuestions[0];
      
      const [books] = await mysqlPool.query('SELECT BookTitle FROM math_books WHERE BookID = ?', [parseInt(bookId)]);
      currentBookTitle = books[0]?.BookTitle || null;
    }
    
    const knowledgePointIds = questionDetails
      .map(qd => qd.LinkedKnowledgePointID)
      .filter(id => id !== null);
    
    let knowledgePoints = [];
    if (knowledgePointIds.length > 0) {
      const [kps] = await mysqlPool.query(
        'SELECT * FROM math_knowledgepoints WHERE KnowledgePointID IN (?)',
        [knowledgePointIds]
      );
      knowledgePoints = kps;
    }
    
    const responseData = {
      [finalQuestionId]: {
        first_request: [{
          ...question,
          CurrentBrowsingBookID: bookId ? parseInt(bookId) : null,
          CurrentBookTitle: currentBookTitle,
          CurrentBookQuestionPage: bookQuestion?.QuestionPage || null,
          CurrentBookQuestionSort: bookQuestion?.QuestionSort || null
        }],
        second_request: questionDetails.map(detail => ({
          ...detail,
          _question_code: detail.LinkedKnowledgePointID ? knowledgePoints.find(kp => kp.KnowledgePointID === parseInt(detail.LinkedKnowledgePointID)) : null
        })),
        third_request: relatedQuestions
      }
    };
    
    res.json(successResponse(responseData));
  } catch (error) {
    console.error('获取题目详情失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const getBatchQuestionDetails = async (req, res) => {
  try {
    const { questionIds } = req.query;
    
    if (!questionIds) {
      return res.status(400).json(errorResponse('题目IDs不能为空'));
    }
    
    const ids = questionIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    
    if (ids.length === 0) {
      return res.status(400).json(errorResponse('无效的题目IDs'));
    }
    
    const allQuestionsData = {};
    
    // 批量查询基础题目信息
    const [questions] = await mysqlPool.query('SELECT * FROM math_questions WHERE QuestionID IN (?)', [ids]);
    const [questionDetails] = await mysqlPool.query('SELECT * FROM math_questiondetails WHERE QuestionID IN (?)', [ids]);
    const [relatedQuestions] = await mysqlPool.query(
      `SELECT r.*, q.QuestionText, q.QuestionImg, q.QuestionType, q.Difficulty, q.OriginalAnswerText
       FROM math_relatedquestions r
       JOIN math_questions q ON r.RelatedQuestionID = q.QuestionID
       WHERE r.SourceQuestionID IN (?)`,
      [ids]
    );
    
    // 知识点 ID 收集
    const knowledgePointIds = questionDetails
      .map(qd => qd.LinkedKnowledgePointID)
      .filter(id => id !== null);
    
    let knowledgePoints = [];
    if (knowledgePointIds.length > 0) {
      const [kps] = await mysqlPool.query(
        'SELECT * FROM math_knowledgepoints WHERE KnowledgePointID IN (?)',
        [knowledgePointIds]
      );
      knowledgePoints = kps;
    }

    // 组装数据
    for (const id of ids) {
      const q = questions.find(item => item.QuestionID === id);
      if (!q) continue;

      const details = questionDetails.filter(item => item.QuestionID === id);
      const related = relatedQuestions.filter(item => item.SourceQuestionID === id);

      allQuestionsData[id] = {
        first_request: [q],
        second_request: details.map(detail => ({
          ...detail,
          _question_code: detail.LinkedKnowledgePointID ? knowledgePoints.find(kp => kp.KnowledgePointID === parseInt(detail.LinkedKnowledgePointID)) : null
        })),
        third_request: related
      };
    }
    
    res.json(successResponse(allQuestionsData));
  } catch (error) {
    console.error('批量获取题目详情失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const getQuestionsBatch = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json(errorResponse('IDs 不能为空且必须是数组'));
    }

    if (ids.length === 0) {
      return res.json(successResponse([]));
    }

    // 转换为数字
    const numericIds = ids.map(id => parseInt(id)).filter(id => !isNaN(id));

    if (numericIds.length === 0) {
      return res.json(successResponse([]));
    }

    const [questions] = await mysqlPool.query(`
      SELECT q.QuestionID, q.QuestionText, q.QuestionType, q.OriginalAnswerText, q.LinkNames, q.Difficulty,
             ANY_VALUE(bq.QuestionImg) as QuestionImg, ANY_VALUE(bq.BookChapter) as BookChapter, ANY_VALUE(b.BookTitle) as BookTitle
      FROM math_questions q
      LEFT JOIN math_bookquestions bq ON q.QuestionID = bq.QuestionID
      LEFT JOIN math_books b ON bq.BookID = b.BookID
      WHERE q.QuestionID IN (?)
      GROUP BY q.QuestionID
    `, [numericIds]);

    res.json(successResponse(questions));
  } catch (error) {
    console.error('批量获取题目失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const generateSmartPaper = async (req, res) => {
  const connection = await mysqlPool.getConnection();
  try {
    await connection.beginTransaction();
    const { subjectId, scope, counts, title, mode, manualQuestions: manualInputQuestions } = req.body;
    const userId = req.userId;

    let selectedQuestions = [];
    const selectedIds = new Set();
    const usedKP = new Set();

    if (mode === 'manual' && manualInputQuestions && manualInputQuestions.length > 0) {
      // 手动组卷模式
      const questionIds = manualInputQuestions.map(q => q.id);
      
      // 批量查询题目详情
      const [questions] = await connection.query(
        `SELECT q.QuestionID, q.QuestionType, q.Difficulty, bq.BookID, bq.BookChapter
         FROM math_questions q
         LEFT JOIN math_bookquestions bq ON q.QuestionID = bq.QuestionID
         WHERE q.QuestionID IN (?)`,
        [questionIds]
      );

      // 映射回输入顺序并去重（一个题目可能在多本书中，取第一个）
      const questionMap = {};
      questions.forEach(q => {
        if (!questionMap[q.QuestionID]) {
          questionMap[q.QuestionID] = q;
        }
      });

      selectedQuestions = manualInputQuestions.map(mq => {
        const q = questionMap[mq.id];
        return {
          ...q,
          QuestionID: mq.id,
          paperType: q ? q.QuestionType : '未知',
          BookID: mq.bookId || (q ? q.BookID : 0),
          BookChapter: mq.bookChapter || (q ? q.BookChapter : '手动添加')
        };
      });
    } else {
      // 智能组卷模式
      if (!scope || scope.length === 0) {
        return res.status(400).json(errorResponse('请选择组卷范围'));
      }

      // 辅助函数：从特定池子中选择指定数量的题目
      const selectFromPool = (pool, targetCounts, forceCount = false) => {
        const typeMap = {
          '选择题': targetCounts.choice || 0,
          '填空题': targetCounts.fill || 0,
          '解答题': targetCounts.analysis || 0
        };

        for (const [type, count] of Object.entries(typeMap)) {
          if (count <= 0 && !forceCount) continue;
          
          let typePool = pool.filter(q => (q.QuestionType || '解答题') === type && !selectedIds.has(q.QuestionID));
          if (typePool.length === 0) continue;

          // 排序：收藏数 > 知识点数 > 难度均衡 > 随机微调
          typePool.sort((a, b) => {
            const scoreA = (a.FavoriteCount * 10) + (a.LinksCount * 5) + (a.Difficulty * 2);
            const scoreB = (b.FavoriteCount * 10) + (b.LinksCount * 5) + (b.Difficulty * 2);
            if (scoreB !== scoreA) return scoreB - scoreA;
            return Math.random() - 0.5;
          });

          let typeSelected = 0;
          const targetCount = count;

          for (const q of typePool) {
            if (typeSelected >= targetCount) break;
            
            const kps = (q.LinkNames || '').split(',').filter(k => k.trim());
            const hasDuplicateKP = kps.some(kp => usedKP.has(kp.trim()));

            if (!hasDuplicateKP || typePool.length < targetCount * 1.5) {
              selectedQuestions.push({ ...q, paperType: type });
              selectedIds.add(q.QuestionID);
              kps.forEach(kp => usedKP.add(kp.trim()));
              typeSelected++;
            }
          }

          // 如果还没选够，补齐
          if (typeSelected < targetCount) {
            const remaining = typePool.filter(q => !selectedIds.has(q.QuestionID));
            for (const q of remaining) {
              if (typeSelected >= targetCount) break;
              selectedQuestions.push({ ...q, paperType: type });
              selectedIds.add(q.QuestionID);
              typeSelected++;
            }
          }
        }
      };

      // 1. 统计并优先处理每个范围项的自定义题量 (书籍级或章节级)
      const customTotals = { choice: 0, fill: 0, analysis: 0 };
      let allPoolQuestions = []; 
      
      for (const item of scope) {
        const { bookId, chapters, counts: itemCounts } = item;
        
        let query = `SELECT bq.QuestionID, bq.BookID, bq.BookChapter, bq.ChapterName, q.QuestionType, q.LinkNames, q.LinksCount, q.Difficulty,
                  (SELECT COUNT(*) FROM math_favorites f WHERE f.QuestionID = q.QuestionID) as FavoriteCount,
                  b.BookTitle
           FROM math_bookquestions bq
           JOIN math_questions q ON bq.QuestionID = q.QuestionID
           JOIN math_books b ON bq.BookID = b.BookID
           WHERE bq.BookID = ?`;
        
        const [bookQuestions] = await connection.query(query, [bookId]);
        allPoolQuestions = allPoolQuestions.concat(bookQuestions);

        if (chapters && chapters.length > 0) {
          for (const chap of chapters) {
            if (chap.counts) {
              customTotals.choice += (chap.counts.choice || 0);
              customTotals.fill += (chap.counts.fill || 0);
              customTotals.analysis += (chap.counts.analysis || 0);
              
              const chapPool = bookQuestions.filter(q => q.BookChapter === chap.name);
              selectFromPool(chapPool, chap.counts);
            }
          }
        } else if (itemCounts) {
          customTotals.choice += (itemCounts.choice || 0);
          customTotals.fill += (itemCounts.fill || 0);
          customTotals.analysis += (itemCounts.analysis || 0);
          selectFromPool(bookQuestions, itemCounts);
        }
      }

      // 2. 处理全局补充题量 (全局题量 counts 是目标总数，减去已通过自定义方式选出的题量)
      const remainingCounts = {
        choice: Math.max(0, (counts.choice || 0) - customTotals.choice),
        fill: Math.max(0, (counts.fill || 0) - customTotals.fill),
        analysis: Math.max(0, (counts.analysis || 0) - customTotals.analysis)
      };

      if (remainingCounts.choice > 0 || remainingCounts.fill > 0 || remainingCounts.analysis > 0) {
        // 从选定范围的联合池中抽取剩余题目
        selectFromPool(allPoolQuestions, remainingCounts);
      }

      // 如果总共一道题都没选出来，且全局也没设，尝试保底逻辑
      if (selectedQuestions.length === 0) {
        selectFromPool(allPoolQuestions, { choice: 10, fill: 6, analysis: 6 });
      }
    }

    // 计算试卷平均难度
    const totalDifficulty = selectedQuestions.reduce((sum, q) => sum + (Number(q.Difficulty) || 0.5), 0);
    const avgDifficulty = selectedQuestions.length > 0 ? totalDifficulty / selectedQuestions.length : 0.5;

    // 4. 保存试卷主表
    const printToken = crypto.randomBytes(24).toString('hex');
    const [paperResult] = await connection.query(
      'INSERT INTO math_generated_papers (UserID, Title, SubjectID, Config, AverageDifficulty, PrintToken) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, title || '智能组卷', subjectId, JSON.stringify({ scope, counts }), avgDifficulty, printToken]
    );
    const paperId = paperResult.insertId;

    // 5. 保存题目关联表
    // 按照 题型(选择->填空->解答) -> 章节 的顺序重新排序题目
    const typeOrder = { '选择题': 1, '填空题': 2, '解答题': 3 };
    selectedQuestions.sort((a, b) => {
      const typeDiff = (typeOrder[a.paperType] || 99) - (typeOrder[b.paperType] || 99);
      if (typeDiff !== 0) return typeDiff;
      return 0;
    });

    const values = selectedQuestions.map((q, index) => [
      paperId, q.QuestionID, q.BookID, q.BookChapter, index + 1
    ]);

    if (values.length > 0) {
      await connection.query(
        'INSERT INTO math_generated_paper_questions (PaperID, QuestionID, BookID, BookChapter, SortOrder) VALUES ?',
        [values]
      );
    }

    await new Promise(resolve => setTimeout(resolve, 1500));
    await connection.commit();
    res.json(successResponse({ paperId, questionCount: selectedQuestions.length }));
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('智能组卷失败:', error);
    res.status(500).json(errorResponse('组卷失败: ' + error.message));
  } finally {
    if (connection) connection.release();
  }
};

const getGeneratedPaper = async (req, res) => {
  try {
    const { paperId } = req.params;
    const userId = req.userId;
    const [papers] = await mysqlPool.query('SELECT PaperID, PrintToken, UserID, Title, SubjectID, Config, AverageDifficulty, CreatedAt FROM math_generated_papers WHERE PaperID = ? AND UserID = ?', [paperId, userId]);
    if (papers.length === 0) return res.status(404).json(errorResponse('试卷不存在或无权查看'));

    const paper = papers[0];
    const [questions] = await mysqlPool.query(
      `SELECT gpq.SortOrder, q.QuestionID, q.QuestionText, q.QuestionType, q.OriginalAnswerText, q.LinkNames, q.Difficulty,
              bq.QuestionImg, bq.BookChapter, bq.ChapterName, b.BookTitle
       FROM math_generated_paper_questions gpq
       JOIN math_questions q ON gpq.QuestionID = q.QuestionID
       JOIN math_bookquestions bq ON gpq.QuestionID = bq.QuestionID AND gpq.BookID = bq.BookID AND gpq.BookChapter = bq.BookChapter
       JOIN math_books b ON gpq.BookID = b.BookID
       WHERE gpq.PaperID = ?
       ORDER BY 
         CASE q.QuestionType 
           WHEN '选择题' THEN 1 
           WHEN '填空题' THEN 2 
           WHEN '解答题' THEN 3 
           ELSE 4 
         END ASC, 
         gpq.SortOrder ASC`,
      [paperId]
    );

    // 为每个题目获取详细解析
    for (let q of questions) {
      const [details] = await mysqlPool.query(
        'SELECT * FROM math_questiondetails WHERE QuestionID = ? ORDER BY ID ASC',
        [q.QuestionID]
      );
      
      // 如果 OriginalAnswerText 为空，尝试从 details 中合并题目详解
      if (!q.OriginalAnswerText || q.OriginalAnswerText.trim() === '') {
        const analysisDetail = details.find(d => (d.Title || '').includes('题目详解') || (d.BusType || '').includes('详解') || (d.BusType || '').includes('分析'));
        if (analysisDetail) {
          q.OriginalAnswerText = analysisDetail.Context;
        } else if (details.length > 0) {
          // 如果没有显式的“详解”，则合并所有 Context 有内容的 detail
          q.OriginalAnswerText = details
            .filter(d => d.Context && d.Context.trim())
            .map(d => (d.Title ? `### ${d.Title}\n` : '') + d.Context)
            .join('\n\n');
        }
      }
      q.details = details;
    }

    res.json(successResponse({
      ...paper,
      questions
    }));
  } catch (error) {
    console.error('获取试卷详情失败:', error);
    res.status(500).json(errorResponse('获取试卷详情失败'));
  }
};

const getPrintPaper = async (req, res) => {
  try {
    const { paperId } = req.params; // 这里虽然叫 paperId，但我们允许它是 ID 或 Token
    
    // 只允许通过 PrintToken 访问，以增强安全性，防止通过 ID 猜测链接
    // PrintToken 是在生成试卷时产生的随机字符串
    const [papers] = await mysqlPool.query('SELECT * FROM math_generated_papers WHERE PrintToken = ?', [paperId]);
    
    if (papers.length === 0) {
      // 如果按 Token 没找到，且 paperId 是数字，尝试按 ID 查找（仅用于兼容极旧的数据，或可以在此处增加鉴权）
      // 但为了安全性，建议引导用户使用包含 Token 的新链接
      return res.status(404).send('试卷不存在或链接已失效');
    }
    paper = papers[0];

    const [questions] = await mysqlPool.query(
      `SELECT gpq.SortOrder, q.*, bq.BookChapter, b.BookTitle
       FROM math_generated_paper_questions gpq
       JOIN math_questions q ON gpq.QuestionID = q.QuestionID
       LEFT JOIN math_bookquestions bq ON gpq.QuestionID = bq.QuestionID AND gpq.BookID = bq.BookID AND gpq.BookChapter = bq.BookChapter
       LEFT JOIN math_books b ON gpq.BookID = b.BookID
       WHERE gpq.PaperID = ?
       ORDER BY 
         CASE q.QuestionType 
           WHEN '选择题' THEN 1 
           WHEN '填空题' THEN 2 
           WHEN '解答题' THEN 3 
           ELSE 4 
         END ASC, 
         gpq.SortOrder ASC`,
      [paper.PaperID]
    );

    let html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>__PAPER_TITLE_PLAIN__</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/contrib/auto-render.min.js"></script>
    <style>
        :root {
            --primary-color: #5DADE2;
            --page-width: 210mm;
            --page-height: 297mm;
            --page-margin-top: 15mm;
            --page-margin-bottom: 15mm;
            --page-margin-sides: 20mm;
            --q-label-fontsize: 11pt;
            --q-content-fontsize: 11pt;
            --q-spacing-between: 8mm;
        }

        body {
            font-family: "Times New Roman", Times, serif, "SimSun", "STSong", serif;
            line-height: 1.6;
            color: #333;
            background: #f0f2f5;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
        }

        @media print {
            .no-print, .page-controls { display: none !important; }
            body { background: white !important; }
            .printable-page { 
                margin: 0 !important; 
                box-shadow: none !important; 
                border: none !important; 
                page-break-after: always; 
                width: var(--page-width) !important;
                height: var(--page-height) !important;
            }
            .printable-page:last-child { page-break-after: auto; }
            @page { 
                size: var(--page-width) var(--page-height); 
                margin: 0; 
            }
        }

        .print-controls {
            display: flex;
            align-items: center;
            padding: 10px 20px;
            background: white;
            border-bottom: 1px solid #ddd;
            position: sticky;
            top: 0;
            z-index: 1000;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        .print-controls button {
            padding: 8px 15px;
            margin-right: 10px;
            border-radius: 4px;
            border: 1px solid #ccc;
            background: #f8f9fa;
            cursor: pointer;
            font-size: 14px;
        }

        .print-controls button.primary {
            background: var(--primary-color);
            color: white;
            border-color: var(--primary-color);
        }

        .printable-page {
            background: white;
            width: var(--page-width);
            height: var(--page-height);
            margin: 20px auto;
            padding: var(--page-margin-top) var(--page-margin-sides) var(--page-margin-bottom);
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            box-sizing: border-box;
            position: relative;
            overflow: hidden;
        }

        .section-header {
            font-size: 1.2em;
            font-weight: bold;
            margin: 10px 0 15px 0;
            border-bottom: 1px solid #333;
            padding-bottom: 5px;
        }

        .paper-header {
            text-align: center;
            margin-bottom: 15mm;
            padding-bottom: 5mm;
            border-bottom: 1px solid #e0e0e0;
        }

        .header-logo-row {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-bottom: 3mm;
        }

        .header-logo {
            width: 24px;
            height: 24px;
            object-fit: contain;
        }

        .header-brand {
            font-weight: bold;
            color: #333;
        }

        .paper-title {
            font-size: 1.2em;
            margin: 0 0 3mm 0;
            font-weight: bold;
        }

        .paper-info {
            font-size: 0.85em;
            color: #888;
        }

        .question-item {
            margin-bottom: var(--q-spacing-between);
            page-break-inside: avoid;
        }

        .question-header {
            font-weight: bold;
            font-size: var(--q-label-fontsize);
            margin-bottom: 2mm;
            display: flex;
            align-items: center;
        }

        .question-id, .question-source {
            font-weight: normal;
            font-size: 0.8em;
            color: #999;
            margin-left: 10px;
        }

        .question-body {
            font-size: var(--q-content-fontsize);
            white-space: normal;
            word-wrap: break-word;
            line-height: 1.6;
        }

        .question-body p { margin: 0.5em 0; }
        .question-body br { content: ""; display: block; margin: 0.3em 0; }

        /* KaTeX 优化样式 */
        .katex-display {
            display: block !important;
            text-align: left !important;
            margin: 0.5em 0 !important;
            overflow-x: auto;
            max-width: 100%;
        }
        .katex { font-size: 1.1em !important; }
        .math-display-scrollable {
            display: block;
            overflow-x: auto;
            overflow-y: hidden;
            max-width: 100%;
        }

        .question-footer {
            font-size: 0.8em;
            color: #888;
            margin-top: 2mm;
            text-align: right;
        }

        /* Per-page controls */
        .page-controls {
            position: absolute;
            top: 2px;
            right: 2px;
            display: flex;
            gap: 5px;
            background: rgba(255,255,255,0.9);
            padding: 5px;
            border-radius: 4px;
            border: 1px solid #ddd;
            z-index: 100;
            font-size: 12px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .page-controls label { font-weight: bold; margin-right: 2px; }
        .page-controls input { width: 45px; padding: 2px; border: 1px solid #ccc; border-radius: 2px; font-size: 11px; }
        .page-controls button { padding: 2px 5px; cursor: pointer; background: #eee; border: 1px solid #ccc; border-radius: 2px; font-size: 11px; }
        .page-controls button:hover { background: #ddd; }

        /* Settings Modal */
        .settings-modal-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 2000;
            justify-content: center;
            align-items: center;
        }

        .settings-modal-overlay.active { display: flex; }

        .settings-modal-content {
            background: white;
            padding: 25px;
            border-radius: 8px;
            width: 90%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
        }

        .settings-modal-content h2 { margin-top: 0; color: var(--primary-color); }
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: bold; font-size: 14px; }
        .form-group input, .form-group select {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
        }
        .form-inline { display: flex; gap: 10px; }
        .form-inline > div { flex: 1; }
        
        .checkbox-group {
            display: flex;
            gap: 20px;
            margin-top: 10px;
        }
        .checkbox-item {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 14px;
            cursor: pointer;
        }
        .checkbox-item input {
            width: auto;
        }

        fieldset { border: 1px solid #eee; padding: 15px; border-radius: 4px; margin-bottom: 15px; }
        legend { font-weight: bold; padding: 0 10px; color: #666; }

        .modal-footer { text-align: right; margin-top: 20px; }
        .modal-footer button { padding: 8px 20px; margin-left: 10px; border-radius: 4px; border: 1px solid #ccc; cursor: pointer; }
        .modal-footer button.primary { background: var(--primary-color); color: white; border-color: var(--primary-color); }

        .page-footer {
            position: absolute;
            bottom: 10mm;
            left: 0;
            right: 0;
            padding: 0 var(--page-margin-sides);
            font-size: 0.8em;
            color: #999;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
        }
        .page-footer .footer-text {
            color: #666;
        }
        .page-footer .page-number-text {
            color: #999;
        }
    </style>
</head>
<body>
    <div class="print-controls no-print">
        <button onclick="window.print()" class="primary">立即打印</button>
        <button id="openSettingsBtn">打印设置</button>
        <button onclick="window.close()">关闭页面</button>
    </div>

    <div id="pagesContainer">
        <!-- Pages will be generated here -->
    </div>

    <div class="settings-modal-overlay" id="settingsModal">
        <div class="settings-modal-content">
            <h2>打印设置</h2>
            <fieldset>
                <legend>页眉设置</legend>
                <div class="form-group">
                    <label>自定义页眉文字</label>
                    <input type="text" id="settingCustomHeader" placeholder="留空则显示默认页眉">
                </div>
                <div class="form-group">
                    <div class="form-inline">
                        <div><label>页眉字号 (pt)</label><input type="number" id="settingHeaderSize" value="10" min="8" max="24"></div>
                        <div><label>距顶部 (mm)</label><input type="number" id="settingHeaderTop" value="10" min="0" max="50"></div>
                    </div>
                </div>
                <div class="form-group">
                    <label>页眉对齐</label>
                    <select id="settingHeaderAlign">
                        <option value="center">居中</option>
                        <option value="left">左对齐</option>
                        <option value="right">右对齐</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>显示选项</label>
                    <div class="checkbox-group">
                        <label class="checkbox-item"><input type="checkbox" id="settingShowHeader" checked> 显示页眉</label>
                        <label class="checkbox-item"><input type="checkbox" id="settingShowLogo" checked> 显示Logo</label>
                        <label class="checkbox-item"><input type="checkbox" id="settingShowQuestionCount" checked> 显示题目数量</label>
                    </div>
                </div>
            </fieldset>
            <fieldset>
                <legend>页脚设置</legend>
                <div class="form-group">
                    <label>自定义页脚</label>
                    <input type="text" id="settingCustomFooter" placeholder="留空则不显示">
                </div>
                <div class="form-group">
                    <label>页脚对齐</label>
                    <select id="settingFooterAlign">
                        <option value="center">居中</option>
                        <option value="left">左对齐</option>
                        <option value="right">右对齐</option>
                    </select>
                </div>
                <div class="form-group">
                    <div class="checkbox-group">
                        <label class="checkbox-item"><input type="checkbox" id="settingShowPageNumber" checked> 显示页码</label>
                        <label class="checkbox-item"><input type="checkbox" id="settingShowFooter"> 显示页脚</label>
                    </div>
                </div>
            </fieldset>
            <fieldset>
                <legend>页面布局</legend>
                <div class="form-group">
                    <label>页面大小</label>
                    <select id="settingPageSize">
                        <option value="A4">A4 (210x297mm)</option>
                        <option value="A5">A5 (148x210mm)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>方向</label>
                    <select id="settingOrientation">
                        <option value="portrait">纵向</option>
                        <option value="landscape">横向</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>页边距 (mm)</label>
                    <div class="form-inline">
                        <div><label>上</label><input type="number" id="settingMarginTop" value="15"></div>
                        <div><label>下</label><input type="number" id="settingMarginBottom" value="15"></div>
                        <div><label>左右</label><input type="number" id="settingMarginSides" value="20"></div>
                    </div>
                </div>
            </fieldset>
            <fieldset>
                <legend>内容格式</legend>
                <div class="form-group">
                    <label>题目间距 (mm)</label>
                    <input type="number" id="settingSpacing" value="30">
                </div>
                <div class="form-group">
                    <label>字体大小 (pt)</label>
                    <div class="form-inline">
                        <div><label>标签</label><input type="number" id="settingLabelSize" value="11"></div>
                        <div><label>内容</label><input type="number" id="settingContentSize" value="11"></div>
                    </div>
                </div>
                <div class="form-group">
                    <label>显示选项</label>
                    <div class="checkbox-group">
                        <label class="checkbox-item"><input type="checkbox" id="settingShowSource" checked> 显示来源</label>
                        <label class="checkbox-item"><input type="checkbox" id="settingShowId"> 显示 ID</label>
                    </div>
                </div>
                <div class="form-group">
                    <label>每页题目数 (0表示自动分页)</label>
                    <input type="number" id="settingQuestionsPerPage" value="3">
                </div>
            </fieldset>
            <div class="modal-footer">
                <button id="cancelSettingsBtn">取消</button>
                <button id="applySettingsBtn" class="primary">应用设置</button>
            </div>
        </div>
    </div>

    <script>
        const QUESTIONS = __QUESTIONS_JSON__;
        const PAPER_TITLE = __PAPER_TITLE_JSON__;
        
        let currentSettings = {
            pageSize: 'A4',
            orientation: 'portrait',
            marginTop: 15,
            marginBottom: 15,
            marginSides: 20,
            spacing: 30,
            labelSize: 11,
            contentSize: 11,
            questionsPerPage: 3,
            showSource: true,
            showId: false,
            customHeader: '',
            headerAlign: 'center',
            headerSize: 10,
            headerTop: 10,
            showHeader: true,
            showLogo: true,
            showQuestionCount: true,
            customFooter: '',
            footerAlign: 'center',
            showPageNumber: true,
            showFooter: false,
            pageOverrides: {}
        };

        function transformText(text) {
            if (!text) return '';
            
            // 预处理：参考 PHP 模板，处理一些常见的特殊字符
            let processedText = text.trim()
                .replace(/＄/g, '$')           // 替换全角美元符号
                .replace(/\.\$png/g, '.png')    // 修正图片扩展名
                .replace(/\\r\\n/g, '\\n')       // 统一换行符
                .replace(/\\n/g, '\\n');

            // 避免在 LaTeX 公式内部进行 HTML 换行替换
            // 在 Node.js 模板字符串中，需要对反斜杠进行双重转义，以便浏览器接收到正确的 \$
            const parts = processedText.split(/(\\\$\\\$[\\s\\S]*?\\\$\\\$|\\\$[\\s\\S]*?\\\$)/g);
            
            return parts.map(part => {
                if (!part) return '';
                // 如果是公式部分 (以 $ 开头)，原样返回
                if (part.startsWith('$')) {
                    return part;
                }
                // 非公式部分进行换行和选项处理
                let content = part;
                // 处理换行符为 <br/>
                content = content.replace(/\\n/g, '<br/>');
                // 处理选择题选项 (A) (B) 等，自动换行
                content = content.replace(/([^>\\s])\\s*\\(([A-D])\\)/g, '$1<br/>($2)');
                // 修正开头多余的换行
                content = content.replace(/^<br\\/>\\(A\\)/, '(A)');
                return content;
            }).join('');
        }

        function renderMath() {
            if (typeof renderMathInElement === 'function') {
                renderMathInElement(document.getElementById('pagesContainer'), {
                    delimiters: [
                        {left: "$$", right: "$$", display: true},
                        {left: "$", right: "$", display: false},
                        {left: "\\\\(", right: "\\\\)", display: false},
                        {left: "\\\\[", right: "\\\\]", display: true}
                    ],
                    throwOnError: false,
                    trust: true,
                    strict: false
                });
            } else {
                console.warn('KaTeX not loaded yet, retrying in 200ms...');
                setTimeout(renderMath, 200);
            }
        }

        function repaginate() {
            const container = document.getElementById('pagesContainer');
            container.innerHTML = '';
            
            if (!QUESTIONS || QUESTIONS.length === 0) {
                container.innerHTML = '<div style="text-align:center;padding:50px;color:#999;">该试卷暂无题目内容</div>';
                return;
            }

            // Apply CSS variables
            const root = document.documentElement;
            const isLandscape = currentSettings.orientation === 'landscape';
            const width = currentSettings.pageSize === 'A4' ? (isLandscape ? '297mm' : '210mm') : (isLandscape ? '210mm' : '148mm');
            const height = currentSettings.pageSize === 'A4' ? (isLandscape ? '210mm' : '297mm') : (isLandscape ? '148mm' : '210mm');
            
            root.style.setProperty('--page-width', width);
            root.style.setProperty('--page-height', height);
            root.style.setProperty('--page-margin-top', currentSettings.marginTop + 'mm');
            root.style.setProperty('--page-margin-bottom', currentSettings.marginBottom + 'mm');
            root.style.setProperty('--page-margin-sides', currentSettings.marginSides + 'mm');
            root.style.setProperty('--q-spacing-between', currentSettings.spacing + 'mm');
            root.style.setProperty('--q-label-fontsize', currentSettings.labelSize + 'pt');
            root.style.setProperty('--q-content-fontsize', currentSettings.contentSize + 'pt');

            // 按题型分组
            const groups = {};
            const typeOrder = [];
            QUESTIONS.forEach(q => {
                const type = q.QuestionType || '其他题型';
                if (!groups[type]) {
                    groups[type] = [];
                    typeOrder.push(type);
                }
                groups[type].push(q);
            });

            const chineseNums = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五'];
            
            let currentPageIndex = 0;
            let currentPage = createPage(currentPageIndex + 1, true);
            container.appendChild(currentPage);
            let questionsInCurrentPage = 0;
            let globalQuestionIndex = 1;

            typeOrder.forEach((type, typeIndex) => {
                let headerAddedForThisType = false;

                groups[type].forEach((q, qIndex) => {
                    try {
                        // 获取当前页的覆盖设置
                        const override = (currentSettings.pageOverrides && currentSettings.pageOverrides[currentPageIndex]) || {};
                        const qPerPage = override.questionsPerPage !== undefined ? override.questionsPerPage : currentSettings.questionsPerPage;
                        
                        // 检查是否需要分页 (在添加题型头部或题目之前)
                        if (qPerPage > 0 && questionsInCurrentPage >= qPerPage) {
                            currentPageIndex++;
                            currentPage = createPage(currentPageIndex + 1, false);
                            container.appendChild(currentPage);
                            questionsInCurrentPage = 0;
                        }

                        // 应用当前页的间距设置
                        const pageOverride = (currentSettings.pageOverrides && currentSettings.pageOverrides[currentPageIndex]) || {};
                        const pageSpacing = pageOverride.spacing !== undefined ? pageOverride.spacing : currentSettings.spacing;
                        currentPage.style.setProperty('--q-spacing-between', pageSpacing + 'mm');

                        // 如果该题型还没添加头部，则在当前页添加
                        if (!headerAddedForThisType) {
                            const sectionHeader = document.createElement('div');
                            sectionHeader.className = 'section-header';
                            sectionHeader.textContent = \`\${chineseNums[typeIndex] || (typeIndex + 1)}、\${type}\`;
                            currentPage.querySelector('.questions-list').appendChild(sectionHeader);
                            headerAddedForThisType = true;
                        }

                        const qElement = document.createElement('div');
                        qElement.className = 'question-item';
                        
                        const qHeader = document.createElement('div');
                        qHeader.className = 'question-header';
                        
                        const qLabel = document.createElement('span');
                        // 使用全局连续编号
                        qLabel.textContent = \`\${globalQuestionIndex}.\`;
                        qHeader.appendChild(qLabel);

                        // 显示 ID
                        if (currentSettings.showId) {
                            const qId = document.createElement('span');
                            qId.className = 'question-id';
                            qId.textContent = \`ID: \${q.QuestionID}\`;
                            qHeader.appendChild(qId);
                        }

                        // 显示来源
                        if (currentSettings.showSource && (q.BookTitle || q.BookChapter)) {
                            const qSource = document.createElement('span');
                            qSource.className = 'question-source';
                            qSource.textContent = \`[\${q.BookTitle || ''} \${q.BookChapter || ''}]\`;
                            qHeader.appendChild(qSource);
                        }
                        
                        const qBody = document.createElement('div');
                        qBody.className = 'question-body';
                        qBody.innerHTML = transformText(q.QuestionText);
                        
                        qElement.appendChild(qHeader);
                        qElement.appendChild(qBody);

                        currentPage.querySelector('.questions-list').appendChild(qElement);
                        questionsInCurrentPage++;
                        globalQuestionIndex++;

                    } catch (e) {
                        console.error('渲染题目失败:', e, q);
                    }
                });
            });

            // 重新触发 KaTeX 渲染
            renderMath();
        }

        function createPage(num, isFirstPage) {
            const pageIndex = num - 1;
            const page = document.createElement('div');
            page.className = 'printable-page';
            
            // 添加分页控制条 (仅预览显示)
            const override = (currentSettings.pageOverrides && currentSettings.pageOverrides[pageIndex]) || {};
            const qPerPage = override.questionsPerPage !== undefined ? override.questionsPerPage : currentSettings.questionsPerPage;
            const spacing = override.spacing !== undefined ? override.spacing : currentSettings.spacing;

            const controls = document.createElement('div');
            controls.className = 'page-controls no-print';
            
            const qCountDiv = document.createElement('div');
            const qCountLabel = document.createElement('label');
            qCountLabel.textContent = '题目数:';
            const qCountInput = document.createElement('input');
            qCountInput.type = 'number';
            qCountInput.value = qPerPage;
            qCountInput.min = '0';
            qCountInput.onchange = (e) => updatePageOverride(pageIndex, 'questionsPerPage', e.target.value);
            qCountDiv.appendChild(qCountLabel);
            qCountDiv.appendChild(qCountInput);
            
            const spacingDiv = document.createElement('div');
            spacingDiv.style.marginLeft = '5px';
            const spacingLabel = document.createElement('label');
            spacingLabel.textContent = '间距:';
            const spacingInput = document.createElement('input');
            spacingInput.type = 'number';
            spacingInput.value = spacing;
            spacingInput.min = '0';
            spacingInput.onchange = (e) => updatePageOverride(pageIndex, 'spacing', e.target.value);
            spacingDiv.appendChild(spacingLabel);
            spacingDiv.appendChild(spacingInput);
            
            const resetBtn = document.createElement('button');
            resetBtn.style.marginLeft = '5px';
            resetBtn.textContent = '重置';
            resetBtn.onclick = () => resetPageOverride(pageIndex);
            
            controls.appendChild(qCountDiv);
            controls.appendChild(spacingDiv);
            controls.appendChild(resetBtn);
            
            page.appendChild(controls);

            let headerHtml = '';
            if (currentSettings.showHeader) {
                const headerText = currentSettings.customHeader || '';
                const headerAlign = currentSettings.headerAlign;
                const headerSize = currentSettings.headerSize;
                const headerTop = currentSettings.headerTop;
                const showLogo = currentSettings.showLogo;
                
                let headerContent = \`
                    <header class="paper-header" style="text-align: \${headerAlign}; margin-top: \${headerTop}mm;">
                \`;
                
                if (showLogo) {
                    headerContent += \`
                        <div class="header-logo-row">
                            <img src="/assets/logo.png" class="header-logo" alt="logo">
                            <span class="header-brand" style="font-size: \${headerSize}pt;">一战成硕</span>
                        </div>
                    \`;
                }
                
                if (headerText) {
                    headerContent += \`<h1 class="paper-title" style="font-size: \${headerSize}pt;">\${headerText}</h1>\`;
                }
                
                if (currentSettings.showQuestionCount) {
                    headerContent += \`<div class="paper-info"><span>题目数量：\${QUESTIONS.length}</span></div>\`;
                }
                headerContent += \`</header>\`;
                headerHtml = headerContent;
            }

            let footerHtml = '';
            if (currentSettings.showPageNumber || currentSettings.showFooter) {
                const footerAlign = currentSettings.footerAlign;
                let footerJustify = 'center';
                if (footerAlign === 'left') footerJustify = 'flex-start';
                else if (footerAlign === 'right') footerJustify = 'flex-end';
                footerHtml = \`<div class="page-footer" style="justify-content: \${footerJustify}">\`;
                if (currentSettings.showFooter && currentSettings.customFooter) {
                    footerHtml += \`<span class="footer-text">\${currentSettings.customFooter}</span>\`;
                }
                if (currentSettings.showPageNumber) {
                    footerHtml += \`<span class="page-number-text">第 \${num} 页</span>\`;
                }
                footerHtml += \`</div>\`;
            }

            const content = document.createElement('div');
            content.className = 'page-inner-content';
            content.innerHTML = \`
                \${headerHtml}
                <div class="questions-list"></div>
                \${footerHtml}
            \`;
            page.appendChild(content);
            return page;
        }

        function updatePageOverride(pageIndex, key, value) {
            if (!currentSettings.pageOverrides) {
                currentSettings.pageOverrides = {};
            }
            if (!currentSettings.pageOverrides[pageIndex]) {
                currentSettings.pageOverrides[pageIndex] = {};
            }
            currentSettings.pageOverrides[pageIndex][key] = parseInt(value);
            repaginate();
        }

        function resetPageOverride(pageIndex) {
            if (currentSettings.pageOverrides) {
                delete currentSettings.pageOverrides[pageIndex];
            }
            repaginate();
        }

        // Modal Logic
        const modal = document.getElementById('settingsModal');
        document.getElementById('openSettingsBtn').onclick = () => {
            document.getElementById('settingPageSize').value = currentSettings.pageSize;
            document.getElementById('settingOrientation').value = currentSettings.orientation;
            document.getElementById('settingMarginTop').value = currentSettings.marginTop;
            document.getElementById('settingMarginBottom').value = currentSettings.marginBottom;
            document.getElementById('settingMarginSides').value = currentSettings.marginSides;
            document.getElementById('settingSpacing').value = currentSettings.spacing;
            document.getElementById('settingLabelSize').value = currentSettings.labelSize;
            document.getElementById('settingContentSize').value = currentSettings.contentSize;
            document.getElementById('settingQuestionsPerPage').value = currentSettings.questionsPerPage;
            document.getElementById('settingShowSource').checked = currentSettings.showSource;
            document.getElementById('settingShowId').checked = currentSettings.showId;
            document.getElementById('settingCustomHeader').value = currentSettings.customHeader;
            document.getElementById('settingHeaderAlign').value = currentSettings.headerAlign;
            document.getElementById('settingHeaderSize').value = currentSettings.headerSize;
            document.getElementById('settingHeaderTop').value = currentSettings.headerTop;
            document.getElementById('settingShowHeader').checked = currentSettings.showHeader;
            document.getElementById('settingShowLogo').checked = currentSettings.showLogo;
            document.getElementById('settingShowQuestionCount').checked = currentSettings.showQuestionCount;
            document.getElementById('settingCustomFooter').value = currentSettings.customFooter;
            document.getElementById('settingFooterAlign').value = currentSettings.footerAlign;
            document.getElementById('settingShowPageNumber').checked = currentSettings.showPageNumber;
            document.getElementById('settingShowFooter').checked = currentSettings.showFooter;
            modal.classList.add('active');
        };

        document.getElementById('cancelSettingsBtn').onclick = () => modal.classList.remove('active');
        
        document.getElementById('applySettingsBtn').onclick = () => {
            currentSettings = {
                ...currentSettings,
                pageSize: document.getElementById('settingPageSize').value,
                orientation: document.getElementById('settingOrientation').value,
                marginTop: parseInt(document.getElementById('settingMarginTop').value),
                marginBottom: parseInt(document.getElementById('settingMarginBottom').value),
                marginSides: parseInt(document.getElementById('settingMarginSides').value),
                spacing: parseInt(document.getElementById('settingSpacing').value),
                labelSize: parseInt(document.getElementById('settingLabelSize').value),
                contentSize: parseInt(document.getElementById('settingContentSize').value),
                questionsPerPage: parseInt(document.getElementById('settingQuestionsPerPage').value),
                showSource: document.getElementById('settingShowSource').checked,
                showId: document.getElementById('settingShowId').checked,
                customHeader: document.getElementById('settingCustomHeader').value,
                headerAlign: document.getElementById('settingHeaderAlign').value,
                headerSize: parseInt(document.getElementById('settingHeaderSize').value),
                headerTop: parseInt(document.getElementById('settingHeaderTop').value),
                showHeader: document.getElementById('settingShowHeader').checked,
                showLogo: document.getElementById('settingShowLogo').checked,
                showQuestionCount: document.getElementById('settingShowQuestionCount').checked,
                customFooter: document.getElementById('settingCustomFooter').value,
                footerAlign: document.getElementById('settingFooterAlign').value,
                showPageNumber: document.getElementById('settingShowPageNumber').checked,
                showFooter: document.getElementById('settingShowFooter').checked,
                pageOverrides: currentSettings.pageOverrides
            };
            repaginate();
            modal.classList.remove('active');
        };

        window.onload = repaginate;
    </script>
</body>
</html>
    `;

    // 使用 replace 注入数据，避免模板字符串转义问题
    // 使用函数作为第二个参数，避免字符串中的 $ 符号被 replace 误当作替换占位符（如 $1, $& 等）
    let finalHtml = html.replace('__QUESTIONS_JSON__', () => JSON.stringify(questions));
    finalHtml = finalHtml.replace('__PAPER_TITLE_JSON__', () => JSON.stringify(paper.Title || '智能练习卷'));
    finalHtml = finalHtml.replace('__PAPER_TITLE_PLAIN__', () => (paper.Title || '智能练习卷'));

    res.send(finalHtml);
  } catch (error) {

    console.error('生成打印页面失败:', error);
    res.status(500).send('服务器错误');
  }
};

const replacePaperQuestion = async (req, res) => {
  const connection = await mysqlPool.getConnection();
  try {
    await connection.beginTransaction();
    const { paperId } = req.params;
    const { oldQuestionId, sortOrder } = req.body;

    // 获取试卷配置，用于寻找替换题目
    const [papers] = await connection.query('SELECT Config FROM math_generated_papers WHERE PaperID = ?', [paperId]);
    if (papers.length === 0) throw new Error('试卷不存在');
    
    const config = typeof papers[0].Config === 'string' ? JSON.parse(papers[0].Config) : papers[0].Config;
    const { scope } = config;

    // 获取当前已有的题目ID，避免重复
    const [currentQuestions] = await connection.query('SELECT QuestionID FROM math_generated_paper_questions WHERE PaperID = ?', [paperId]);
    const currentIds = currentQuestions.map(q => q.QuestionID);

    // 获取原题型
    const [oldQ] = await connection.query('SELECT QuestionType FROM math_questions WHERE QuestionID = ?', [oldQuestionId]);
    const targetType = oldQ[0]?.QuestionType || '选择题';

    // 寻找备选题目
    let pool = [];
    for (const item of scope) {
      const { bookId, chapters } = item;
      const [questions] = await connection.query(
        `SELECT bq.QuestionID, bq.BookID, bq.BookChapter
         FROM math_bookquestions bq
         JOIN math_questions q ON bq.QuestionID = q.QuestionID
         WHERE bq.BookID = ? AND bq.BookChapter IN (?) AND q.QuestionType = ? AND q.QuestionID NOT IN (?)
         ORDER BY RAND() LIMIT 10`,
        [bookId, chapters, targetType, currentIds]
      );
      pool = pool.concat(questions);
    }

    if (pool.length === 0) throw new Error('没有更多符合条件的题目可更换');

    const newQ = pool[Math.floor(Math.random() * pool.length)];

    // 执行替换
    await connection.query(
      'UPDATE math_generated_paper_questions SET QuestionID = ?, BookID = ?, BookChapter = ? WHERE PaperID = ? AND SortOrder = ?',
      [newQ.QuestionID, newQ.BookID, newQ.BookChapter, paperId, sortOrder]
    );

    await connection.commit();
    res.json(successResponse({ 
      message: '换题成功',
      newQuestionId: newQ.QuestionID
    }));
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('换题失败:', error);
    res.status(500).json(errorResponse(error.message));
  } finally {
    if (connection) connection.release();
  }
};

const deleteGeneratedPaper = async (req, res) => {
  const connection = await mysqlPool.getConnection();
  try {
    await connection.beginTransaction();
    const { paperId } = req.params;
    const userId = req.userId;

    // 验证所有权
    const [papers] = await connection.query('SELECT PaperID FROM math_generated_papers WHERE PaperID = ? AND UserID = ?', [paperId, userId]);
    if (papers.length === 0) return res.status(404).json(errorResponse('试卷不存在或无权操作'));

    // 删除关联题目
    await connection.query('DELETE FROM math_generated_paper_questions WHERE PaperID = ?', [paperId]);
    // 删除主表
    await connection.query('DELETE FROM math_generated_papers WHERE PaperID = ?', [paperId]);

    await connection.commit();
    res.json(successResponse({ message: '试卷已删除' }));
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('删除试卷失败:', error);
    res.status(500).json(errorResponse('删除失败'));
  } finally {
    if (connection) connection.release();
  }
};

const updatePaperTitle = async (req, res) => {
  try {
    const { paperId } = req.params;
    const { title } = req.body;
    const userId = req.userId;

    if (!title) return res.status(400).json(errorResponse('标题不能为空'));

    const [result] = await mysqlPool.query(
      'UPDATE math_generated_papers SET Title = ? WHERE PaperID = ? AND UserID = ?',
      [title, paperId, userId]
    );

    if (result.affectedRows === 0) return res.status(404).json(errorResponse('试卷不存在或无权操作'));

    res.json(successResponse({ message: '更新成功' }));
  } catch (error) {
    console.error('更新标题失败:', error);
    res.status(500).json(errorResponse('更新失败'));
  }
};

const reorderPaperQuestions = async (req, res) => {
  const connection = await mysqlPool.getConnection();
  try {
    await connection.beginTransaction();
    const { paperId } = req.params;
    const { questionOrders } = req.body;

    if (!questionOrders || !Array.isArray(questionOrders)) {
      return res.status(400).json(errorResponse('排序数据格式不正确'));
    }

    for (const item of questionOrders) {
      await connection.query(
        'UPDATE math_generated_paper_questions SET SortOrder = ? WHERE PaperID = ? AND QuestionID = ?',
        [item.sortOrder, paperId, item.questionId]
      );
    }

    await connection.commit();
    res.json(successResponse(null, '排序更新成功'));
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('更新试卷排序失败:', error);
    res.status(500).json(errorResponse('更新排序失败'));
  } finally {
    if (connection) connection.release();
  }
};

const getUserGeneratedPapers = async (req, res) => {
  try {
    const userId = req.userId;
    const { subjectId } = req.query;

    let query = `
      SELECT p.PaperID, p.PrintToken, p.UserID, p.Title, p.SubjectID, p.AverageDifficulty, p.CreatedAt,
             (SELECT COUNT(*) FROM math_generated_paper_questions q WHERE q.PaperID = p.PaperID) as QuestionCount
      FROM math_generated_papers p 
      WHERE p.UserID = ?
    `;
    const params = [userId];

    if (subjectId) {
      query += ` AND p.SubjectID = ?`;
      params.push(parseInt(subjectId));
    }

    query += ` ORDER BY p.CreatedAt DESC`;

    const [papers] = await mysqlPool.query(query, params);
    res.json(successResponse(papers));
  } catch (error) {
    console.error('获取用户组卷失败:', error);
    res.status(500).json(errorResponse('获取组卷失败'));
  }
};

const getQuestionsByBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    
    if (!bookId) {
      return res.status(400).json(errorResponse('书籍ID不能为空'));
    }
    
    const [bookQuestions] = await mysqlPool.query(
      'SELECT * FROM math_bookquestions WHERE BookID = ? ORDER BY Sort ASC',
      [parseInt(bookId)]
    );
    
    const questionIds = bookQuestions.map(bq => bq.QuestionID);
    
    if (questionIds.length === 0) {
      return res.json(successResponse({
        questions: [],
        total: 0
      }));
    }

    const [questions] = await mysqlPool.query(
      'SELECT * FROM math_questions WHERE QuestionID IN (?)',
      [questionIds]
    );
    
    const questionsDict = {};
    questions.forEach(q => {
      questionsDict[q.QuestionID] = q;
    });
    
    const formattedQuestions = bookQuestions.map(bq => ({
      ...bq,
      question: questionsDict[bq.QuestionID] || null
    }));
    
    res.json(successResponse({
      questions: formattedQuestions,
      total: formattedQuestions.length
    }));
  } catch (error) {
    console.error('获取书籍题目失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const getUserProgress = async (req, res) => {
  try {
    const userId = req.userId;
    const [progress] = await mysqlPool.query(
      'SELECT * FROM math_user_progress WHERE UserID = ?',
      [userId]
    );
    
    // 计算累计学习天数
    const [stats] = await mysqlPool.query(
      'SELECT study_days FROM users WHERE id = ?',
      [userId]
    );

    res.json(successResponse({
      list: progress,
      daysPersisted: stats[0]?.study_days || 0,
      daysRemaining: 150 // 假设一个固定值或从设置获取
    }));
  } catch (error) {
    console.error('获取用户进度失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const updateProgress = async (req, res) => {
  try {
    const { questionId, bookId, status, lastAnswer, isCorrect } = req.body;
    const userId = req.userId;

    // 1. 更新或插入题目进度
    await mysqlPool.query(
      `INSERT INTO math_user_progress (UserID, QuestionID, BookID, Status, LastAnswer, IsCorrect) 
       VALUES (?, ?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
       Status = VALUES(Status), 
       LastAnswer = VALUES(LastAnswer), 
       IsCorrect = VALUES(IsCorrect)`,
      [userId, questionId, bookId || 0, status || 0, lastAnswer || '', isCorrect ? 1 : 0]
    );

    // 2. 记录到学习统计 (answer_records)
    // 获取科目名称 (数学) 并包含书名以供后续跳转
    let subjectName = '数学刷题';
    let chapterName = null;
    try {
      const [bookRows] = await mysqlPool.query('SELECT BookTitle FROM math_books WHERE BookID = ?', [bookId]);
      if (bookRows.length > 0) {
        subjectName = `数学 - ${bookRows[0].BookTitle}`;
      }
      
      const [chapterRows] = await mysqlPool.query(
        'SELECT ChapterName FROM math_bookquestions WHERE BookID = ? AND QuestionID = ? LIMIT 1',
        [bookId, questionId]
      );
      if (chapterRows.length > 0) {
        chapterName = chapterRows[0].ChapterName;
      }
    } catch (e) {
      console.error('获取数学书名或章节失败:', e);
    }
    
    await mysqlPool.query(
      'INSERT INTO answer_records (userId, subjectId, subjectName, chapterName, totalQuestions, correctQuestions, createdAt, bookId) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)',
      [userId, 4, subjectName, chapterName, 1, isCorrect ? 1 : 0, bookId || null]
    );

    // 3. 更新用户总统计数据
    await mysqlPool.query(
      `UPDATE users SET 
        total_questions = total_questions + 1,
        total_correct = total_correct + ?,
        last_study_time = NOW(),
        study_days = CASE 
          WHEN last_study_time IS NULL OR DATE(last_study_time) != CURDATE() 
          THEN study_days + 1 
          ELSE study_days 
        END
      WHERE id = ?`,
      [isCorrect ? 1 : 0, userId]
    );

    res.json(successResponse(null, '进度已更新'));
  } catch (error) {
    console.error('更新数学进度失败:', error);
    res.status(500).json(errorResponse('服务器错误: ' + error.message));
  }
};

const getNewCount = async (req, res) => {
  try {
    const { subjectId } = req.query;
    
    let query = 'SELECT COUNT(DISTINCT b.BookID) as count FROM math_books b';
    let params = [];
    
    if (subjectId) {
      const parsedId = parseInt(subjectId);
      const subjectIds = [parsedId];
      if ([1, 2, 3].includes(parsedId)) {
        subjectIds.push(4);
      }
      query += ' JOIN math_book_subjects mbs ON b.BookID = mbs.BookID WHERE b.IsNew = 1 AND mbs.SubjectID IN (?)';
      params.push(subjectIds);
    } else {
      query += ' WHERE b.IsNew = 1';
    }
    
    const [rows] = await mysqlPool.query(query, params);
    
    res.json(successResponse({ count: rows[0].count }));
  } catch (error) {
    console.error('获取新书数量失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const toggleFavorite = async (req, res) => {
  try {
    const { questionId, bookId, categoryId } = req.body;
    const userId = req.userId;

    if (!questionId) {
      return res.status(400).json(errorResponse('题目ID不能为空'));
    }

    // Check if already favorited
    const [existing] = await mysqlPool.query(
      'SELECT * FROM math_favorites WHERE UserID = ? AND QuestionID = ?',
      [userId, questionId]
    );

    if (existing.length > 0) {
      // Remove from favorites
      await mysqlPool.query(
        'DELETE FROM math_favorites WHERE UserID = ? AND QuestionID = ?',
        [userId, questionId]
      );
      res.json(successResponse({ isFavorite: false }, '已取消收藏'));
    } else {
      // Add to favorites
      await mysqlPool.query(
        'INSERT INTO math_favorites (UserID, QuestionID, BookID, CategoryID) VALUES (?, ?, ?, ?)',
        [userId, questionId, bookId || null, categoryId || null]
      );
      res.json(successResponse({ isFavorite: true }, '收藏成功'));
    }
  } catch (error) {
    console.error('切换收藏状态失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const getFavorites = async (req, res) => {
  try {
    const userId = req.userId;
    const { subjectId, categoryId } = req.query;

    let query = `
      SELECT f.*, q.QuestionText, q.QuestionType, b.BookTitle, fc.Title as CategoryTitle
      FROM math_favorites f
      JOIN math_questions q ON f.QuestionID = q.QuestionID
      LEFT JOIN math_books b ON f.BookID = b.BookID
      LEFT JOIN math_favorite_categories fc ON f.CategoryID = fc.CategoryID
      WHERE f.UserID = ?
    `;
    const params = [userId];

    if (subjectId) {
      const parsedId = parseInt(subjectId);
      const subjectIds = [parsedId];
      if ([1, 2, 3].includes(parsedId)) {
        subjectIds.push(4);
      }
      query += ` AND EXISTS (SELECT 1 FROM math_book_subjects mbs WHERE mbs.BookID = f.BookID AND mbs.SubjectID IN (?))`;
      params.push(subjectIds);
    }

    if (categoryId) {
      query += ` AND f.CategoryID = ?`;
      params.push(categoryId);
    }

    query += ` ORDER BY f.CreatedAt DESC`;

    const [favorites] = await mysqlPool.query(query, params);

    res.json(successResponse(favorites));
  } catch (error) {
    console.error('获取收藏列表失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const checkFavorite = async (req, res) => {
  try {
    const { questionId } = req.query;
    const userId = req.userId;

    if (!questionId) {
      return res.status(400).json(errorResponse('题目ID不能为空'));
    }

    const [existing] = await mysqlPool.query(
      'SELECT * FROM math_favorites WHERE UserID = ? AND QuestionID = ?',
      [userId, questionId]
    );

    res.json(successResponse({ isFavorite: existing.length > 0 }));
  } catch (error) {
    console.error('检查收藏状态失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const getFavoriteCategories = async (req, res) => {
  try {
    const userId = req.userId;
    const [categories] = await mysqlPool.query(
      'SELECT * FROM math_favorite_categories WHERE UserID = ? ORDER BY CreatedAt DESC',
      [userId]
    );
    res.json(successResponse(categories));
  } catch (error) {
    console.error('获取收藏分类失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const createFavoriteCategory = async (req, res) => {
  try {
    const { title } = req.body;
    const userId = req.userId;
    if (!title) {
      return res.status(400).json(errorResponse('分类标题不能为空'));
    }
    const [result] = await mysqlPool.query(
      'INSERT INTO math_favorite_categories (UserID, Title) VALUES (?, ?)',
      [userId, title]
    );
    res.json(successResponse({ categoryId: result.insertId, title }, '分类创建成功'));
  } catch (error) {
    console.error('创建分类失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const deleteFavoriteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const userId = req.userId;
    
    // 同时取消该分类下题目的分类关联（或者直接删除收藏，这里选择保留收藏但清空分类）
    await mysqlPool.query(
      'UPDATE math_favorites SET CategoryID = NULL WHERE UserID = ? AND CategoryID = ?',
      [userId, categoryId]
    );
    
    await mysqlPool.query(
      'DELETE FROM math_favorite_categories WHERE UserID = ? AND CategoryID = ?',
      [userId, categoryId]
    );
    res.json(successResponse(null, '分类已删除'));
  } catch (error) {
    console.error('删除分类失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

// 书架管理相关
const getUserBookshelf = async (req, res) => {
  try {
    const userId = req.userId;
    const { subjectId } = req.query;

    let query = `
      SELECT DISTINCT b.*, ub.SortOrder
      FROM math_user_books ub
      JOIN math_books b ON ub.BookID = b.BookID
      LEFT JOIN math_book_subjects mbs ON b.BookID = mbs.BookID
      WHERE ub.UserID = ?
    `;
    const params = [userId];

    if (subjectId) {
      const parsedId = parseInt(subjectId);
      const subjectIds = [parsedId];
      if ([1, 2, 3].includes(parsedId)) {
        subjectIds.push(4);
      }
      query += ` AND mbs.SubjectID IN (?)`;
      params.push(subjectIds);
    }

    query += ` ORDER BY ub.SortOrder ASC, b.VersionInfo DESC`;

    const [books] = await mysqlPool.query(query, params);
    res.json(successResponse(books));
  } catch (error) {
    console.error('获取用户书架失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const addToBookshelf = async (req, res) => {
  try {
    const { bookId } = req.body;
    const userId = req.userId;

    if (!bookId) {
      return res.status(400).json(errorResponse('书籍ID不能为空'));
    }

    await mysqlPool.query(
      'INSERT IGNORE INTO math_user_books (UserID, BookID) VALUES (?, ?)',
      [userId, bookId]
    );
    res.json(successResponse(null, '已添加到书架'));
  } catch (error) {
    console.error('添加到书架失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const removeFromBookshelf = async (req, res) => {
  try {
    const { bookId } = req.body;
    const userId = req.userId;

    if (!bookId) {
      return res.status(400).json(errorResponse('书籍ID不能为空'));
    }

    await mysqlPool.query(
      'DELETE FROM math_user_books WHERE UserID = ? AND BookID = ?',
      [userId, bookId]
    );
    res.json(successResponse(null, '已从书架移除'));
  } catch (error) {
    console.error('从书架移除失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const batchAddToBookshelf = async (req, res) => {
  try {
    const { bookIds } = req.body;
    const userId = req.userId;

    if (!bookIds || !Array.isArray(bookIds) || bookIds.length === 0) {
      return res.status(400).json(errorResponse('书籍ID列表不能为空'));
    }

    // 获取当前最大排序值
    const [maxSortRow] = await mysqlPool.query(
      'SELECT MAX(SortOrder) as maxSort FROM math_user_books WHERE UserID = ?',
      [userId]
    );
    let nextSort = (maxSortRow[0]?.maxSort || 0) + 1;

    const values = bookIds.map(id => [userId, id, nextSort++]);
    await mysqlPool.query(
      'INSERT IGNORE INTO math_user_books (UserID, BookID, SortOrder) VALUES ?',
      [values]
    );
    res.json(successResponse(null, '已添加到书架'));
  } catch (error) {
    console.error('批量添加到书架失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const submitCorrection = async (req, res) => {
  try {
    const { questionId, bookId, type, content } = req.body;
    
    if (!questionId || !type || !content) {
      return res.status(400).json(errorResponse('缺少必要参数'));
    }
    
    await mysqlPool.query(
      'INSERT INTO math_corrections (QuestionID, BookID, Type, Content) VALUES (?, ?, ?, ?)',
      [questionId, bookId || null, type, content]
    );
    
    res.json(successResponse(null, '反馈提交成功'));
  } catch (error) {
    console.error('提交纠错失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const updateQuestionKps = async (req, res) => {
  try {
    const { id } = req.params;
    const { kps } = req.body;
    
    await mysqlPool.query(
      'UPDATE math_questions SET LinkNames = ? WHERE QuestionID = ?',
      [kps, id]
    );
    
    res.json(successResponse(null, '考点更新成功'));
  } catch (error) {
    console.error('更新考点失败:', error);
    res.status(500).json(errorResponse('更新失败'));
  }
};

const getBookChapters = async (req, res) => {
  try {
    const { bookId } = req.params;
    if (!bookId) return res.status(400).json(errorResponse('书籍ID不能为空'));

    const [chapters] = await mysqlPool.query(
      `SELECT BookChapter as name, COUNT(*) as questionCount 
       FROM math_bookquestions 
       WHERE BookID = ? 
       GROUP BY BookChapter 
       ORDER BY MIN(Sort) ASC`,
      [bookId]
    );

    res.json(successResponse(chapters));
  } catch (error) {
    console.error('获取书籍章节失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const getBookQuestionsByChapter = async (req, res) => {
  try {
    const { bookId, chapterName } = req.params;
    if (!bookId || !chapterName) return res.status(400).json(errorResponse('参数不足'));

    const [questions] = await mysqlPool.query(
      `SELECT q.QuestionID, q.QuestionType, q.Difficulty, bq.QuestionImg, bq.BookChapter 
       FROM math_bookquestions bq
       JOIN math_questions q ON bq.QuestionID = q.QuestionID
       WHERE bq.BookID = ? AND bq.BookChapter = ?
       ORDER BY bq.Sort ASC`,
      [bookId, chapterName]
    );

    res.json(successResponse(questions));
  } catch (error) {
    console.error('获取章节题目失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const getRelatedQuestions = async (req, res) => {
  try {
    const { questionId } = req.params;
    
    if (!questionId) {
      return res.status(400).json(errorResponse('题目ID不能为空'));
    }

    const [relatedQuestions] = await mysqlPool.query(
      `SELECT q.QuestionID, q.QuestionType, q.Difficulty, q.QuestionText, q.QuestionImg, q.OriginalAnswerText
       FROM math_relatedquestions r
       JOIN math_questions q ON r.RelatedQuestionID = q.QuestionID
       WHERE r.SourceQuestionID = ?
       LIMIT 10`,
      [parseInt(questionId)]
    );

    res.json(successResponse(relatedQuestions));
  } catch (error) {
    console.error('获取相关题目失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

// 获取考点分类列表（三级结构：未命名 -> 未命名(章节) -> 考点）
const getKnowledgeCategories = async (req, res) => {
  try {
    const [categories] = await mysqlPool.query(`
      SELECT id, CategoryCode, CategoryName, Description, QuestionCount, SortOrder
      FROM math_knowledge_categories
      WHERE IsActive = 1
      ORDER BY CategoryCode ASC
    `);

    const result = {
      subjects: []
    };

    categories.forEach(cat => {
      const parts = cat.CategoryCode.split('-');
      const level = parts.length;
      
      if (level === 1) {
        result.subjects.push({
          id: cat.id,
          code: cat.CategoryCode,
          name: cat.CategoryName,
          chapters: []
        });
      }
      else if (level === 2) {
        const subjectCode = parts[0];
        const subject = result.subjects.find(s => s.code === subjectCode);
        if (subject) {
          subject.chapters.push({
            id: cat.id,
            code: cat.CategoryCode,
            name: cat.CategoryName,
            points: []
          });
        }
      }
      else if (level === 3) {
        const subjectCode = parts[0];
        const chapterCode = parts[1];
        const subject = result.subjects.find(s => s.code === subjectCode);
        if (subject) {
          const chapter = subject.chapters.find(c => c.code === `${subjectCode}-${chapterCode}`);
          if (chapter) {
            chapter.points.push({
              id: cat.id,
              code: cat.CategoryCode,
              originalId: parseInt(parts[2]),
              name: cat.CategoryName,
              questionCount: cat.QuestionCount
            });
          }
        }
      }
    });

    res.json(successResponse(result));
  } catch (error) {
    console.error('获取考点列表失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

// 根据考点获取题目数量（使用LinksCount）
const getQuestionCountByKnowledgePoint = async (req, res) => {
  try {
    const { knowledgePointId } = req.query;
    
    if (!knowledgePointId) {
      return res.status(400).json(errorResponse('考点ID不能为空'));
    }
    
    const [result] = await mysqlPool.query(
      'SELECT COUNT(*) as count FROM math_questions WHERE FIND_IN_SET(?, LinksCount)',
      [knowledgePointId]
    );
    
    res.json(successResponse({ count: result[0].count }));
  } catch (error) {
    console.error('获取题目数量失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

// 根据考点获取题目列表（使用LinksCount）
const getQuestionsByKnowledgePoint = async (req, res) => {
  try {
    const { knowledgePointId, bookType } = req.query;
    
    if (!knowledgePointId) {
      return res.status(400).json(errorResponse('考点ID不能为空'));
    }
    
    let sql = `
      SELECT DISTINCT q.*, b.ContentType as bookType
      FROM math_questions q
      LEFT JOIN math_bookquestions bq ON q.QuestionID = bq.QuestionID
      LEFT JOIN math_books b ON bq.BookID = b.BookID
      WHERE FIND_IN_SET(?, q.LinksCount)
    `;
    const params = [knowledgePointId];
    
    if (bookType && bookType !== 'all') {
      sql += ' AND b.ContentType = ?';
      params.push(bookType);
    }
    
    sql += ' ORDER BY q.QuestionID ASC LIMIT 100';
    
    const [questions] = await mysqlPool.query(sql, params);
    res.json(successResponse(questions));
  } catch (error) {
    console.error('获取题目列表失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const getAdminKnowledgeCategories = async (req, res) => {
  try {
    const [categories] = await mysqlPool.query(`
      SELECT id, CategoryCode, CategoryName, Description, QuestionCount, SortOrder, IsActive
      FROM math_knowledge_categories
      ORDER BY SortOrder ASC, id ASC
    `);
    res.json(successResponse(categories));
  } catch (error) {
    console.error('获取考点分类列表失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const updateKnowledgeCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { CategoryCode, CategoryName, Description, SortOrder, IsActive } = req.body;
    
    await mysqlPool.query(`
      UPDATE math_knowledge_categories 
      SET CategoryCode = ?, CategoryName = ?, Description = ?, SortOrder = ?, IsActive = ?, UpdatedAt = NOW()
      WHERE id = ?
    `, [CategoryCode, CategoryName, Description, SortOrder, IsActive, id]);
    
    res.json(successResponse(null, '更新成功'));
  } catch (error) {
    console.error('更新考点分类失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const createKnowledgeCategory = async (req, res) => {
  try {
    const { CategoryCode, CategoryName, Description, SortOrder } = req.body;
    
    const [result] = await mysqlPool.query(`
      INSERT INTO math_knowledge_categories
      (CategoryCode, CategoryName, Description, SortOrder, IsActive, CreatedAt, UpdatedAt)
      VALUES (?, ?, ?, ?, 1, NOW(), NOW())
    `, [CategoryCode, CategoryName, Description, SortOrder]);
    
    res.json(successResponse({ id: result.insertId }, '创建成功'));
  } catch (error) {
    console.error('创建考点分类失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const deleteKnowledgeCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    await mysqlPool.query('DELETE FROM math_knowledge_categories WHERE id = ?', [id]);
    
    res.json(successResponse(null, '删除成功'));
  } catch (error) {
    console.error('删除考点分类失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

module.exports = {
  getSubjects,
  getAllBooks,
  getBooksBySubject,
  getBookDetails,
  getBookPreview,
  getQuestionsByBook,
  getFullQuestionsByBook,
  getQuestionDetails,
  getQuestionsBatch,
  getBatchQuestionDetails,
  getUserProgress,
  updateProgress,
  getNewCount,
  toggleFavorite,
  getFavorites,
  checkFavorite,
  getUserBookshelf,
  addToBookshelf,
  removeFromBookshelf,
  batchAddToBookshelf,
  submitCorrection,
  generateSmartPaper,
  getGeneratedPaper,
  getPrintPaper,
  replacePaperQuestion,
  getUserGeneratedPapers,
  deleteGeneratedPaper,
  updatePaperTitle,
  reorderPaperQuestions,
  updateQuestionKps,
  getBookChapters,
  getBookQuestionsByChapter,
  incrementLearnerCount,
  getFavoriteCategories,
  createFavoriteCategory,
  deleteFavoriteCategory,
  getRelatedQuestions,
  getKnowledgeCategories,
  getQuestionCountByKnowledgePoint,
  getQuestionsByKnowledgePoint,
  getAdminKnowledgeCategories,
  updateKnowledgeCategory,
  createKnowledgeCategory,
  deleteKnowledgeCategory
};
