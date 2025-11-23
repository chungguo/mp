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
  tags: string;
  doctors: Doctor[];
  rating: number;
}

export interface Doctor {
  name: string;
  title: string;
  speciality: string;
}

export const useHospitalStore = defineStore('hospital', () => {
  const fetchHospitals = async (filter = {}) => {
    const response = await request.fetch<{
      data: {
        hospitals: Hospital[];
      },
    }>({
      url: '/hospitals',
      method: "GET",
      params: {
        page: 1,
        page_size: 100,
        ...filter
      },
    });

    return response.data?.data?.hospitals ?? [];
  };

  const fetchHospitalById = async (id: string) => {
    const response = await request.fetch<{
      data: Hospital
    }>({
      url: `/hospitals/${id}`,
      method: "GET",
    });

    return response.data?.data;
  };

  return {
    fetchHospitals,
    fetchHospitalById
  };
});

