const mysqlPool = require('../config/mysql');

async function check() {
  try {
    const [chapters] = await mysqlPool.query('SELECT * FROM computer1_tutorial_chapter WHERE tutorial_id = 10 ORDER BY level, sort_order');
    console.log('章节数量:', chapters.length);
    chapters.forEach(c => {
      console.log('ID:', c.id, 'Name:', c.name, 'Level:', c.level, 'Parent:', c.parent_id);
    });
  } catch (error) {
    console.error('错误:', error);
  } finally {
    process.exit(0);
  }
}

check();
