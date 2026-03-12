# 候选人照片模型
# 设计思路：
# 1. 支持一个候选人有多张照片（主照片 + 相册）
# 2. 使用 Active Storage 或自定义文件存储
# 3. is_primary 标记主照片，每个候选人只能有一张主照片
# 4. 记录图片元数据（尺寸、大小等）用于前端展示优化
# 5. 使用回调确保只有一个主照片
class CandidatePhoto < ApplicationRecord
  # 关联关系
  belongs_to :candidate

  # 枚举定义
  enum photo_type: {
    primary: 'primary',   # 主照片
    gallery: 'gallery'    # 相册照片
  }, _prefix: true

  # 数据验证
  validates :candidate_id, presence: true
  validates :file_path, presence: true
  validates :file_name, presence: true
  validates :photo_type, inclusion: { in: photo_types.keys }
  validates :display_order, numericality: { only_integer: true }

  # 图片尺寸验证（如果使用 Active Storage）
  # validates :image, content_type: ['image/png', 'image/jpg', 'image/jpeg']
  # validates :image, size: { less_than: 5.megabytes }

  # 回调函数
  after_save :ensure_single_primary_photo, if: :saved_change_to_is_primary?
  before_validation :set_default_photo_type

  # 作用域
  scope :primary_only, -> { where(is_primary: true) }
  scope :gallery_only, -> { where(photo_type: 'gallery') }
  scope :ordered, -> { order(display_order: :asc, created_at: :asc) }

  # 实例方法

  # 获取完整URL
  def url
    # 根据实际存储方式返回URL
    # 如果使用 Active Storage: Rails.application.routes.url_helpers.rails_blob_url(image)
    # 如果使用本地存储或云存储
    asset_host = ENV.fetch('ASSET_HOST', 'http://localhost:3000')
    "#{asset_host}/#{file_path}"
  end

  # 获取缩略图URL
  def thumbnail_url
    # 假设有缩略图处理
    asset_host = ENV.fetch('ASSET_HOST', 'http://localhost:3000')
    "#{asset_host}/thumbnails/#{file_path}"
  end

  # 设置为主照片
  def set_as_primary!
    update!(is_primary: true, photo_type: 'primary')
  end

  # 检查是否为主照片
  def primary?
    is_primary?
  end

  # 类方法

  # 获取候选人的主照片
  def self.primary_for(candidate_id)
    find_by(candidate_id: candidate_id, is_primary: true)
  end

  private

  # 确保只有一个主照片
  def ensure_single_primary_photo
    return unless is_primary?

    # 将该候选人的其他照片设为非主照片
    candidate.candidate_photos
             .where.not(id: id)
             .where(is_primary: true)
             .update_all(is_primary: false, photo_type: 'gallery')
  end

  # 设置默认照片类型
  def set_default_photo_type
    self.photo_type = is_primary? ? 'primary' : 'gallery' if photo_type.blank?
  end
end
