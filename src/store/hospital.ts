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

interface HospitalState {
  hospitals: Hospital[];
}

export const useHospitalStore = defineStore('hospital', {
  state: (): HospitalState => {
    return {
      hospitals: [],
    };
  },

  getters: {
    hospitalList: (state) => state.hospitals,
  },

  actions: {
    async fetch() {
      const response = await request.fetch<{
        clinics: Hospital[];
      }>({
        url: '/clinics',
        method: "GET",
        params: {
          page: 1,
          page_size: 100,
        },
      });

      this.$patch((state) => {
        state.hospitals = response.data?.clinics ?? [];
      });
    }
  }
})

