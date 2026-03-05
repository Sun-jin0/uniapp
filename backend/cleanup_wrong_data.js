const mysqlPool = require('./config/mysql');

async function cleanup() {
  const connection = await mysqlPool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 删除ID 10-13的错误导入数据
    const wrongIds = [10, 11, 12, 13];
    
    for (const tutorialId of wrongIds) {
      console.log(`清理教辅ID=${tutorialId}的数据...`);
      
      // 1. 获取该教辅下的所有题目ID
      const [tutorialQuestions] = await connection.query(
        'SELECT DISTINCT question_id FROM computer1_tutorial_question WHERE tutorial_id = ?',
        [tutorialId]
      );
      const questionIds = tutorialQuestions.map(tq => tq.question_id);
      
      // 2. 删除题目关联
      await connection.query('DELETE FROM computer1_tutorial_question WHERE tutorial_id = ?', [tutorialId]);
      
      // 3. 删除章节
      await connection.query('DELETE FROM computer1_tutorial_chapter WHERE tutorial_id = ?', [tutorialId]);
      
      // 4. 删除教辅
      await connection.query('DELETE FROM computer1_tutorial WHERE id = ?', [tutorialId]);
      
      // 5. 级联删除题目及其相关数据
      if (questionIds.length > 0) {
        await connection.query('DELETE FROM computer1_question_option WHERE question_id IN (?)', [questionIds]);
        await connection.query('DELETE FROM computer1_question_sub WHERE question_id IN (?)', [questionIds]);
        await connection.query('DELETE FROM computer1_question_tag_relation WHERE question_id IN (?)', [questionIds]);
        await connection.query('DELETE FROM computer1_question WHERE question_id IN (?)', [questionIds]);
        console.log(`  已删除 ${questionIds.length} 个题目`);
      } else {
        console.log(`  没有题目需要删除`);
      }
    }
    
    await connection.commit();
    console.log('\n错误数据清理完成！');
    
  } catch (err) {
    await connection.rollback();
    console.error('错误:', err);
  } finally {
    connection.release();
    process.exit(0);
  }
}

cleanup();
