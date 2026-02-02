import mpx, { ref } from '@mpxjs/core';
import { defineStore } from '@mpxjs/pinia';
import request, { BASE_URL } from '@/common/request';
import { log } from '@/common/log';

export enum Gender {
  Unknown = 0,
  Male = 1,
  Female = 2,
}

export const GenderOptions = [
  { label: '男', value: Gender.Male },
  { label: '女', value: Gender.Female }
]

export enum RoleId {
  // 平台管理员
  Admin = 1,
  // 平台运营者
  Operator,
  // 平台客服
  CustomerService,
  // 医院管理员
  HospitalAdmin,
  // 医院运营
  HospitalOperator,
  // 医院客服
  HospitalCustomerService,
  // 医院医生
  HospitalDoctor,
}

export const RoleName: Record<RoleId, string> = {
  [RoleId.Admin]: '平台管理员',
  [RoleId.Operator]: '平台运营',
  [RoleId.CustomerService]: '平台客服',
  [RoleId.HospitalAdmin]: '医院管理员',
  [RoleId.HospitalOperator]: '医院运营',
  [RoleId.HospitalCustomerService]: '医院客服',
  [RoleId.HospitalDoctor]: '医院医生',
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

export const useUserStore = defineStore('user', () => {
  const token = ref('');
  const newUser = ref<boolean | null>(null);
  const profile = ref<Profile | null>(null);
  let loginPromise: Promise<string> | null = null;

  const login = async () => {
    if (token.value) {
      return token.value;
    }

    // 如果已经有登录请求在进行中，直接返回该 Promise
    if (loginPromise) {
      return loginPromise;
    }

    // 创建新的登录 Promise
    loginPromise = (async () => {
      try {
        const loginRes = await mpx.login();

        if (!loginRes.code) {
          throw new Error('登录失败');
        }

        const result = await new Promise<string>((resolve, reject) => {
          mpx.request<{
            statusCode: number;
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
            // @ts-expect-error mpx 的 request 方法不支持 usePromise 选项，需要手动设置
            usePromise: false,
            success: (res) => {
              const newToken = res.data.data.session_token;

              if (!newToken) {
                reject('');
                log.error(res);
                return;
              }

              token.value = newToken;
              newUser.value = res.data.data.is_new_user;
              resolve(newToken);
            },
            fail: (err) => {
              log.error(err);
              reject(err);
            },
          });
        });

        return result;
      } finally {
        // 登录完成后清除 Promise 缓存
        loginPromise = null;
      }
    })();

    return loginPromise;
  };

  const queryProfile = async () => {
    const res = await request.fetch<{
      data: Profile
    }>({
      url: '/auth/profile',
      method: 'GET',
    });
    profile.value = res.data.data;
  };

  const updateProfile = async (data: Partial<Profile>) => {
    return request.fetch({
      url: '/auth/profile',
      method: 'PUT',
      data,
    });
  };

  return {
    token,
    profile,
    newUser,
    login,
    queryProfile,
    updateProfile,
  };
});
