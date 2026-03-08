const pool = require('../config/mysql');

async function addLevelGeneratedColumn() {
  try {
    // 检查 level 列是否存在
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'level'
    `);

    if (columns.length > 0) {
      // level 列已存在，先删除它
      console.log('删除现有的 level 列...');
      await pool.query('ALTER TABLE users DROP COLUMN level');
    }

    // 添加生成列
    console.log('添加 level 生成列...');
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN level INT GENERATED ALWAYS AS (
        CASE 
          WHEN total_questions < 200 THEN FLOOR(total_questions / 20) + 1
          ELSE 10 + FLOOR((total_questions - 200) / 50)
        END
      ) STORED
    `);

    console.log('成功添加 level 生成列！');
    console.log('等级将根据 total_questions 自动计算：');
    console.log('- 10级以前：每20题加1级');
    console.log('- 超过10级：每50题加1级');

    // 验证
    const [users] = await pool.query('SELECT id, total_questions, level FROM users ORDER BY total_questions DESC LIMIT 5');
    console.log('\n示例数据：');
    users.forEach(u => {
      console.log(`用户 ${u.id}: 答题数=${u.total_questions}, 等级=${u.level}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('添加生成列失败:', error);
    process.exit(1);
  }
}

addLevelGeneratedColumn();
