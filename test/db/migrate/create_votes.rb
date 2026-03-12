# 创建投票记录表
# 设计思路：
# 1. 记录每个选民的投票行为，确保一人一票的公平性
# 2. 使用外键关联选民和候选人，保证数据完整性
# 3. 添加唯一索引 (voter_id)，确保每个选民只能投一票
# 4. 记录投票时间和IP地址，用于审计和防作弊
# 5. 软删除设计：允许选民在限定时间内撤销投票
class CreateVotes < ActiveRecord::Migration[7.0]
  def change
    create_table :votes do |t|
      t.references :voter, null: false, foreign_key: true, comment: '关联选民'
      t.references :candidate, null: false, foreign_key: true, comment: '关联候选人'
      t.string :ip_address, comment: '投票时的IP地址，用于审计'
      t.string :user_agent, comment: '浏览器/User-Agent信息'
      t.datetime :deleted_at, comment: '撤销投票时间（软删除）'

      t.timestamps
    end

    # 唯一索引：每个选民只能投一票（只针对未撤销的投票）
    # 使用条件唯一索引，允许撤销后重新投票
    add_index :votes, :voter_id, unique: true, where: 'deleted_at IS NULL'
    # 候选人索引，用于统计票数
    add_index :votes, :candidate_id
    # 复合索引：候选人+创建时间，用于查询某候选人的投票时间分布
    add_index :votes, [:candidate_id, :created_at]
    # 软删除索引
    add_index :votes, :deleted_at
    # IP地址索引，用于检测异常投票行为
    add_index :votes, :ip_address
  end
end
