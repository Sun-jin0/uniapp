# 应用基础模型
# 所有模型继承此类，包含通用功能
class ApplicationRecord < ActiveRecord::Base
  primary_abstract_class

  # 软删除支持（使用 paranoia gem 或 acts_as_paranoid）
  # 如果没有使用 gem，可以在这里定义通用的软删除方法
  
  # 默认作用域：排除已删除记录
  # 注意：使用 acts_as_paranoid gem 时会自动处理
  
  # 通用类方法
  class << self
    # 安全查找，找不到时返回 nil 而不是抛出异常
    def find_by_id_safe(id)
      find_by(id: id)
    end

    # 批量更新（带事务）
    def bulk_update!(ids, attributes)
      transaction do
        where(id: ids).update_all(attributes)
      end
    end
  end

  # 实例方法

  # 检查记录是否被软删除
  def deleted?
    respond_to?(:deleted_at) && deleted_at.present?
  end

  # 检查记录是否有效（未删除）
  def not_deleted?
    !deleted?
  end

  # 获取创建时间的友好格式
  def created_at_formatted
    created_at&.strftime('%Y-%m-%d %H:%M:%S')
  end

  # 获取更新时间的友好格式
  def updated_at_formatted
    updated_at&.strftime('%Y-%m-%d %H:%M:%S')
  end
end
