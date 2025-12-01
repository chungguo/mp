import { defineStore } from '@mpxjs/pinia';
import request from '@/common/request';
import { ref } from '@mpxjs/core';
import { isEmpty, sortBy } from 'lodash-es';

export interface Category {
  id: number;
  category_id: string;
  name: string;
  level: 1 | 2;
  parent_id: number | null;
  status: number;
  image: string;
  created_at: string;
  updated_at: string;
}

export const useCategoryStore = defineStore('category', () => {
  const categories = ref<Category[]>([]);

  const fetchCategories = async (params = {}) => {
    // 如果没有参数且已有缓存数据，直接返回
    if (isEmpty(params) && !isEmpty(categories.value)) {
      return categories.value;
    }

    const response = await request.fetch<{
      data: Category[];
    }>({
      url: '/categories',
      method: 'GET',
      params,
    });

    const data = sortBy(response.data?.data ?? [], ['id']);

    // 如果没有参数，更新缓存
    if (isEmpty(params)) {
      categories.value = data;
    }

    return data;
  };

  return {
    fetchCategories,
  };
});
