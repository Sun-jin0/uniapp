import { ref, onMounted } from 'vue';
import { checkInviteRestriction, getInviteInfo, recordAnswer } from '@/api/invite';

/**
 * 邀请限制检查 Composable
 * 用于在刷题页面集成邀请限制功能
 */
export function useInviteRestriction() {
  const showInviteModal = ref(false);
  const inviteInfo = ref({
    inviteCode: '',
    inviteCount: 0,
    needCount: 3,
    isUnlocked: false
  });
  const answerCount = ref(0);
  const isChecking = ref(false);

  /**
   * 获取用户邀请信息
   */
  const fetchInviteInfo = async () => {
    try {
      const res = await getInviteInfo();
      if (res.data && res.data.code === 0) {
        const data = res.data.data;
        inviteInfo.value = {
          inviteCode: data.invite_code || '',
          inviteCount: data.invite_count || 0,
          needCount: data.need_count || 3,
          isUnlocked: data.is_unlocked === 1 || data.is_unlocked === true
        };
      }
    } catch (error) {
      console.error('获取邀请信息失败:', error);
    }
  };

  /**
   * 检查是否需要显示邀请弹窗
   * @param {number} currentAnswerCount - 当前答题数
   */
  const checkRestriction = async (currentAnswerCount) => {
    // 如果已经解锁，直接返回
    if (inviteInfo.value.isUnlocked) {
      return { needInvite: false };
    }

    isChecking.value = true;
    try {
      const res = await checkInviteRestriction(currentAnswerCount);
      isChecking.value = false;
      
      if (res.data && res.data.code === 0) {
        const data = res.data.data;
        
        if (data.needInvite) {
          // 需要邀请，显示弹窗
          showInviteModal.value = true;
          return { needInvite: true, data };
        }
        
        return { needInvite: false, data };
      }
      
      return { needInvite: false };
    } catch (error) {
      isChecking.value = false;
      console.error('检查邀请限制失败:', error);
      return { needInvite: false, error };
    }
  };

  /**
   * 记录答题（用于统计）
   * @param {number} count - 答题数量
   */
  const logAnswer = async (count = 1) => {
    try {
      answerCount.value += count;
      await recordAnswer(count);
      return true;
    } catch (error) {
      console.error('记录答题失败:', error);
      return false;
    }
  };

  /**
   * 关闭邀请弹窗
   */
  const closeInviteModal = () => {
    showInviteModal.value = false;
  };

  /**
   * 分享回调
   */
  const onShare = (shareData) => {
    console.log('分享邀请:', shareData);
    // 可以在这里添加分享统计
  };

  /**
   * 复制邀请码回调
   */
  const onCopy = (code) => {
    console.log('复制邀请码:', code);
  };

  /**
   * 邀请成功后刷新信息
   */
  const refreshAfterInvite = async () => {
    await fetchInviteInfo();
    // 如果已经解锁，关闭弹窗
    if (inviteInfo.value.isUnlocked) {
      showInviteModal.value = false;
    }
  };

  onMounted(() => {
    fetchInviteInfo();
  });

  return {
    showInviteModal,
    inviteInfo,
    answerCount,
    isChecking,
    fetchInviteInfo,
    checkRestriction,
    logAnswer,
    closeInviteModal,
    onShare,
    onCopy,
    refreshAfterInvite
  };
}
