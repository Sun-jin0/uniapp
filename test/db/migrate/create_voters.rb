# 创建选民表
# 设计思路：
# 1. 使用手机号作为唯一标识，符合香港身份证+手机号的实名验证场景
# 2. phone_verified 标记手机号是否已验证，确保投票真实性
# 3. auth_token 用于维持登录状态，使用 secure_token 生成安全令牌
# 4. 添加唯一索引确保手机号唯一性，普通索引加速登录查询
class CreateVoters < ActiveRecord::Migration[7.0]
  def change
    create_table :voters do |t|
      t.string :phone, null: false, comment: '手机号，作为用户唯一标识'
      t.string :name, null: false, comment: '用户姓名'
      t.string :hkid_hash, null: false, comment: '香港身份证哈希值，用于实名验证（存储哈希保护隐私）'
      t.boolean :phone_verified, default: false, null: false, comment: '手机号是否已验证'
      t.string :verification_code, comment: '短信验证码（临时存储，验证后清空）'
      t.datetime :verification_code_expires_at, comment: '验证码过期时间'
      t.string :auth_token, comment: '登录令牌'
      t.datetime :auth_token_expires_at, comment: '登录令牌过期时间'
      t.datetime :last_login_at, comment: '最后登录时间'
      t.integer :login_attempts, default: 0, null: false, comment: '登录尝试次数（防暴力破解）'
      t.datetime :locked_until, comment: '账户锁定截止时间'
      t.datetime :deleted_at, comment: '软删除时间'

      t.timestamps
    end

    # 手机号唯一索引，确保一个手机号只能注册一次
    add_index :voters, :phone, unique: true
    # 香港身份证哈希唯一索引，确保一人一票
    add_index :voters, :hkid_hash, unique: true
    # 登录令牌索引，加速会话验证
    add_index :voters, :auth_token
    # 验证状态索引，用于统计已验证用户
    add_index :voters, :phone_verified
    # 软删除索引
    add_index :voters, :deleted_at
  end
end
