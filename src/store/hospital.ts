import { defineStore } from '@mpxjs/pinia';
import request from '@/common/request';
import { ref } from '@mpxjs/core';
import { isEmpty } from 'lodash-es';

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
  const hospitals = ref<Hospital[]>([]);

  const fetchHospitals = async (params = {}) => {
    if (isEmpty(params) && !isEmpty(hospitals.value)) {
      return hospitals.value;
    }

    const response = await request.fetch<{
      data: {
        hospitals: Hospital[];
      },
    }>({
      url: '/hospitals',
      method: "GET",
      params,
    });

    const data = response.data?.data?.hospitals ?? [];

    if (isEmpty(params)) {
      hospitals.value = data;
    }

    return data;
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

