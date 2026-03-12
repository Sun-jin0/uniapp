# 创建候选人表
# 设计思路：
# 1. 存储候选人的基本信息、照片和描述
# 2. 使用 status 字段管理候选人状态（待审核、已通过、已淘汰）
# 3. candidate_number 是候选人的参赛编号，用于展示
# 4. 软删除设计：使用 deleted_at 而不是物理删除，保留历史数据
# 5. 照片使用 Active Storage 存储，这里只保存元数据
class CreateCandidates < ActiveRecord::Migration[7.0]
  def change
    create_table :candidates do |t|
      t.string :candidate_number, null: false, comment: '候选人参赛编号'
      t.string :name, null: false, comment: '姓名'
      t.integer :age, null: false, comment: '年龄'
      t.text :description, null: false, comment: '个人描述/简介'
      t.string :status, default: 'pending', null: false, comment: '状态：pending-待审核, approved-已通过, eliminated-已淘汰'
      t.datetime :approved_at, comment: '审核通过时间'
      t.integer :display_order, default: 0, null: false, comment: '展示顺序，用于排序'
      t.datetime :deleted_at, comment: '软删除时间'

      t.timestamps
    end

    # 参赛编号唯一索引
    add_index :candidates, :candidate_number, unique: true
    # 状态索引，用于筛选可投票的候选人
    add_index :candidates, :status
    # 展示顺序索引，用于列表排序
    add_index :candidates, :display_order
    # 软删除索引，用于排除已删除记录
    add_index :candidates, :deleted_at
    # 复合索引：状态+展示顺序，优化候选人列表查询
    add_index :candidates, [:status, :display_order]
  end
end
