import { defineStore } from '@mpxjs/pinia';
import request from '@/common/request';

export enum Status {
  // 1=完成配置，2=生效中，3=暂停发放，4=已失效，5=已过期
  Configed = 1,
  Effective,
  Paused,
  Invaliable,
  Expired,
}

export enum ValidityType {
  // 1=固定时间有效，2=领取后n天有效
  FixedTime = 1,
  AfterDays
}

export interface Coupon {
  // 批次ID
  id: number;
  // 优惠券名称
  name: string;
  // 优惠券描述
  description: string;
  // 可用诊所ID，* 表示所有诊所，或分号分隔的ID如"1;2;3"
  clinic_ids: string;
  // 有效期类型：1=固定时间有效，2=领取后n天有效
  validity_type: ValidityType;
  //  固定时间有效时的券生效时间（ISO 8601格式）
  effective_time: string;
  // 固定时间有效时的券失效时间（ISO 8601格式）
  expire_time: string;
  // 领取后有效天数（validity_type=2时有效）
  validity_days: number;
  // 批次生效时间（可领取开始时间）
  batch_start_time: string;
  // 批次失效时间（可领取结束时间）
  batch_end_time: string;
  // 数量类型：1=不限数量，2=限量发放
  quantity_type: number;
  // 总数量（quantity_type=2时有效）
  total_quantity: number;
  // 每手机号可领取数量
  limit_per_phone: number;
  // 批次状态：1=完成配置，2=生效中，3=暂停发放，4=已失效，5=已过期
  status: Status;
  // 已领取数量
  claimed_count: number;
  // 已核销数量
  verified_count: number;
}

export interface CouponReceived {
  // 	领取记录ID
  id: number;
  // 	批次ID
  batch_id: number;
  // 优惠券名称
  coupon_name: string;
  // 	有效期类型：1=固定时间有效，2=领取后n天有效
  validity_type: ValidityType;
  validity_days: number;
  // 生效时间（ISO 8601格式）
  effective_time: string;
  // 过期时间（ISO 8601格式）
  expire_time: string;
  // 可用诊所ID，* 表示所有诊所
  clinic_ids: string;
  // 	优惠券状态：1=未使用，2=已核销，3=已过期，4=已失效
  status: number;
  // 核销码（32位hex字符串）
  verify_code: string;
  // 领取时间（ISO 8601格式）
  claimed_at: string;
  // 核销时间（ISO 8601格式，未核销时为null）
  verified_at: string;
}

export interface Claim {
  claim_id: number,
  coupon_name: string;
  expire_time: string;
  verify_code: string;
}

export const useCouponStore = defineStore('coupon', () => {
  async function query() {
    const res = await request.fetch<{
      data: Coupon
    }>({
      url: '/coupons/available',
      method: 'GET',
    });
    return res.data.data ?? [];
  };

  async function claim(id: number) {
    const res = await request.fetch<{
      data: Claim
    }>({
      url: '/coupons/claim',
      data: {
        batch_id: id,
      },
    });
    return res.data.data;
  };

  async function my() {
    const res = await request.fetch<{
      data: CouponReceived[];
    }>({
      url: '/coupons/my',
    });
    return res.data.data;
  };

  async function verify(code: string) {
    const res = await request.fetch<{
      data: CouponReceived
    }>({
      url: '/coupons/verify',
      data: {
        verify_code: code
      },
    });
    return res.data.data;
  };

  return {
    query,
    claim,
    my,
    verify,
  };
});