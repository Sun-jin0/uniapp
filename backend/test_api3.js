const mysqlPool = require('./config/mysql');

async function testAPI() {
  try {
    // 检查题目是否存在
    const questionId = '177186098935465p5uzss6';
    
    console.log(`=== 检查题目ID=${questionId} ===`);
    
    const [questions] = await mysqlPool.query(
      'SELECT question_id, exercise_type_name, stem FROM computer1_question WHERE question_id = ?',
      [questionId]
    );
    
    console.log(`找到 ${questions.length} 个题目`);
    
    if (questions.length > 0) {
      console.log('题目存在:', questions[0]);
    } else {
      console.log('题目不存在！');
      
      // 检查所有题目ID的前缀
      const [allQuestions] = await mysqlPool.query(
        'SELECT question_id FROM computer1_question LIMIT 5'
      );
      console.log('\n示例题目ID:');
      allQuestions.forEach(q => console.log(`  ${q.question_id}`));
    }
    
  } catch (err) {
    console.error('错误:', err);
  } finally {
    process.exit(0);
  }
}

testAPI();
