import mpx from '@mpxjs/core';
import { defineStore } from '@mpxjs/pinia';
import { ref, computed } from 'vue';
import request, { BASE_URL } from '@/common/request';

export enum Gender {
  Unknown = 0,
  Male = 1,
  Female = 2,
}

export enum RoleId {
  // 平台管理员
  Admin = 1,
  // 平台运营者
  Operator,
  // 平台客服
  CustomerService,
  // 诊所管理员
  HospitalAdmin,
  // 诊所运营
  HospitalOperator,
  // 诊所客服
  HospitalCustomerService,
  // 诊所医生
  HospitalDoctor,
}

export interface Profile {
  id: number;
  openid: string;
  unionid: string;
  nickname: string;
  avatar_url: string;
  gender: Gender;
  phone: string;
  role_id: RoleId | null;
}

interface UserState {
  token: string;
  profile: Profile | null;
}

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref('');
  const profile = ref<Profile | null>(null);

  // actions
  async function login() {
    if (token.value) {
      return token.value;
    }

    const loginRes = await mpx.login();

    if (!loginRes.code) {
      throw new Error('登录失败');
    }

    return new Promise((resolve, reject) => {
      mpx.request<{
        data: {
          is_new_user: boolean;
          session_token: string;
        }
      }>({
        url: `${BASE_URL}/auth/login`,
        method: "POST",
        data: {
          code: loginRes.code,
        },
        // @ts-ignore
        usePromise: false,
        success: (res) => {
          const newToken = res.data.data.session_token;
          token.value = newToken;
          resolve(newToken);
        },
        fail: (err) => {
          reject(err);
        },
      });
    });
  };

  async function queryProfile() {
    const res = await request.fetch<{
      data: Profile
    }>({
      url: '/auth/profile',
      method: 'GET',
    });

    profile.value = res.data.data;
  };

  return {
    // 状态
    token,
    profile,
    // actions
    login,
    queryProfile,
  };
});