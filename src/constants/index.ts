// src/constants/index.ts
// 应用常量配置 - 集中管理所有硬编码值

/**
 * 应用基础配置
 */
export const APP_CONFIG = {
  name: '健牙宝',
  version: '4.0.0',
  baseUrl: 'https://yesmilesh.com/api/v1',
} as const;

/**
 * 存储键名
 */
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER_INFO: 'user_info',
  SEARCH_HISTORY: 'search_history',
  SETTINGS: 'settings',
} as const;

/**
 * 默认分享配置
 */
export const DEFAULT_SHARE = {
  title: '健牙宝，上海7家口腔医院官方合作平台',
  path: '/pages/index',
  imageUrl: 'https://yjb-1376872341.cos.ap-shanghai.myqcloud.com/public/share.jpg',
} as const;

/**
 * UI 配置
 */
export const UI_CONFIG = {
  colors: {
    brand: '#3D61F5',
    primary: '#4A8DFF',
    background: '#F1F3F7',
    card: '#FFFFFF',
    text: '#1D2129',
    textSecondary: '#86909C',
    textTertiary: '#999999',
    success: '#52C41A',
    warning: '#FAAD14',
    error: '#F5222D',
  },
  borderRadius: {
    large: '24rpx',
    medium: '16rpx',
    small: '8rpx',
  },
  spacing: {
    xs: '8rpx',
    sm: '16rpx',
    md: '24rpx',
    lg: '32rpx',
    xl: '48rpx',
  },
} as const;

/**
 * 分页配置
 */
export const PAGINATION = {
  defaultPageSize: 10,
  maxPageSize: 100,
  defaultPage: 1,
} as const;

/**
 * 网络配置
 */
export const NETWORK_CONFIG = {
  requestTimeout: 10000,
  downloadTimeout: 30000,
  uploadTimeout: 30000,
  retryCount: 3,
  retryDelay: 1000,
} as const;

/**
 * 业务相关常量
 */
export const BUSINESS_CONSTANTS = {
  // 优惠券
  coupon: {
    maxClaimPerPhone: 5,
    defaultValidityDays: 30,
  },
  // 医院
  hospital: {
    maxRecommendations: 10,
  },
  // AI 检测
  aiTest: {
    maxImages: 9,
    supportedFormats: ['jpg', 'jpeg', 'png'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },
} as const;

/**
 * 图片资源路径
 */
export const IMAGE_ASSETS = {
  // 首页
  home: {
    aiTest: 'https://yjb-1376872341.cos.ap-shanghai.myqcloud.com/public/index/aitest.png',
    insurance: 'https://yjb-1376872341.cos.ap-shanghai.myqcloud.com/public/index/%E7%88%B1%E7%89%99%E6%97%A0%E5%BF%A7%E5%8C%85.png',
    customerService: 'https://yjb-1376872341.cos.ap-shanghai.myqcloud.com/public/index/%E4%B8%93%E5%B1%9E%E5%AE%A2%E6%9C%8D.png',
    groupBuy: 'https://yjb-1376872341.cos.ap-shanghai.myqcloud.com/public/tuan/image.webp',
    defaultBanner: 'https://yjb-1376872341.cos.ap-shanghai.myqcloud.com/public/index/b4c753daef99a3bd23293805978eafc9.webp',
  },
  // 优惠券
  coupon: {
    background: 'https://yjb-1376872341.cos.ap-shanghai.myqcloud.com/public/lowcode-2385847.png',
  },
  // 分享
  share: 'https://yjb-1376872341.cos.ap-shanghai.myqcloud.com/public/share.jpg',
} as const;
