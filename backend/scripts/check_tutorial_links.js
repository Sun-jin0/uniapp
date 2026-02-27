const mysqlPool = require('../config/mysql');

async function checkTutorialLinks() {
  try {
    // 查看每个教辅的详细统计
    const [tutorials] = await mysqlPool.query('SELECT id, name, total_questions FROM computer1_tutorial ORDER BY id DESC LIMIT 4');
    
    for (const t of tutorials) {
      // 查询章节数
      const [chapterCount] = await mysqlPool.query(
        'SELECT COUNT(*) as count FROM computer1_tutorial_chapter WHERE tutorial_id = ? AND level = 1',
        [t.id]
      );
      
      // 查询小节数
      const [sectionCount] = await mysqlPool.query(
        'SELECT COUNT(*) as count FROM computer1_tutorial_chapter WHERE tutorial_id = ? AND level = 2',
        [t.id]
      );
      
      // 查询关联数
      const [linkCount] = await mysqlPool.query(
        'SELECT COUNT(*) as count FROM computer1_tutorial_question WHERE tutorial_id = ?',
        [t.id]
      );
      
      // 查询唯一题目数
      const [uniqueCount] = await mysqlPool.query(
        'SELECT COUNT(DISTINCT question_id) as count FROM computer1_tutorial_question WHERE tutorial_id = ?',
        [t.id]
      );
      
      console.log(`${t.name}:`);
      console.log(`  章数: ${chapterCount[0].count}`);
      console.log(`  小节数: ${sectionCount[0].count}`);
      console.log(`  关联数: ${linkCount[0].count}`);
      console.log(`  唯一题目数: ${uniqueCount[0].count}`);
      console.log(`  total_questions: ${t.total_questions}`);
      console.log('');
    }
    
  } catch (error) {
    console.error('查询失败:', error.message);
  } finally {
    process.exit(0);
  }
}

checkTutorialLinks();
