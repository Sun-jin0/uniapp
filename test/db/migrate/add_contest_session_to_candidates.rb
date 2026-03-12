# 添加赛事届次关联到候选人表
# 设计思路：
# 1. 候选人必须属于某一届赛事
# 2. 使用外键确保数据完整性
# 3. 添加复合索引优化按届次查询候选人
class AddContestSessionToCandidates < ActiveRecord::Migration[7.0]
  def change
    add_reference :candidates, :contest_session, null: false, foreign_key: true, comment: '关联赛事届次'
    
    # 复合索引：赛事+状态+展示顺序，优化候选人列表查询
    add_index :candidates, [:contest_session_id, :status, :display_order], name: 'index_candidates_on_session_status_order'
  end
end
