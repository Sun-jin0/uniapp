# 创建候选人照片表
# 设计思路：
# 1. 一个候选人可以有多张照片（主照片、生活照等）
# 2. 使用 photo_type 区分照片类型
# 3. is_primary 标记主展示照片
# 4. 支持排序，控制照片展示顺序
class CreateCandidatePhotos < ActiveRecord::Migration[7.0]
  def change
    create_table :candidate_photos do |t|
      t.references :candidate, null: false, foreign_key: true, comment: '关联候选人'
      t.string :photo_type, default: 'gallery', null: false, comment: '照片类型：primary-主照片, gallery-相册照片'
      t.boolean :is_primary, default: false, null: false, comment: '是否为主照片'
      t.integer :display_order, default: 0, null: false, comment: '展示顺序'
      t.string :file_path, null: false, comment: '文件路径'
      t.string :file_name, null: false, comment: '原始文件名'
      t.integer :file_size, comment: '文件大小（字节）'
      t.string :mime_type, comment: 'MIME类型'
      t.integer :width, comment: '图片宽度'
      t.integer :height, comment: '图片高度'

      t.timestamps
    end

    # 候选人索引
    add_index :candidate_photos, :candidate_id
    # 照片类型索引
    add_index :candidate_photos, :photo_type
    # 主照片索引，快速查询候选人的主照片
    add_index :candidate_photos, [:candidate_id, :is_primary]
    # 展示顺序索引
    add_index :candidate_photos, [:candidate_id, :display_order]
  end
end
