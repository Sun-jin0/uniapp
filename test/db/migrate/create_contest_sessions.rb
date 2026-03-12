# 创建赛事届次表
# 设计思路：
# 1. 支持多届赛事管理，每届有独立的开始/结束时间
# 2. 使用 status 字段管理赛事状态（未开始、进行中、已结束）
# 3. 记录每届赛事的投票规则（每人可投票数等）
# 4. 当前届次使用 is_current 标记，方便快速查询
class CreateContestSessions < ActiveRecord::Migration[7.0]
  def change
    create_table :contest_sessions do |t|
      t.string :name, null: false, comment: '赛事名称，如：2024香港小姐竞选'
      t.string :year, null: false, comment: '赛事年份'
      t.text :description, comment: '赛事描述'
      t.datetime :registration_start_at, null: false, comment: '报名开始时间'
      t.datetime :registration_end_at, null: false, comment: '报名结束时间'
      t.datetime :voting_start_at, null: false, comment: '投票开始时间'
      t.datetime :voting_end_at, null: false, comment: '投票结束时间'
      t.string :status, default: 'upcoming', null: false, comment: '状态：upcoming-未开始, ongoing-进行中, completed-已结束'
      t.boolean :is_current, default: false, null: false, comment: '是否为当前届次'
      t.integer :max_votes_per_voter, default: 1, null: false, comment: '每个选民最多可投票数'

      t.timestamps
    end

    # 年份唯一索引
    add_index :contest_sessions, :year, unique: true
    # 状态索引
    add_index :contest_sessions, :status
    # 当前届次索引
    add_index :contest_sessions, :is_current
    # 投票时间索引，用于查询进行中的赛事
    add_index :contest_sessions, [:voting_start_at, :voting_end_at]
  end
end
