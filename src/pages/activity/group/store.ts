import request from "@/common/request";
import { defineStore } from "@mpxjs/pinia";

interface GroupRecordItem {
  id: number;
  activity_id: number;
  item_id: number;
  item_name: string;
  activity_name: string;
  required_count: number;
  current_count: number;
  group_price: number;
  status: number;
  start_time: string;
  complete_time: string;
  my_role: string;
};

interface InitiateGroup {
  group_id: number;
  order_id: number;
  order_no: string;
  pay_amount: number;
  expire_time: string;
  wechat_pay_params: {
    appId: string;
    timeStamp: string;
    nonceStr: string;
    package: string;
    signType: 'RSA';
    paySign: string;
  },
}

export interface GroupInfoItem {
  id: number;
  activity_id: number;
  item_id: number;
  required_count: number;
  current_count: number;
  group_price: number;
  start_time: string;
  expire_time: string;
  status: number;
  remaining_seconds: number;
}

interface ParticipantItem {
  id: number;
  user_id: number;
  nickname: string;
  avatar: string;
  is_initiator: number;
  join_order: number;
  status: number;
  pay_time: string;
}

export const useGroupStore = defineStore("group", () => {
  /**
   * 获取参团记录
   */
  const getGroupRecords = async (params: {
    page: number;
    page_size: number;
    // 1:进行中 2:已完成 3:已失败
    status: number;
  }) => {
    try {
      const res = await request.fetch<{
        data: {
          list: GroupRecordItem[];
        }
      }>({
        url: '/group-buying/my-groups',
        method: 'GET',
        params,
      });
      return res?.data?.data?.list ?? [];
    } catch (error) {
      return [];
    }
  };

  /**
   * 发起拼图
   */
  const initiateGroup = async (data: {
    activity_id: number;
    item_id: number;
  }) => {
    try {
      const res = await request.fetch<{
        data: InitiateGroup,
      }>({
        url: '/group-buying/groups',
        method: 'POST',
        data,
      });
      return res?.data?.data;
    } catch (error) {
      return null;
    }
  };

  const getGroupInfo = async (group_id: number) => {
    try {
      const res = await request.fetch<{
        data: GroupInfoItem & {
          participants: ParticipantItem[],
        },
      }>({
        url: `/group-buying/groups/${group_id}`,
        method: 'GET',
      });
      return res?.data?.data;
    } catch (error) {
      return null;
    }
  };

  const joinGroup = async (group_id: number) => {
    try {
      const res = await request.fetch<{
        data: InitiateGroup,
      }>({
        url: `/group-buying/groups/${group_id}/join`,
        method: 'POST',
        data: {
          payment_method: "jsapi"
        }
      });
      return res?.data?.data;
    } catch (error) {
      return null;
    }
  };

  return {
    getGroupRecords,
    getGroupInfo,
    initiateGroup,
    joinGroup,
  };
});
