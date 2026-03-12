# 投票记录模型
# 设计思路：
# 1. 确保一人一票：使用数据库唯一索引约束 voter_id
# 2. 支持撤销投票：使用软删除，保留审计记录
# 3. 记录投票环境信息：IP地址、User-Agent，用于防作弊审计
# 4. 投票时自动更新候选人的票数缓存
# 5. 使用事务确保数据一致性
class Vote < ApplicationRecord

  # 关联关系
  belongs_to :voter
  belongs_to :candidate

  # 数据验证
  validates :voter_id, presence: true
  validates :candidate_id, presence: true
  validates :ip_address, presence: true
  
  # 自定义验证：一人一票（排除已撤销的投票）
  validate :voter_can_only_vote_once

  # 自定义验证
  validate :voter_must_be_verified
  validate :candidate_must_be_votable
  validate :voting_must_be_open

  # 回调函数
  after_create :update_candidate_vote_count

  # 作用域
  scope :not_deleted, -> { where(deleted_at: nil) }
  scope :for_candidate, ->(candidate_id) { where(candidate_id: candidate_id) }
  scope :recent, -> { order(created_at: :desc) }
  scope :today, -> { where(created_at: Time.current.beginning_of_day..Time.current.end_of_day) }

  # 实例方法

  # 撤销投票（软删除）
  def revoke!
    update_column(:deleted_at, Time.current)
    update_candidate_vote_count
  end

  # 检查是否可以撤销（投票后24小时内）
  def revocable?
    created_at > 24.hours.ago
  end

  # 类方法

  # 获取总投票数
  def self.total_count
    not_deleted.count
  end

  # 获取今日投票数
  def self.today_count
    today.count
  end

  # 获取候选人票数统计
  def self.statistics_by_candidate
    not_deleted
      .group(:candidate_id)
      .count
  end

  private

  # 验证一人一票（排除已撤销的投票）
  def voter_can_only_vote_once
    return unless voter_id.present?
    
    existing_vote = Vote.where(voter_id: voter_id, deleted_at: nil).where.not(id: id).first
    if existing_vote
      errors.add(:voter, '您已经投过票了')
    end
  end

  # 验证选民是否已验证
  def voter_must_be_verified
    return if voter&.phone_verified?

    errors.add(:voter, '请先验证手机号后再投票')
  end

  # 验证候选人是否可投票
  def candidate_must_be_votable
    return if candidate&.votable?

    errors.add(:candidate, '该候选人当前不可投票')
  end

  # 验证投票是否开放
  def voting_must_be_open
    session = candidate&.contest_session
    return unless session

    unless session.ongoing?
      errors.add(:base, '投票尚未开始或已结束')
    end
  end

  # 更新候选人票数缓存
  def update_candidate_vote_count
    candidate&.refresh_vote_count_cache
  end
end
