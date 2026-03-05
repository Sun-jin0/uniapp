const mysqlPool = require('./config/mysql');

async function checkData() {
  try {
    // 查看最新的教辅
    const [tutorials] = await mysqlPool.query('SELECT id, name, subject, total_questions FROM computer1_tutorial ORDER BY id DESC LIMIT 5');
    console.log('=== 最新教辅列表 ===');
    tutorials.forEach(t => {
      console.log(`ID: ${t.id}, 名称: ${t.name}, 题目数: ${t.total_questions}`);
    });
    
    // 查看最新教辅的章节
    if (tutorials.length > 0) {
      const latestId = tutorials[0].id;
      console.log(`\n=== 教辅ID=${latestId}的章节 ===`);
      const [chapters] = await mysqlPool.query('SELECT id, name, level, parent_id, question_count FROM computer1_tutorial_chapter WHERE tutorial_id = ? ORDER BY id', [latestId]);
      chapters.forEach(c => {
        console.log(`ID: ${c.id}, 名称: ${c.name}, level: ${c.level}, parent_id: ${c.parent_id}, 题目数: ${c.question_count}`);
      });
      
      // 查看题目关联
      console.log('\n=== 题目关联 ===');
      const [links] = await mysqlPool.query('SELECT chapter_id, COUNT(*) as count FROM computer1_tutorial_question WHERE tutorial_id = ? GROUP BY chapter_id', [latestId]);
      links.forEach(l => {
        console.log(`章节ID: ${l.chapter_id}, 题目数: ${l.count}`);
      });
    }
    
  } catch (err) {
    console.error('错误:', err);
  } finally {
    process.exit(0);
  }
}

checkData();
