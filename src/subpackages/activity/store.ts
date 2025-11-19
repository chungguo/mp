import { defineStore } from '@mpxjs/pinia';
import request from '@/common/request';

interface Activity {
  id: number;
  /** 活动名称 */
  name: string;
  /** 活动描述 */
  description: string;
  /** 活动持续天数（从用户参与开始算起） */
  duration_days: number;
  /** 活动开始时间（ISO 8601格式） */
  activity_start_time: string;
  /** 活动结束时间（ISO 8601格式） */
  activity_end_time: string;
  /** 分享标题 */
  share_title: string;
  /** 分享描述 */
  share_description: string;
  /** 分享图片URL */
  share_image_url: string;
  /** 每日奖励领取上限，0表示不限制 */
  daily_reward_claim_limit: number;
}

interface Participation {
  /** 参与记录ID */
  id: number;
  /** 分享码 */
  share_code: string;
  /** 邀请人数 */
  invitation_count: number;
  /** 参与时间 */
  participate_time: string;
  /** 过期时间 */
  expire_time: string;
}

interface Reward {
  id: number;
  /** 达成里程碑（邀请人数） */
  milestone: number;
  /** 奖励类型：1-虚拟 2-实物 */
  reward_type: number;
  /** 奖励名称 */
  reward_name: string;
  /** 优惠券批次ID（虚拟奖励必填） */
  coupon_batch_id?: number;
  /** 排序序号 */
  sort_order: number;
  /** 是否已领取 */
  is_claimed?: boolean;
}

interface Rewards {
  /** 已解锁的奖励 */
  unlocked: Reward[];
  /** 未解锁的奖励 */
  locked: Reward[];
}

interface Invitation {
  /** 邀请记录ID */
  id: number;
  /** 被邀请用户ID */
  invited_user_id: number;
  /** 状态：1-已邀请 2-已完成咨询 */
  status: number;
  /** 邀请时间 */
  invited_at: string;
  /** 咨询完成时间 */
  consultation_completed_at: string | null;
}

interface ActivityData {
  /** 活动信息 */
  activity: Activity;
  /** 参与信息 */
  participation: Participation;
  /** 奖励信息 */
  rewards: Rewards;
  /** 邀请记录 */
  invitations: Invitation[];
}


export const useReferralStore = defineStore('referral', () => {
  const progress = async (filter = {}) => {
    const response = await request.fetch<{
      data: ActivityData[],
    }>({
      url: '/referral/progress',
      method: "GET",
      params: filter,
    });

    return response.data?.data ?? {};
  };

  const participate = async () => {
    const response = await request.fetch<{
      data: {
        participation_id: number;
        share_code: string;
      },
    }>({
      url: '/referral/participate',
    });

    return response.data?.data ?? {};
  };

  return {
    participate,
    progress,
  };
});

