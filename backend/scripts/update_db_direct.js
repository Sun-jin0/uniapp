const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'quizmaster',
  multipleStatements: true
};

async function updateDatabase() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('开始修改数据库...\n');
    
    // 禁用外键检查
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    // 1. 检查 computer1_paper 表是否存在
    const [paperTableExists] = await connection.execute(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = 'computer1_paper'
    `, [dbConfig.database]);

    if (paperTableExists[0].count === 0) {
      console.log('⚠️ computer1_paper 表不存在，跳过添加字段操作');
    } else {
      // 检查 paper_type 字段是否已存在
      const [columnExists] = await connection.execute(`
        SELECT COUNT(*) as count FROM information_schema.columns 
        WHERE table_schema = ? AND table_name = 'computer1_paper' AND column_name = 'paper_type'
      `, [dbConfig.database]);

      if (columnExists[0].count === 0) {
        // 添加 paper_type 字段
        await connection.execute(`
          ALTER TABLE computer1_paper 
          ADD COLUMN paper_type TINYINT(1) DEFAULT 1 COMMENT '试卷类型：1=真题卷，2=模拟题卷'
        `);
        console.log('✅ 成功添加 paper_type 字段到 computer1_paper 表');
      } else {
        console.log('ℹ️ paper_type 字段已存在，跳过');
      }

      // 检查 exam_full_name 字段是否已存在
      const [examNameColumnExists] = await connection.execute(`
        SELECT COUNT(*) as count FROM information_schema.columns 
        WHERE table_schema = ? AND table_name = 'computer1_paper' AND column_name = 'exam_full_name'
      `, [dbConfig.database]);

      if (examNameColumnExists[0].count === 0) {
        // 添加 exam_full_name 字段
        await connection.execute(`
          ALTER TABLE computer1_paper 
          ADD COLUMN exam_full_name VARCHAR(500) COMMENT '试卷完整名称'
        `);
        console.log('✅ 成功添加 exam_full_name 字段到 computer1_paper 表');
      } else {
        console.log('ℹ️ exam_full_name 字段已存在，跳过');
      }
    }

    // 2. 删除 computer1_generated_papers 表
    const [generatedPapersExists] = await connection.execute(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = 'computer1_generated_papers'
    `, [dbConfig.database]);

    if (generatedPapersExists[0].count > 0) {
      await connection.execute('DROP TABLE IF EXISTS computer1_generated_papers');
      console.log('✅ 成功删除 computer1_generated_papers 表');
    } else {
      console.log('ℹ️ computer1_generated_papers 表不存在，跳过');
    }

    // 3. 删除 computer1_generated_paper_questions 表
    const [generatedQuestionsExists] = await connection.execute(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = 'computer1_generated_paper_questions'
    `, [dbConfig.database]);

    if (generatedQuestionsExists[0].count > 0) {
      await connection.execute('DROP TABLE IF EXISTS computer1_generated_paper_questions');
      console.log('✅ 成功删除 computer1_generated_paper_questions 表');
    } else {
      console.log('ℹ️ computer1_generated_paper_questions 表不存在，跳过');
    }

    // 4. 创建在线考试相关表
    console.log('\n开始创建在线考试相关表...');

    // 创建 online_exams 表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS online_exams (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '考试ID',
        title VARCHAR(255) NOT NULL COMMENT '考试名称',
        description TEXT COMMENT '考试描述',
        paper_type TINYINT(1) DEFAULT 1 COMMENT '试卷类型：1=真题卷，2=模拟题卷，3=组卷（从题库抽题）',
        source_paper_id VARCHAR(50) COMMENT '来源试卷ID（关联computer1_paper）',
        source_paper_name VARCHAR(255) COMMENT '来源试卷名称',
        start_time DATETIME NOT NULL COMMENT '考试开始时间',
        end_time DATETIME NOT NULL COMMENT '考试结束时间',
        duration INT UNSIGNED DEFAULT 120 COMMENT '考试时长（分钟）',
        is_published TINYINT(1) DEFAULT 0 COMMENT '是否发布：0=未发布，1=已发布',
        is_limited_time TINYINT(1) DEFAULT 1 COMMENT '是否限时：0=不限时，1=限时',
        show_result_immediately TINYINT(1) DEFAULT 1 COMMENT '是否立即显示成绩：0=否，1=是',
        allow_review TINYINT(1) DEFAULT 1 COMMENT '是否允许查看试卷：0=否，1=是',
        pass_score DECIMAL(5,2) DEFAULT 60.00 COMMENT '及格分数',
        total_score DECIMAL(5,2) DEFAULT 100.00 COMMENT '总分',
        created_by BIGINT UNSIGNED COMMENT '创建者ID（管理员ID）',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        PRIMARY KEY (id),
        INDEX idx_start_time (start_time),
        INDEX idx_is_published (is_published)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='在线考试表'
    `);
    console.log('✅ 成功创建 online_exams 表');

    // 创建 online_exam_questions 表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS online_exam_questions (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        exam_id BIGINT UNSIGNED NOT NULL COMMENT '考试ID',
        question_id VARCHAR(50) NOT NULL COMMENT '题目ID（关联computer1_question）',
        sort_order INT UNSIGNED DEFAULT 0 COMMENT '题目顺序',
        score DECIMAL(5,2) DEFAULT 0 COMMENT '题目分值',
        question_type VARCHAR(50) COMMENT '题目类型：choice=选择题，fill=填空题，essay=问答题等',
        PRIMARY KEY (id),
        UNIQUE KEY uk_exam_question (exam_id, question_id),
        INDEX idx_exam_id (exam_id),
        INDEX idx_question_id (question_id),
        FOREIGN KEY (exam_id) REFERENCES online_exams(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='考试题目关联表'
    `);
    console.log('✅ 成功创建 online_exam_questions 表');

    // 创建 online_exam_records 表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS online_exam_records (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        exam_id BIGINT UNSIGNED NOT NULL COMMENT '考试ID',
        user_id BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
        start_time DATETIME COMMENT '开始答题时间',
        submit_time DATETIME COMMENT '提交时间',
        duration INT UNSIGNED COMMENT '实际用时（秒）',
        objective_score DECIMAL(5,2) DEFAULT 0 COMMENT '客观题得分',
        subjective_score DECIMAL(5,2) DEFAULT 0 COMMENT '主观题得分',
        total_score DECIMAL(5,2) DEFAULT 0 COMMENT '总分',
        is_passed TINYINT(1) DEFAULT 0 COMMENT '是否及格：0=否，1=是',
        status TINYINT(1) DEFAULT 0 COMMENT '状态：0=进行中，1=已提交，2=已评分',
        is_graded TINYINT(1) DEFAULT 0 COMMENT '是否已评分：0=否，1=是',
        graded_by BIGINT UNSIGNED COMMENT '评分人ID',
        graded_at DATETIME COMMENT '评分时间',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_exam_user (exam_id, user_id),
        INDEX idx_exam_id (exam_id),
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_total_score (total_score),
        FOREIGN KEY (exam_id) REFERENCES online_exams(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='考试记录表'
    `);
    console.log('✅ 成功创建 online_exam_records 表');

    // 创建 online_exam_answers 表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS online_exam_answers (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        record_id BIGINT UNSIGNED NOT NULL COMMENT '考试记录ID',
        exam_id BIGINT UNSIGNED NOT NULL COMMENT '考试ID',
        user_id BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
        question_id VARCHAR(50) NOT NULL COMMENT '题目ID',
        user_answer TEXT COMMENT '用户答案',
        is_correct TINYINT(1) DEFAULT NULL COMMENT '是否正确：0=错误，1=正确，NULL=未评分',
        score DECIMAL(5,2) DEFAULT 0 COMMENT '得分',
        answer_time INT UNSIGNED COMMENT '答题用时（秒）',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_record_question (record_id, question_id),
        INDEX idx_record_id (record_id),
        INDEX idx_exam_id (exam_id),
        INDEX idx_user_id (user_id),
        INDEX idx_question_id (question_id),
        FOREIGN KEY (record_id) REFERENCES online_exam_records(id) ON DELETE CASCADE,
        FOREIGN KEY (exam_id) REFERENCES online_exams(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='考试答案表'
    `);
    console.log('✅ 成功创建 online_exam_answers 表');

    // 创建 online_exam_rankings 表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS online_exam_rankings (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        exam_id BIGINT UNSIGNED NOT NULL COMMENT '考试ID',
        user_id BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
        total_score DECIMAL(5,2) DEFAULT 0 COMMENT '总分',
        duration INT UNSIGNED COMMENT '用时（秒）',
        user_rank INT UNSIGNED COMMENT '排名',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_exam_user (exam_id, user_id),
        INDEX idx_exam_id (exam_id),
        INDEX idx_user_rank (exam_id, user_rank),
        FOREIGN KEY (exam_id) REFERENCES online_exams(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='考试排名表'
    `);
    console.log('✅ 成功创建 online_exam_rankings 表');

    // 创建 online_exam_statistics 表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS online_exam_statistics (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        exam_id BIGINT UNSIGNED NOT NULL COMMENT '考试ID',
        total_participants INT UNSIGNED DEFAULT 0 COMMENT '总参与人数',
        submitted_count INT UNSIGNED DEFAULT 0 COMMENT '已提交人数',
        graded_count INT UNSIGNED DEFAULT 0 COMMENT '已评分人数',
        average_score DECIMAL(5,2) DEFAULT 0 COMMENT '平均分',
        highest_score DECIMAL(5,2) DEFAULT 0 COMMENT '最高分',
        lowest_score DECIMAL(5,2) DEFAULT 0 COMMENT '最低分',
        pass_count INT UNSIGNED DEFAULT 0 COMMENT '及格人数',
        pass_rate DECIMAL(5,2) DEFAULT 0 COMMENT '及格率（%）',
        score_distribution JSON COMMENT '分数段分布',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_exam_id (exam_id),
        FOREIGN KEY (exam_id) REFERENCES online_exams(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='考试统计表'
    `);
    console.log('✅ 成功创建 online_exam_statistics 表');

    // 创建 online_exam_question_analysis 表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS online_exam_question_analysis (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        exam_id BIGINT UNSIGNED NOT NULL COMMENT '考试ID',
        question_id VARCHAR(50) NOT NULL COMMENT '题目ID',
        question_type VARCHAR(50) COMMENT '题目类型',
        question_score DECIMAL(5,2) DEFAULT 0 COMMENT '题目满分',
        sort_order INT UNSIGNED DEFAULT 0 COMMENT '题目顺序',
        total_attempts INT UNSIGNED DEFAULT 0 COMMENT '总答题次数',
        correct_count INT UNSIGNED DEFAULT 0 COMMENT '答对人数',
        wrong_count INT UNSIGNED DEFAULT 0 COMMENT '答错人数',
        unanswered_count INT UNSIGNED DEFAULT 0 COMMENT '未答人数',
        correct_rate DECIMAL(5,2) DEFAULT 0 COMMENT '正确率（%）',
        average_score DECIMAL(5,2) DEFAULT 0 COMMENT '平均得分',
        max_score DECIMAL(5,2) DEFAULT 0 COMMENT '最高得分',
        min_score DECIMAL(5,2) DEFAULT 0 COMMENT '最低得分',
        option_distribution JSON COMMENT '选项分布',
        common_wrong_answers JSON COMMENT '常见错误答案及次数',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_exam_question (exam_id, question_id),
        INDEX idx_exam_id (exam_id),
        INDEX idx_question_id (question_id),
        INDEX idx_correct_rate (exam_id, correct_rate),
        FOREIGN KEY (exam_id) REFERENCES online_exams(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='每题作答分析表'
    `);
    console.log('✅ 成功创建 online_exam_question_analysis 表');

    // 创建 online_exam_user_question_analysis 表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS online_exam_user_question_analysis (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        record_id BIGINT UNSIGNED NOT NULL COMMENT '考试记录ID',
        exam_id BIGINT UNSIGNED NOT NULL COMMENT '考试ID',
        user_id BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
        question_id VARCHAR(50) NOT NULL COMMENT '题目ID',
        user_answer TEXT COMMENT '用户答案',
        is_correct TINYINT(1) DEFAULT NULL COMMENT '是否正确',
        score DECIMAL(5,2) DEFAULT 0 COMMENT '得分',
        answer_time INT UNSIGNED COMMENT '答题用时（秒）',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_record_question (record_id, question_id),
        INDEX idx_record_id (record_id),
        INDEX idx_exam_id (exam_id),
        INDEX idx_user_id (user_id),
        INDEX idx_question_id (question_id),
        FOREIGN KEY (record_id) REFERENCES online_exam_records(id) ON DELETE CASCADE,
        FOREIGN KEY (exam_id) REFERENCES online_exams(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户每题作答记录表'
    `);
    console.log('✅ 成功创建 online_exam_user_question_analysis 表');

    // 启用外键检查
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('\n========================================');
    console.log('数据库修改完成！');
    console.log('========================================');
    
  } catch (error) {
    console.error('❌ 数据库操作失败:', error.message);
    console.error(error.stack);
  } finally {
    await connection.end();
    console.log('\n数据库连接已关闭');
  }
}

updateDatabase();
