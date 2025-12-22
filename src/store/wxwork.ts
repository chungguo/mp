import { defineStore } from '@mpxjs/pinia';
import request from '@/common/request';

export enum SourceType {
  /** 咨询结果页 */
  ConsultResult = 1,
  /** AI检测完成页 */
  AiDetectComplete = 2,
  /** AI检测报告结果页 */
  AiDetectReportResult = 3,
}

export interface Benefit {
  /** 福利点标题，最多20个字符 */
  title: string;
  /** 福利点描述，最多50个字符 */
  description: string;
}

export interface Config {
  /** 配置ID */
  id: number;
  /** 入口来源类型：1=咨询结果页，2=AI检测完成页，3=AI检测报告结果页 */
  source_type: number;
  /** 企业微信二维码图片URL */
  qrcode_url: string;
  /** 福利点配置列表，最多3个 */
  benefits: Benefit[];
  /** 优先级，数字越大优先级越高 */
  priority: number;
  /** 是否启用：1=启用，2=禁用 */
  is_enabled: number;
  /** 创建人用户ID */
  created_by: number;
  /** 创建人OpenID */
  created_by_open_id: string;
  /** 最后修改人用户ID */
  updated_by: number | null;
  /** 最后修改人OpenID */
  updated_by_open_id: string | null;
  /** 创建时间（ISO 8601格式） */
  created_at: string;
  /** 更新时间（ISO 8601格式） */
  updated_at: string;
}


export const useWxworkStore = defineStore('wxwork', () => {
  const queryConfig = async (source = SourceType.ConsultResult) => {
    const res = await request.fetch<{
      data: Config;
    }>({
      url: '/wechat-work-config',
      method: 'GET',
      params: {
        source_type: source,
      }
    });
    return res.data.data;
  };

  return {
    queryConfig,
  };
});
