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

// 登录状态类型
interface LoginState {
  promise: Promise<string> | null;
  isRefreshing: boolean;
  retryCount: number;
  maxRetries: number;
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string>('');
  const newUser = ref<boolean | null>(null);
  const profile = ref<Profile | null>(null);
  
  // 登录状态管理 - 确保只有一个登录请求
  const loginState: LoginState = {
    promise: null,
    isRefreshing: false,
    retryCount: 0,
    maxRetries: 3,
  };

  // 等待登录完成的请求队列
  const waitingQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: Error) => void;
  }> = [];

  // 计算属性：是否已登录
  const isLoggedIn = computed(() => !!token.value && !!profile.value);

  // 计算属性：用户角色名称
  const roleName = computed(() => {
    if (!profile.value?.role_id) return null;
    return RoleName[profile.value.role_id];
  });

  /**
   * 核心方法：确保获取有效 Token
   * - 如果已有 token，直接返回
   * - 如果正在登录，加入等待队列
   * - 如果未登录，触发登录流程
   */
  const ensureToken = async (): Promise<string> => {
    // 1. 已有有效 token，直接返回
    if (token.value) {
      return token.value;
    }

    // 2. 正在登录中，加入等待队列，共享登录结果
    if (loginState.isRefreshing && loginState.promise) {
      return new Promise((resolve, reject) => {
        waitingQueue.push({ resolve, reject });
      });
    }

    // 3. 触发登录流程
    return performLogin();
  };

  /**
   * 执行登录流程 - 保证全局唯一
   */
  const performLogin = async (): Promise<string> => {
    // 双重检查，防止竞态
    if (loginState.isRefreshing && loginState.promise) {
      return loginState.promise;
    }

    loginState.isRefreshing = true;
    loginState.retryCount = 0;

    const loginTask = async (): Promise<string> => {
      while (loginState.retryCount <= loginState.maxRetries) {
        try {
          const sessionToken = await doLogin();
          
          // 登录成功，更新状态
          token.value = sessionToken;
          loginState.retryCount = 0;
          
          // 获取用户信息
          await queryProfile();
          
          // 唤醒所有等待的请求
          flushWaitingQueue(sessionToken);
          
          return sessionToken;
        } catch (error) {
          loginState.retryCount++;
          
          if (loginState.retryCount > loginState.maxRetries) {
            // 重试次数耗尽，登录失败
            const loginError = error instanceof Error 
              ? error 
              : new Error('登录失败，请重试');
            
            // 通知所有等待的请求
            rejectWaitingQueue(loginError);
            throw loginError;
          }
          
          // 指数退避重试
          const delay = Math.pow(2, loginState.retryCount - 1) * 1000;
          await new Promise(r => setTimeout(r, delay));
        }
      }
      
      throw new Error('登录失败，重试次数已耗尽');
    };

    loginState.promise = loginTask();

    try {
      const result = await loginState.promise;
      return result;
    } finally {
      // 清理状态
      loginState.isRefreshing = false;
      loginState.promise = null;
    }
  };

  /**
   * 实际登录操作
   */
  const doLogin = async (): Promise<string> => {
    const loginRes = await mpx.login();

    if (!loginRes.code) {
      throw new Error('微信登录失败：未获取到 code');
    }

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
        data: { code: loginRes.code },
        success: (res) => {
          if (res.statusCode === 200 && res.data.data?.session_token) {
            newUser.value = res.data.data.is_new_user;
            resolve(res.data.data.session_token);
          } else {
            reject(new Error(res.data.data?.session_token ? '登录响应异常' : '获取 token 失败'));
          }
        },
        fail: (err) => {
          reject(new Error(`网络请求失败: ${err.errMsg || '未知错误'}`));
        },
      });
    });
  };

  /**
   * 唤醒等待队列中的所有请求
   */
  const flushWaitingQueue = (sessionToken: string): void => {
    while (waitingQueue.length > 0) {
      const waiter = waitingQueue.shift();
      if (waiter) {
        waiter.resolve(sessionToken);
      }
    }
  };

  /**
   * 通知等待队列登录失败
   */
  const rejectWaitingQueue = (error: Error): void => {
    while (waitingQueue.length > 0) {
      const waiter = waitingQueue.shift();
      if (waiter) {
        waiter.reject(error);
      }
    }
  };

  /**
   * 刷新 Token（用于 token 过期时）
   */
  const refreshToken = async (): Promise<string> => {
    // 清除当前 token
    token.value = '';
    
    // 触发重新登录
    return performLogin();
  };

  /**
   * 兼容旧版本的 login 方法
   * @deprecated 请使用 ensureToken()
   */
  const login = async (): Promise<string> => {
    return ensureToken();
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
      profile.value = { ...profile.value, ...data };
    }
  };

  const logout = (): void => {
    token.value = '';
    profile.value = null;
    newUser.value = null;
    loginState.isRefreshing = false;
    loginState.promise = null;
    loginState.retryCount = 0;
    
    // 清空等待队列
    rejectWaitingQueue(new Error('用户已退出登录'));
  };

  return {
    token,
    profile,
    newUser,
    isLoggedIn,
    roleName,
    ensureToken,
    login,
    refreshToken,
    queryProfile,
    updateProfile,
    logout,
  };
});
