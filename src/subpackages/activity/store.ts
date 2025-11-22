import { defineStore } from '@mpxjs/pinia';
import request from '@/common/request';

export interface Reward {
  /** 奖励ID */
  reward_id: number;
  /** 里程碑（需要邀请的人数） */
  milestone: number;
  /** 奖励类型：1=虚拟奖励（优惠券）,2=实物奖励 */
  reward_type: number;
  /** 奖励名称 */
  reward_name: string;
  /** 奖励图片URL（可能为null） */
  reward_image: string;
  /** 是否已解锁（invited_count >= milestone） */
  is_unlocked: boolean;
  /** 是否已领取 */
  is_claimed: boolean;
}

export interface ActivityProgress {
  /** 参与记录ID */
  participation_id: number;
  /** 活动ID */
  activity_id: number;
  /** 活动名称 */
  activity_name: string;
  /** 分享码（用于生成邀请链接） */
  share_code: string;
  /** 已成功邀请的人数（完成咨询的新用户数） */
  invited_count: number;
  /** 参与活动的结束时间（ISO 8601格式） */
  participation_end_time: string;
  /** 参与状态：1=进行中,2=已完成,3=已过期 */
  status: number;
  /** 奖励列表（按里程碑从小到大排序） */
  rewards: Reward[];
}

export interface ClaimParams {
  participation_id: number;
  reward_id: number;
  recipient_name?: string;
  recipient_phone?: string;
  recipient_address?: string;
}

export interface ReturningUserActivity {
  id: number;
  name: string;
  description: string;
  banner_image: string;
  duration_days: number;
  activity_start_time: string;
  activity_end_time: string;
  status: number;
  status_text: string;
  can_participate: boolean;
  rewards: {
    milestone: number;
    reward_type: number;
    reward_name: string;
    reward_description: string;
    reward_image: string;
  }[];
}

export const useReferralStore = defineStore('referral', () => {
  const progress = async (filter = {}) => {
    const response = await request.fetch<{
      data: ActivityProgress[],
    }>({
      url: '/referral/progress',
      method: "GET",
      params: filter,
    });

    return response.data?.data ?? {};
  };

  const participate = async (data = {}) => {
    const response = await request.fetch<{
      data: {
        participation_id: number;
        share_code: string;
      },
    }>({
      url: '/referral/participate',
      method: 'POST',
      data,
    });

    return response.data?.data ?? {};
  };

  const claim = async (data: ClaimParams) => {
    const response = await request.fetch({
      url: '/referral/rewards/claim',
      method: 'POST',
      data,
    });
    return response.data ?? {};
  };

  const avaliable = async () => {
    const response = await request.fetch<{
      data: ReturningUserActivity[],
    }>({
      url: '/referral/activities/available',
      method: 'GET',
    });
    return (response.data.data ?? []).filter(item => item.status === 2 && item.can_participate);
  };

  const accept = async (data: {
    share_code: string;
  }) => {
    await request.fetch({
      url: '/referral/invite/click',
      method: 'POST',
      data,
    });
  };

  return {
    participate,
    progress,
    claim,
    accept,
    avaliable,
  };
});

