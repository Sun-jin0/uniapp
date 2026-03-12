# 选民模型
# 设计思路：
# 1. 使用手机号作为登录标识，符合香港地区的使用习惯
# 2. 香港身份证存储哈希值而非明文，保护用户隐私
# 3. 使用 has_secure_token 生成安全的认证令牌
# 4. 实现软删除机制，保留用户历史数据
# 5. 防暴力破解：登录失败多次后锁定账户
class Voter < ApplicationRecord

  # 关联关系
  has_one :vote, dependent: :destroy

  # 数据验证
  validates :phone, presence: true, uniqueness: true,
            format: { with: /\A[0-9]{8}\z/, message: '手机号格式不正确，请输入8位香港手机号' }
  validates :name, presence: true, length: { minimum: 2, maximum: 50 }
  validates :hkid_hash, presence: true, uniqueness: true
  validates :verification_code, length: { is: 6 }, allow_nil: true

  # 安全令牌生成
  has_secure_token :auth_token

  # 回调函数
  before_validation :normalize_phone
  before_create :set_verification_expiry

  # 作用域
  scope :verified, -> { where(phone_verified: true) }
  scope :recent, -> { order(created_at: :desc) }
  scope :locked, -> { where('locked_until > ?', Time.current) }
  scope :not_deleted, -> { where(deleted_at: nil) }

  # 实例方法

  # 检查用户是否已投票
  def voted?
    vote.present? && vote.not_deleted?
  end

  # 获取投票的候选人ID
  def voted_candidate_id
    vote&.candidate_id
  end

  # 验证手机号
  def verify_phone!(code)
    return false if verification_code_expires_at&.past?
    return false if verification_code != code

    update!(
      phone_verified: true,
      verification_code: nil,
      verification_code_expires_at: nil
    )
  end

  # 生成新的验证码
  def generate_verification_code!
    code = sprintf('%06d', rand(999999))
    update!(
      verification_code: code,
      verification_code_expires_at: 10.minutes.from_now
    )
    code
  end

  # 刷新登录令牌
  def refresh_auth_token!
    regenerate_auth_token
    update!(
      auth_token_expires_at: 30.days.from_now,
      last_login_at: Time.current,
      login_attempts: 0,
      locked_until: nil
    )
  end

  # 检查令牌是否有效
  def token_valid?
    auth_token_expires_at&.future? && !locked?
  end

  # 增加登录失败次数
  def increment_login_attempts!
    increment!(:login_attempts)
    lock_account! if login_attempts >= 4
  end

  # 锁定账户
  def lock_account!
    update!(locked_until: 30.minutes.from_now)
  end

  # 检查账户是否被锁定
  def locked?
    locked_until&.future?
  end

  # 解锁账户
  def unlock!
    update!(login_attempts: 0, locked_until: nil)
  end

  # 类方法

  # 根据手机号查找用户
  def self.find_by_phone(phone)
    find_by(phone: normalize_phone_number(phone))
  end

  # 根据令牌查找用户
  def self.find_by_token(token)
    find_by(auth_token: token)
  end

  private

  # 规范化手机号（去除空格和符号）
  def normalize_phone
    self.phone = self.class.normalize_phone_number(phone) if phone.present?
  end

  # 设置验证码过期时间
  def set_verification_expiry
    self.verification_code_expires_at ||= 10.minutes.from_now
  end

  # 类方法：规范化手机号
  def self.normalize_phone_number(phone)
    phone.to_s.gsub(/\D/, '').last(8)
  end
end
