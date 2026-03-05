const mysqlPool = require('./config/mysql');

async function fixData() {
  const connection = await mysqlPool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 删除旧教辅（ID 1-5）的数据
    const oldTutorialIds = [1, 2, 3, 4, 5];
    
    for (const tutorialId of oldTutorialIds) {
      console.log(`清理教辅ID=${tutorialId}的数据...`);
      
      // 1. 获取该教辅下的所有题目ID
      const [tutorialQuestions] = await connection.query(
        'SELECT DISTINCT question_id FROM computer1_tutorial_question WHERE tutorial_id = ?',
        [tutorialId]
      );
      const questionIds = tutorialQuestions.map(tq => tq.question_id);
      console.log(`  找到 ${questionIds.length} 个题目关联`);
      
      // 2. 删除题目关联
      await connection.query('DELETE FROM computer1_tutorial_question WHERE tutorial_id = ?', [tutorialId]);
      
      // 3. 删除章节
      await connection.query('DELETE FROM computer1_tutorial_chapter WHERE tutorial_id = ?', [tutorialId]);
      
      // 4. 删除教辅
      await connection.query('DELETE FROM computer1_tutorial WHERE id = ?', [tutorialId]);
      
      // 5. 级联删除题目及其相关数据
      if (questionIds.length > 0) {
        // 删除选项
        await connection.query(
          'DELETE FROM computer1_question_option WHERE question_id IN (?)',
          [questionIds]
        );
        
        // 删除小题
        await connection.query(
          'DELETE FROM computer1_question_sub WHERE question_id IN (?)',
          [questionIds]
        );
        
        // 删除考点关联
        await connection.query(
          'DELETE FROM computer1_question_tag_relation WHERE question_id IN (?)',
          [questionIds]
        );
        
        // 删除题目
        await connection.query(
          'DELETE FROM computer1_question WHERE question_id IN (?)',
          [questionIds]
        );
        
        console.log(`  已删除 ${questionIds.length} 个题目及其关联数据`);
      }
    }
    
    await connection.commit();
    console.log('\n旧教辅数据清理完成！');
    
  } catch (err) {
    await connection.rollback();
    console.error('错误:', err);
  } finally {
    connection.release();
    process.exit(0);
  }
}

fixData();
