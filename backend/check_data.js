const mysqlPool = require('./config/mysql');

async function checkData() {
  try {
    // 查看所有教辅
    const [tutorials] = await mysqlPool.query('SELECT id, name, subject, total_questions FROM computer1_tutorial ORDER BY id DESC LIMIT 10');
    console.log('=== 教辅列表 ===');
    tutorials.forEach(t => {
      console.log(`ID: ${t.id}, 名称: ${t.name}, 科目: ${t.subject}, 题目数: ${t.total_questions}`);
    });
    
    // 查看ID为4的教辅章节
    console.log('\n=== 教辅ID=4的章节 ===');
    const [chapters] = await mysqlPool.query('SELECT id, name, level, parent_id, question_count FROM computer1_tutorial_chapter WHERE tutorial_id = 4 ORDER BY id');
    chapters.forEach(c => {
      console.log(`ID: ${c.id}, 名称: ${c.name}, level: ${c.level}, parent_id: ${c.parent_id}, 题目数: ${c.question_count}`);
    });
    
    // 查看题目关联
    console.log('\n=== 教辅ID=4的题目关联 ===');
    const [links] = await mysqlPool.query('SELECT chapter_id, COUNT(*) as count FROM computer1_tutorial_question WHERE tutorial_id = 4 GROUP BY chapter_id');
    links.forEach(l => {
      console.log(`章节ID: ${l.chapter_id}, 题目数: ${l.count}`);
    });
    
  } catch (err) {
    console.error('错误:', err);
  } finally {
    process.exit(0);
  }
}

checkData();
