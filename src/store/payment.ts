import { defineStore } from '@mpxjs/pinia';
import request from '@/common/request';

enum OrderStatus {
  PENDING = 0,    // 待支付
  PAID = 1,       // 支付成功
  REFUNDED = 2,   // 已退款
  CLOSED = 3,     // 已关闭
  USED = 4        // 已使用
}

interface PreOrderParams {
  item_id: number,
  payment_method: 'jsapi',
  remark?: string;
}

interface PreOrder {
  order_id: number;
  order_no: string;
  description: string;
  amount: number;
  status: number;
  payment_method: 'jsapi';
  payment_params: {
    appId: string;
    timeStamp: number;
    nonceStr: string;
    package: string;
    signType: 'RSA';
    paySign: string;
  },
  created_at: string;
}

export interface OrderItem {
  /** 支付订单ID */
  id: number;
  /** 平台订单号 */
  order_no: string;
  /** 微信支付交易号(支付成功后返回) */
  transaction_id: string | null;
  /** 用户OpenID */
  open_id: string;
  /** 商品ID */
  item_id: number;
  /** 商品SKU编号 */
  item_sku_id: string;
  /** 商品名称 */
  item_name: string;
  /** 商品封面图片URL */
  item_cover_image: string;
  /** 商品介绍 */
  item_description: string;
  /** 订单归属医院ID */
  hospital_id: number;
  /** 医院名称 */
  hospital_name: string;
  /** 商品可用医院ID列表 */
  hospital_ids: number[];
  /** 商品原价(单位：分) */
  original_price: number;
  /** 商品优惠价(单位：分，可为null) */
  discount_price: number | null;
  /** 商品描述 */
  description: string;
  /** 实付金额(单位：分) */
  amount: number;
  /** 订单状态 */
  status: OrderStatus;
  /** 状态文本 */
  status_text: string;
  /** 支付方式 */
  payment_method: string;
  /** 支付时间(ISO 8601格式，未支付为null) */
  paid_at: string | null;
  /** 订单过期时间(ISO 8601格式，未设置为null) */
  expire_at: string | null;
  /** 已退款金额(单位：分) */
  refund_amount: number;
  /** 创建时间(ISO 8601格式) */
  created_at: string;
  /** 退款时间(ISO 8601格式，未退款为null) */
  refund_at: string;
  /** 使用时间(ISO 8601格式，未使用为null) */
  used_at: string;
}

export { OrderStatus };

export const usePaymentStore = defineStore('payment', () => {
  const preOrder = async (data: PreOrderParams) => {
    const response = await request.fetch<{
      data: PreOrder;
    }>({
      url: '/payment/orders',
      method: 'POST',
      data,
    });

    return response.data?.data;
  };

  const queryOrders = async () => {
    const response = await request.fetch<{
      data: OrderItem[];
    }>({
      url: '/payment/orders',
      method: 'GET',
    });

    return response.data?.data;
  };

  const queryOrderDetail = async (id: string) => {
    const response = await request.fetch<{
      data: OrderItem;
    }>({
      url: `/payment/orders/${id}`,
      method: 'GET',
    });

    return response.data.data;
  }

  return {
    queryOrders,
    queryOrderDetail,
    preOrder,
  };
});
