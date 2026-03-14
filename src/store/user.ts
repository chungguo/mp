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
  Admin = 1,
  Operator,
  CustomerService,
  HospitalAdmin,
  HospitalOperator,
  HospitalCustomerService,
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

/**
 * Token 管理器
 * 核心职责：
 * 1. 全局唯一 Token 状态
 * 2. 自动获取 Token（带并发控制）
 * 3. Token 刷新管理
 */
class TokenManager {
  private token: string = '';
  private isAcquiring: boolean = false;
  private acquirePromise: Promise<string> | null = null;
  private waiters: Array<{
    resolve: (token: string) => void;
    reject: (error: Error) => void;
  }> = [];

  /**
   * 获取有效 Token（全局入口）
   * - 有 Token：直接返回
   * - 正在获取：加入等待队列
   * - 无 Token：触发获取流程
   */
  async getToken(): Promise<string> {
    // 1. 已有有效 Token，直接返回
    if (this.token) {
      return this.token;
    }

    // 2. 正在获取中，排队等待
    if (this.isAcquiring && this.acquirePromise) {
      return new Promise((resolve, reject) => {
        this.waiters.push({ resolve, reject });
      });
    }

    // 3. 开始获取 Token
    return this.doAcquire();
  }

  /**
   * 执行 Token 获取（保证全局唯一）
   */
  private async doAcquire(): Promise<string> {
    this.isAcquiring = true;

    this.acquirePromise = (async () => {
      try {
        const token = await this.loginWithRetry();
        this.token = token;
        
        // 唤醒所有等待的请求
        this.resolveWaiters(token);
        
        return token;
      } catch (error) {
        // 获取失败，通知所有等待者
        this.rejectWaiters(error as Error);
        throw error;
      } finally {
        this.isAcquiring = false;
        this.acquirePromise = null;
      }
    })();

    return this.acquirePromise;
  }

  /**
   * 登录并带重试机制
   */
  private async loginWithRetry(maxRetries = 3): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.performLogin();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          // 指数退避：1s, 2s, 4s
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }

    throw lastError || new Error('登录失败，请检查网络后重试');
  }

  /**
   * 执行微信登录
   */
  private async performLogin(): Promise<string> {
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
            resolve(res.data.data.session_token);
          } else {
            reject(new Error('服务器返回无效的登录凭证'));
          }
        },
        fail: (err) => {
          reject(new Error(`网络请求失败: ${err.errMsg || '请检查网络连接'}`));
        },
      });
    });
  }

  /**
   * 唤醒等待队列
   */
  private resolveWaiters(token: string): void {
    while (this.waiters.length > 0) {
      const waiter = this.waiters.shift();
      waiter?.resolve(token);
    }
  }

  /**
   * 拒绝等待队列
   */
  private rejectWaiters(error: Error): void {
    while (this.waiters.length > 0) {
      const waiter = this.waiters.shift();
      waiter?.reject(error);
    }
  }

  /**
   * 设置 Token（外部更新）
   */
  setToken(token: string): void {
    this.token = token;
  }

  /**
   * 获取当前 Token（不触发获取）
   */
  getCurrentToken(): string {
    return this.token;
  }

  /**
   * 清除 Token（退出登录/过期）
   */
  clear(): void {
    this.token = '';
    this.isAcquiring = false;
    this.acquirePromise = null;
    this.rejectWaiters(new Error('Token 已清除'));
  }
}

// 全局 Token 管理器实例
const tokenManager = new TokenManager();

/**
 * User Store
 * 基于 TokenManager 构建用户状态管理
 */
export const useUserStore = defineStore('user', () => {
  const newUser = ref<boolean | null>(null);
  const profile = ref<Profile | null>(null);

  const isLoggedIn = computed(() => !!tokenManager.getCurrentToken() && !!profile.value);
  const roleName = computed(() => {
    if (!profile.value?.role_id) return null;
    return RoleName[profile.value.role_id];
  });

  /**
   * 【核心方法】确保获取有效 Token
   * 供 request 拦截器调用
   */
  const ensureToken = async (): Promise<string> => {
    const token = await tokenManager.getToken();
    
    // 如果是新获取的 token，同步到 store
    if (token && !profile.value) {
      await queryProfile();
    }
    
    return token;
  };

  /**
   * 刷新 Token（用于 401 过期）
   */
  const refreshToken = async (): Promise<string> => {
    tokenManager.clear();
    return ensureToken();
  };

  /**
   * 兼容旧接口
   */
  const login = ensureToken;

  const queryProfile = async (): Promise<void> => {
    const token = tokenManager.getCurrentToken();
    if (!token) {
      throw new Error('未登录');
    }

    const res = await mpx.request<{
      data: { data: Profile }
    }>({
      url: `${BASE_URL}/auth/profile`,
      method: 'GET',
      header: { 'Authorization': `Bearer ${token}` },
    });
    
    if (res.data?.data) {
      profile.value = res.data.data;
    }
  };

  const updateProfile = async (data: Partial<Profile>): Promise<void> => {
    const token = tokenManager.getCurrentToken();
    if (!token) throw new Error('未登录');

    const res = await mpx.request({
      url: `${BASE_URL}/auth/profile`,
      method: 'PUT',
      header: { 'Authorization': `Bearer ${token}` },
      data,
    });
    
    if (res.statusCode === 200 && profile.value) {
      profile.value = { ...profile.value, ...data };
    }
  };

  const logout = (): void => {
    tokenManager.clear();
    profile.value = null;
    newUser.value = null;
  };

  return {
    token: computed(() => tokenManager.getCurrentToken()),
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

// 导出 TokenManager 供其他模块使用
export { tokenManager };
