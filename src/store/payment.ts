import { defineStore } from '@mpxjs/pinia';
import request from '@/common/request';

enum OrderStatus {
  PENDING = 0,    // 待支付
  PAID = 1,       // 支付成功
  REFUNDED = 2,   // 已退款
  CLOSED = 3,     // 已关闭
  USED = 4        // 已使用
}

enum RefundStatus {
  REFUNDING = 0,  // 退款中
  REFUNDED = 1,   // 退款成功
  REFUND_FAILED = 2, // 退款失败
  REFUND_CLOSED = 3  // 退款关闭
}

interface PreOrderParams {
  item_id: number,
  payment_method: 'jsapi',
  remark?: string;
}

interface PaymentParams {
  appId: string;
  timeStamp: string;
  nonceStr: string;
  package: string;
  signType: 'RSA';
  paySign: string;
}

interface PreOrder {
  order_id: number;
  order_no: string;
  description: string;
  amount: number;
  status: number;
  payment_method: 'jsapi';
  payment_params: PaymentParams;
  created_at: string;
}

interface RefundProgress {
  /** 退款单ID */
  id: number;
  /** 平台退款单号 */
  refund_no: string;
  /** 微信退款单号(退款提交后返回) */
  refund_id: string | null;
  /** 关联的支付订单ID */
  payment_order_id: number;
  /** 原平台订单号 */
  order_no: string;
  /** 退款金额(单位：分) */
  amount: number;
  /** 退款状态：0=退款中，1=退款成功，2=退款失败，3=退款关闭 */
  status: number;
  /** 退款原因 */
  reason: string;
  /** 退款入账账户(退款成功后返回) */
  receive_account: string | null;
  /** 退款成功时间(ISO 8601格式，未成功为null) */
  success_at: string | null;
  /** 创建时间(ISO 8601格式) */
  created_at: string;
}

interface OrderItem {
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
  /** 支付截止时间(ISO 8601格式) */
  payment_deadline: string;
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

export { OrderStatus, RefundStatus, PaymentParams, RefundProgress, OrderItem };

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

  const refund = async (id: string) => {
    const response = await request.fetch({
      url: `/payment/orders/${id}/refund`,
      method: 'POST',
      data: {
        reason: "用户申请退款"
      },
    });

    return response.data;
  }

  const queryRefundProgress = async (refundid: string) => {
    const response = await request.fetch<{
      data: RefundProgress;
    }>({
      url: `/payment/refunds/${refundid}`,
      method: 'GET',
    });

    return response.data?.data;
  }

  const continueMakePayment = async (id: string) => {
    const response = await request.fetch<{
      data: { payment_params: PaymentParams; };
    }>({
      url: `/payment/orders/${id}/continue`,
      method: 'POST',
    });

    return response.data?.data;
  }

  return {
    queryOrders,
    queryOrderDetail,
    preOrder,
    refund,
    queryRefundProgress,
    continueMakePayment,
  };
});
