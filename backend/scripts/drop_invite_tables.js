/**
 * 删除邀请系统相关数据表
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.MYSQL_HOST || '139.199.9.132',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'quizmaster',
  port: process.env.MYSQL_PORT || 3306
};

async function dropInviteTables() {
  let connection;
  
  try {
    console.log('连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功！\n');

    // 删除外键约束（如果存在）
    console.log('1. 删除外键约束...');
    try {
      await connection.execute(`
        ALTER TABLE invite_records DROP FOREIGN KEY IF EXISTS fk_inviter
      `);
      console.log('   - 已删除 fk_inviter 外键');
    } catch (e) {
      console.log('   - fk_inviter 外键不存在或已删除');
    }

    try {
      await connection.execute(`
        ALTER TABLE invite_records DROP FOREIGN KEY IF EXISTS fk_invitee
      `);
      console.log('   - 已删除 fk_invitee 外键');
    } catch (e) {
      console.log('   - fk_invitee 外键不存在或已删除');
    }

    // 删除 invite_records 表
    console.log('\n2. 删除 invite_records 表...');
    try {
      await connection.execute('DROP TABLE IF EXISTS invite_records');
      console.log('   ✓ invite_records 表已删除');
    } catch (error) {
      console.error('   ✗ 删除 invite_records 表失败:', error.message);
    }

    // 删除 user_invites 表
    console.log('\n3. 删除 user_invites 表...');
    try {
      await connection.execute('DROP TABLE IF EXISTS user_invites');
      console.log('   ✓ user_invites 表已删除');
    } catch (error) {
      console.error('   ✗ 删除 user_invites 表失败:', error.message);
    }

    console.log('\n========================================');
    console.log('邀请系统数据表删除完成！');
    console.log('========================================');

  } catch (error) {
    console.error('执行失败:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n数据库连接已关闭');
    }
  }
}

// 执行删除
dropInviteTables();
