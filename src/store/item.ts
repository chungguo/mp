import { defineStore } from '@mpxjs/pinia';
import request from '@/common/request';

export enum ItemStatus {
  // 1=上架，2=下架
  OnShelf = 1,
  OffShelf = 2,
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

    return response.data?.data?.items ?? [];
  };

  const fetchItemById = async (id: string | number) => {
    const response = await request.fetch<{
      data: Item;
    }>({
      url: `/api/v1/items/${id}`,
      method: 'GET',
    });

    return response.data?.data;
  };

  return {
    fetchItems,
    fetchItemById,
  };
});
