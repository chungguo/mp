import { defineStore } from '@mpxjs/pinia';
import request from '@/common/request';

export enum DoctorStatus {
  // 1=正常，2=禁用
  Active = 1,
  Inactive = 2,
}

export interface Doctor {
  id: number;
  doctor_id: string;
  name: string;
  avatar: string;
  practice_year: number;
  title: string;
  department: string;
  description: string;
  hospital_ids: number[];
  status: DoctorStatus;
  created_at: string;
  updated_at: string;
}

export interface DoctorListQuery {
  page?: number;
  page_size?: number;
  hospital_id?: number;
}

export interface DoctorListResponse {
  doctors: Doctor[];
  page: number;
  page_size: number;
  total: number;
}

export const useDoctorStore = defineStore('doctor', () => {
  const fetchDoctors = async (params: DoctorListQuery = {}) => {
    const response = await request.fetch<{
      data: DoctorListResponse;
    }>({
      url: '/doctors',
      method: 'GET',
      params: {
        page: 1,
        page_size: 100,
        ...params,
      },
    });

    return response.data?.data;
  };

  const fetchDoctorById = async (id: string | number) => {
    const response = await request.fetch<{
      data: Doctor;
    }>({
      url: `/doctors/${id}`,
      method: 'GET',
    });

    return response.data?.data;
  };

  return {
    fetchDoctors,
    fetchDoctorById,
  };
});
