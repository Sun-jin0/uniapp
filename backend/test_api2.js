const mysqlPool = require('./config/mysql');

async function testAPI() {
  try {
    // 测试获取章节ID 235 的题目（1.1 操作系统的基本概念）
    const chapterId = 235;
    
    console.log(`=== 获取章节ID=${chapterId}的题目 ===`);
    
    // 先获取关联的题目ID列表
    const [links] = await mysqlPool.query(
      'SELECT question_id FROM computer1_tutorial_question WHERE chapter_id = ? ORDER BY sort_order ASC',
      [chapterId]
    );
    
    console.log(`找到 ${links.length} 个题目关联`);
    
    if (links.length === 0) {
      console.log('没有题目关联');
      return;
    }
    
    const questionIds = links.map(l => l.question_id);
    console.log(`题目ID列表: ${questionIds.slice(0, 5).join(', ')}...`);
    
    // 获取题目详情
    const [questions] = await mysqlPool.query(
      'SELECT question_id, exercise_type_name, stem FROM computer1_question WHERE question_id IN (?)',
      [questionIds]
    );
    
    console.log(`\n找到 ${questions.length} 个题目详情`);
    
    questions.slice(0, 3).forEach(q => {
      console.log(`  - ${q.question_id}: [${q.exercise_type_name}] ${q.stem.substring(0, 50)}...`);
    });
    
  } catch (err) {
    console.error('错误:', err);
  } finally {
    process.exit(0);
  }
}

testAPI();
