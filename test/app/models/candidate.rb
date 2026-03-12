# 候选人模型
# 设计思路：
# 1. 使用状态机管理候选人生命周期（待审核 -> 已通过 -> 已淘汰）
# 2. 关联多张照片，支持主照片和相册照片
# 3. 计算属性：vote_count 缓存票数，避免频繁COUNT查询
# 4. 软删除支持，保留历史候选人数据
# 5. 使用 contest_session 支持多届赛事
class Candidate < ApplicationRecord

  # 枚举定义
  enum status: {
    pending: 'pending',     # 待审核
    approved: 'approved',   # 已通过
    eliminated: 'eliminated' # 已淘汰
  }, _prefix: true

  # 关联关系
  belongs_to :contest_session
  has_many :votes, dependent: :destroy
  has_many :candidate_photos, dependent: :destroy
  has_one :primary_photo, -> { where(is_primary: true) }, class_name: 'CandidatePhoto', dependent: :destroy

  # 数据验证
  validates :candidate_number, presence: true, uniqueness: true
  validates :name, presence: true, length: { minimum: 2, maximum: 50 }
  validates :age, presence: true, numericality: { 
    only_integer: true, 
    greater_than_or_equal_to: 18, 
    less_than_or_equal_to: 28,
    message: '年龄必须在18-28岁之间'
  }
  validates :description, presence: true, length: { minimum: 10, maximum: 2000 }
  validates :status, inclusion: { in: statuses.keys }
  validates :display_order, numericality: { only_integer: true }

  # 回调函数
  before_validation :generate_candidate_number, on: :create
  after_update :update_approved_at, if: :saved_change_to_status?

  # 作用域
  scope :approved, -> { where(status: 'approved') }
  scope :by_display_order, -> { order(display_order: :asc, created_at: :asc) }
  scope :for_session, ->(session_id) { where(contest_session_id: session_id) }

  # 实例方法

  # 获取票数（使用缓存或实时计算）
  def vote_count
    Rails.cache.fetch("candidate_#{id}_vote_count", expires_in: 5.minutes) do
      votes.not_deleted.count
    end
  end

  # 刷新票数缓存
  def refresh_vote_count_cache
    Rails.cache.delete("candidate_#{id}_vote_count")
    vote_count
  end

  # 获取主照片URL
  def primary_photo_url
    primary_photo&.url || candidate_photos.first&.url
  end

  # 获取所有照片URL列表
  def photo_urls
    candidate_photos.order(display_order: :asc).map(&:url)
  end

  # 检查是否可投票（已审核通过且未淘汰）
  def votable?
    status_approved?
  end

  # 审核通过
  def approve!
    update!(status: 'approved', approved_at: Time.current)
  end

  # 淘汰
  def eliminate!
    update!(status: 'eliminated')
  end

  # 类方法

  # 获取当前届次的候选人
  def self.current_session
    for_session(ContestSession.current&.id)
  end

  # 按票数排序
  def self.by_votes
    select('candidates.*, COUNT(votes.id) as votes_count')
      .left_joins(:votes)
      .where(votes: { deleted_at: nil })
      .group('candidates.id')
      .order('votes_count DESC')
  end

  private

  # 生成候选编号
  def generate_candidate_number
    return if candidate_number.present?

    # 格式：年份 + 序号，如 2024001
    year = contest_session&.year || Time.current.year
    last_number = Candidate.where('candidate_number LIKE ?', "#{year}%")
                          .maximum(:candidate_number)
    
    if last_number
      seq = last_number[-3..-1].to_i + 1
    else
      seq = 1
    end
    
    self.candidate_number = "#{year}#{seq.to_s.rjust(3, '0')}"
  end

  # 更新审核通过时间
  def update_approved_at
    if status_approved? && approved_at.nil?
      update_column(:approved_at, Time.current)
    end
  end
end
