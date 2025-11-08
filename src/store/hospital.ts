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

export const useHospitalStore = defineStore('hospital', {
  actions: {
    async fetch(filter = {}) {
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

      const clinics = response.data.data.clinics ?? [];
      return clinics;
    },
    async fetchById(id: string) {
      const response = await request.fetch<{
        data: Hospital
      }>({
        url: `/clinics/${id}`,
        method: "GET",
      });

      return response.data.data;
    }
  }
})

