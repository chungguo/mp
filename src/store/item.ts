import { defineStore } from '@mpxjs/pinia';
import request from '@/common/request';

export enum ItemStatus {
  // 1=上架，2=下架
  OnShelf = 1,
  OffShelf = 2,
}

export interface SecKill {
  activity_id: number;
  end_time: string;
  seckill_price: number;
  stock: number;
}

export interface Group {
  /** 拼团活动ID，用于发起拼团时传入 */
  activity_id: number;
  /** 拼团价格 */
  group_price: number;
  /**	成团人数 */
  required_count: number;
  /** 拼团有效期（小时） */
  expire_hours: number;
  /** 拼团活动开始时间 */
  start_time: string;
  /**拼团活动结束时间 */
  end_time: string;
  /** 拼团库存数量 */
  stock: number;
  /** 分享图片URL */
  share_image: string;
  /** 分享文案 */
  share_text: string;
}

export interface Item {
  id: number;
  sku_id: string;
  category_id: number;
  category_name: string;
  name: string;
  cover_image: string;
  detail_images: string[];
  description: string;
  hospital_ids: number[];
  original_price: number;
  discount_price: number;
  stock: number;
  doctor_ids: number[];
  status: ItemStatus;
  created_at: string;
  updated_at: string;
  tags: string;
  marketing_activities?: {
    seckill_activity?: SecKill;
    group_buying_activity?: Group;
  },
}

export interface ItemListQuery {
  page?: number;
  page_size?: number;
  category_ids?: string;
  hospital_ids?: string;
}

export interface ItemListResponse {
  items: Item[];
  page: number;
  page_size: number;
  total: number;
}

export const useItemStore = defineStore('item', () => {
  const fetchItems = async (params: ItemListQuery = {}) => {
    const response = await request.fetch<{
      data: ItemListResponse;
    }>({
      url: '/items',
      method: 'GET',
      params,
    });

    return response.data?.data ?? {
      items: [],
      page: 1,
      page_size: 10,
      total: 0,
    };
  };

  const fetchItemById = async (id: string | number) => {
    const response = await request.fetch<{
      data: Item;
    }>({
      url: `/items/${id}`,
      method: 'GET',
    });

    return response.data?.data;
  };

  return {
    fetchItems,
    fetchItemById,
  };
});
