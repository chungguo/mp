import mpx, { ref, computed } from '@mpxjs/core';
import { defineStore } from '@mpxjs/pinia';
import { BASE_URL } from '@/common/request';
import { log } from '@/common/log';

export enum Gender {
  Unknown = 0,
  Male = 1,
  Female = 2,
}

export const GenderOptions = [
  { label: '男', value: Gender.Male },
  { label: '女', value: Gender.Female }
];

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
};

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
  const token = ref<string>('');
  const newUser = ref<boolean | null>(null);
  const profile = ref<Profile | null>(null);
  let loginPromise: Promise<string> | null = null;

  // 计算属性：是否已登录
  const isLoggedIn = computed(() => !!token.value && !!profile.value);

  // 计算属性：用户角色名称
  const roleName = computed(() => {
    if (!profile.value?.role_id) return null;
    return RoleName[profile.value.role_id];
  });

  // 优化后的 token 获取方法：已登录直接返回，否则触发登录
  const ensureToken = async (): Promise<string> => {
    if (token.value) {
      return token.value;
    }
    return login();
  };

  const login = async (): Promise<string> => {
    // 如果已经有登录请求在进行中，直接返回该 Promise
    if (loginPromise) {
      return loginPromise;
    }

    // 创建新的登录 Promise
    loginPromise = (async () => {
      try {
        const loginRes = await mpx.login();

        if (!loginRes.code) {
          throw new Error('微信登录失败：未获取到 code');
        }

        const sessionToken = await exchangeCodeForToken(loginRes.code);
        token.value = sessionToken;
        
        // 登录成功后自动获取用户信息
        await queryProfile();
        
        return sessionToken;
      } catch (error) {
        log.error('登录失败:', error);
        throw error;
      } finally {
        loginPromise = null;
      }
    })();

    return loginPromise;
  };

  // 提取：code 换 token
  const exchangeCodeForToken = (code: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      mpx.request<{
        statusCode: number;
        data: {
          is_new_user: boolean;
          session_token: string;
        }
      }>({
        url: `${BASE_URL}/auth/login`,
        method: 'POST',
        data: { code },
        success: (res) => {
          if (res.statusCode === 200 && res.data.data?.session_token) {
            newUser.value = res.data.data.is_new_user;
            resolve(res.data.data.session_token);
          } else {
            reject(new Error(res.data.data?.session_token ? '登录响应异常' : '获取 token 失败'));
          }
        },
        fail: reject,
      });
    });
  };

  const queryProfile = async (): Promise<void> => {
    if (!token.value) {
      throw new Error('未登录');
    }

    try {
      const res = await mpx.request<{
        data: { data: Profile }
      }>({
        url: `${BASE_URL}/auth/profile`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token.value}`,
        },
      });
      
      if (res.data?.data) {
        profile.value = res.data.data;
      }
    } catch (error) {
      log.error('获取用户信息失败:', error);
      throw error;
    }
  };

  const updateProfile = async (data: Partial<Profile>): Promise<void> => {
    if (!token.value) {
      throw new Error('未登录');
    }

    const res = await mpx.request({
      url: `${BASE_URL}/auth/profile`,
      method: 'PUT',
      header: {
        'Authorization': `Bearer ${token.value}`,
      },
      data,
    });
    
    if (res.statusCode === 200 && profile.value) {
      // 更新本地状态
      profile.value = { ...profile.value, ...data };
    }
  };

  const logout = (): void => {
    token.value = '';
    profile.value = null;
    newUser.value = null;
    loginPromise = null;
  };

  return {
    token,
    profile,
    newUser,
    isLoggedIn,
    roleName,
    ensureToken,
    login,
    queryProfile,
    updateProfile,
    logout,
  };
});
