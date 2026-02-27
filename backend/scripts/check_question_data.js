const mysqlPool = require('../config/mysql');

async function checkQuestionData() {
  try {
    // 获取最近导入的题目
    const [questions] = await mysqlPool.query(
      'SELECT question_id, exercise_type_name, stem FROM computer1_question ORDER BY create_time DESC LIMIT 5'
    );
    
    console.log('最近导入的题目:');
    console.log('================');
    for (const q of questions) {
      console.log(`\n题目ID: ${q.question_id}`);
      console.log(`题型: ${q.exercise_type_name}`);
      console.log(`题干: ${q.stem?.substring(0, 50)}...`);
      
      // 检查选项
      const [options] = await mysqlPool.query(
        'SELECT option_key, option_value FROM computer1_question_option WHERE question_id = ? ORDER BY option_sort',
        [q.question_id]
      );
      console.log(`选项数: ${options.length}`);
      if (options.length > 0) {
        options.forEach(opt => {
          console.log(`  ${opt.option_key}: ${opt.option_value?.substring(0, 30)}...`);
        });
      }
      
      // 检查小题
      const [subs] = await mysqlPool.query(
        'SELECT sub_id, stem FROM computer1_question_sub WHERE question_id = ? ORDER BY question_order',
        [q.question_id]
      );
      console.log(`小题数: ${subs.length}`);
      
      // 检查考点
      const [tags] = await mysqlPool.query(
        `SELECT kt.tag_id, kt.tag_name 
         FROM computer1_question_tag_relation r
         JOIN computer1_knowledge_tag kt ON r.tag_id = kt.tag_id
         WHERE r.question_id = ?`,
        [q.question_id]
      );
      console.log(`考点数: ${tags.length}`);
      if (tags.length > 0) {
        tags.forEach(tag => {
          console.log(`  - ${tag.tag_name || tag.tag_id}`);
        });
      }
    }
    
  } catch (error) {
    console.error('查询失败:', error.message);
  } finally {
    process.exit(0);
  }
}

checkQuestionData();
