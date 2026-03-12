# 赛事届次模型
# 设计思路：
# 1. 支持多届赛事管理，每届独立配置投票规则
# 2. 使用状态机自动计算赛事状态（根据时间自动判断）
# 3. is_current 标记当前届次，确保只有一个当前届次
# 4. 关联候选人和投票，方便按届次统计
# 5. 使用回调函数确保只有一个当前届次
class ContestSession < ApplicationRecord
  # 枚举定义
  enum status: {
    upcoming: 'upcoming',   # 未开始
    ongoing: 'ongoing',     # 进行中
    completed: 'completed'  # 已结束
  }, _prefix: true

  # 关联关系
  has_many :candidates, dependent: :destroy
  has_many :votes, through: :candidates

  # 数据验证
  validates :name, presence: true, length: { minimum: 5, maximum: 100 }
  validates :year, presence: true, uniqueness: true,
            format: { with: /\A20\d{2}\z/, message: '年份格式不正确' }
  validates :registration_start_at, presence: true
  validates :registration_end_at, presence: true
  validates :voting_start_at, presence: true
  validates :voting_end_at, presence: true
  validates :max_votes_per_voter, presence: true, numericality: { greater_than: 0 }
  validates :status, inclusion: { in: statuses.keys }

  # 时间顺序验证
  validate :registration_end_after_start
  validate :voting_end_after_start
  validate :voting_after_registration

  # 回调函数
  before_validation :set_status_from_dates
  after_save :ensure_single_current_session, if: :is_current?

  # 作用域
  scope :by_year, -> { order(year: :desc) }
  scope :active, -> { where(status: ['upcoming', 'ongoing']) }

  # 类方法

  # 获取当前届次
  def self.current
    find_by(is_current: true)
  end

  # 实例方法

  # 更新状态（根据当前时间）
  def refresh_status!
    set_status_from_dates
    save! if status_changed?
  end

  # 检查报名是否开放
  def registration_open?
    Time.current.between?(registration_start_at, registration_end_at)
  end

  # 检查投票是否开放
  def voting_open?
    Time.current.between?(voting_start_at, voting_end_at)
  end

  # 获取已审核通过的候选人数量
  def approved_candidates_count
    candidates.approved.count
  end

  # 获取总投票数
  def total_votes_count
    votes.not_deleted.count
  end

  # 获取参与投票的选民数
  def voters_count
    votes.not_deleted.distinct.count(:voter_id)
  end

  # 获取排名前几的候选人
  def top_candidates(limit = 10)
    candidates
      .approved
      .select('candidates.*, COUNT(votes.id) as vote_count')
      .left_joins(:votes)
      .where(votes: { deleted_at: nil })
      .group('candidates.id')
      .order('vote_count DESC, candidates.display_order ASC')
      .limit(limit)
  end

  # 检查是否可以设为当前届次
  def can_be_current?
    upcoming? || ongoing?
  end

  # 设为当前届次
  def set_as_current!
    return false unless can_be_current?

    update!(is_current: true)
  end

  private

  # 根据日期设置状态
  def set_status_from_dates
    now = Time.current

    if now < voting_start_at
      self.status = 'upcoming'
    elsif now <= voting_end_at
      self.status = 'ongoing'
    else
      self.status = 'completed'
    end
  end

  # 确保只有一个当前届次
  def ensure_single_current_session
    ContestSession.where(is_current: true).where.not(id: id).update_all(is_current: false)
  end

  # 验证报名结束时间在开始时间之后
  def registration_end_after_start
    return unless registration_start_at && registration_end_at

    if registration_end_at <= registration_start_at
      errors.add(:registration_end_at, '报名结束时间必须在开始时间之后')
    end
  end

  # 验证投票结束时间在开始时间之后
  def voting_end_after_start
    return unless voting_start_at && voting_end_at

    if voting_end_at <= voting_start_at
      errors.add(:voting_end_at, '投票结束时间必须在开始时间之后')
    end
  end

  # 验证投票时间在报名结束之后
  def voting_after_registration
    return unless registration_end_at && voting_start_at

    if voting_start_at < registration_end_at
      errors.add(:voting_start_at, '投票开始时间必须在报名结束之后')
    end
  end
end
