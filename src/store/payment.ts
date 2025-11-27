import { defineStore } from '@mpxjs/pinia';
import request from '@/common/request';

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

  return {
    preOrder,
  };
});
