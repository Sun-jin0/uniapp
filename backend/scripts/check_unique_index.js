const mysqlPool = require('../config/mysql');

async function checkUniqueIndex() {
  try {
    // 查看 computer1_tutorial_question 表的索引
    const [indexes] = await mysqlPool.query(`
      SHOW INDEX FROM computer1_tutorial_question
    `);
    
    console.log('computer1_tutorial_question 表的索引:');
    console.log('================');
    indexes.forEach(idx => {
      console.log(`名称: ${idx.Key_name}, 列: ${idx.Column_name}, 唯一: ${idx.Non_unique === 0 ? '是' : '否'}`);
    });
    
    // 查看是否有重复数据
    const [duplicates] = await mysqlPool.query(`
      SELECT tutorial_id, chapter_id, question_id, COUNT(*) as cnt
      FROM computer1_tutorial_question
      GROUP BY tutorial_id, chapter_id, question_id
      HAVING cnt > 1
      LIMIT 10
    `);
    
    console.log('\n重复数据:');
    console.log('================');
    if (duplicates.length === 0) {
      console.log('没有重复数据');
    } else {
      duplicates.forEach(d => {
        console.log(`tutorial=${d.tutorial_id}, chapter=${d.chapter_id}, question=${d.question_id}, 次数=${d.cnt}`);
      });
    }
    
  } catch (error) {
    console.error('查询失败:', error.message);
  } finally {
    process.exit(0);
  }
}

checkUniqueIndex();
