import { defineStore } from '@mpxjs/pinia';
import request from '@/common/request';

export interface Hospital {
  id: number;
  name: string;
  address: string;
  longitude: number;
  latitude: number;
  phone: string;
  description: string;
  images: string[];
  business_hours: string;
}

export const useHospitalStore = defineStore('hospital', () => {
  const fetch = async (filter = {}) => {
    const response = await request.fetch<{
      data: {
        clinics: Hospital[];
      },
    }>({
      url: '/clinics',
      method: "GET",
      params: {
        page: 1,
        page_size: 100,
        ...filter
      },
    });

    return response.data?.data?.clinics ?? [];
  };

  const fetchById = async (id: string) => {
    const response = await request.fetch<{
      data: Hospital
    }>({
      url: `/clinics/${id}`,
      method: "GET",
    });

    return response.data?.data;
  };

  return {
    fetch,
    fetchById
  };
});

