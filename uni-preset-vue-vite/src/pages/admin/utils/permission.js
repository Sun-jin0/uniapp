// 权限管理工具

// 角色定义
export const ROLES = {
  SUPER_ADMIN: 'super_admin', // 超级管理员 - 拥有所有权限
  ADMIN: 'admin', // 普通管理员 - 拥有部分权限
  CONTENT_ADMIN: 'content_admin' // 内容管理员 - 仅拥有内容管理权限
};

// 权限定义
export const PERMISSIONS = {
  // 兑换码管理
  REDEEM_CODE_VIEW: 'redeem_code_view', // 查看兑换码
  REDEEM_CODE_CREATE: 'redeem_code_create', // 创建兑换码
  REDEEM_CODE_EDIT: 'redeem_code_edit', // 编辑兑换码
  REDEEM_CODE_DELETE: 'redeem_code_delete', // 删除兑换码

  // 用户管理
  USER_VIEW: 'user_view', // 查看用户
  USER_EDIT: 'user_edit', // 编辑用户
  USER_DELETE: 'user_delete', // 删除用户

  // 数据统计
  STATS_VIEW: 'stats_view', // 查看统计数据

  // 系统设置
  SYSTEM_SETTINGS: 'system_settings', // 系统设置

  // 内容管理
  CONTENT_VIEW: 'content_view', // 查看内容
  SUBJECT_MANAGE: 'subject_manage', // 科目管理
  CHAPTER_MANAGE: 'chapter_manage', // 章节管理
  QUESTION_MANAGE: 'question_manage', // 题目管理
  EXAM_MANAGE: 'exam_manage', // 试卷管理
  ESSAY_MANAGE: 'essay_manage', // 作文管理
  SCORE_MANAGE: 'score_manage' // 成绩管理
};

// 角色权限映射
export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    PERMISSIONS.REDEEM_CODE_VIEW,
    PERMISSIONS.REDEEM_CODE_CREATE,
    PERMISSIONS.REDEEM_CODE_EDIT,
    PERMISSIONS.REDEEM_CODE_DELETE,
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_EDIT,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.STATS_VIEW,
    PERMISSIONS.SYSTEM_SETTINGS,
    PERMISSIONS.CONTENT_VIEW,
    PERMISSIONS.SUBJECT_MANAGE,
    PERMISSIONS.CHAPTER_MANAGE,
    PERMISSIONS.QUESTION_MANAGE,
    PERMISSIONS.EXAM_MANAGE,
    PERMISSIONS.ESSAY_MANAGE,
    PERMISSIONS.SCORE_MANAGE
  ],
  [ROLES.ADMIN]: [
    PERMISSIONS.REDEEM_CODE_VIEW,
    PERMISSIONS.REDEEM_CODE_CREATE,
    PERMISSIONS.REDEEM_CODE_EDIT,
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_EDIT,
    PERMISSIONS.STATS_VIEW,
    PERMISSIONS.CONTENT_VIEW,
    PERMISSIONS.SUBJECT_MANAGE,
    PERMISSIONS.CHAPTER_MANAGE,
    PERMISSIONS.QUESTION_MANAGE,
    PERMISSIONS.EXAM_MANAGE,
    PERMISSIONS.ESSAY_MANAGE,
    PERMISSIONS.SCORE_MANAGE
  ],
  [ROLES.CONTENT_ADMIN]: [
    PERMISSIONS.CONTENT_VIEW,
    PERMISSIONS.SUBJECT_MANAGE,
    PERMISSIONS.CHAPTER_MANAGE,
    PERMISSIONS.QUESTION_MANAGE,
    PERMISSIONS.EXAM_MANAGE,
    PERMISSIONS.ESSAY_MANAGE,
    PERMISSIONS.SCORE_MANAGE
  ]
};

/**
 * 检查用户是否有指定权限
 * @param {string} permission 权限标识
 * @param {string} role 用户角色
 * @returns {boolean}
 */
export function hasPermission(permission, role) {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * 检查用户是否有指定角色
 * @param {string} requiredRole 需要的角色
 * @param {string} userRole 用户角色
 * @returns {boolean}
 */
export function hasRole(requiredRole, userRole) {
  if (!userRole) return false;
  if (userRole === ROLES.SUPER_ADMIN) return true; // 超级管理员拥有所有权限
  return userRole === requiredRole;
}

/**
 * 获取用户角色
 * @returns {string|null}
 */
export function getUserRole() {
  try {
    const userInfo = uni.getStorageSync('userInfo');
    return userInfo?.role || null;
  } catch (e) {
    return null;
  }
}

/**
 * 检查当前用户是否有权限
 * @param {string} permission 权限标识
 * @returns {boolean}
 */
export function checkPermission(permission) {
  const role = getUserRole();
  return hasPermission(permission, role);
}

/**
 * 检查当前用户是否是管理员
 * @returns {boolean}
 */
export function isAdmin() {
  const role = getUserRole();
  return role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN;
}

/**
 * 检查当前用户是否是超级管理员
 * @returns {boolean}
 */
export function isSuperAdmin() {
  const role = getUserRole();
  return role === ROLES.SUPER_ADMIN;
}
