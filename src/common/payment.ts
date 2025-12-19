import { PaymentParams } from '@/store/payment';
import dayjs from 'dayjs';
import mpx from '@mpxjs/core';

export const PREFIX = 'LOCAL_PAYMENT_PARAMS';

export const DELIMITER = "$$";

// 10min 支付超时
export const VALIDITY_PERIOD = 10;

export const setPaymentParamsCache = (order_no: string, payment_params: PaymentParams) => {
  mpx.setStorage({
    key: [PREFIX, dayjs().valueOf(), order_no].join(DELIMITER),
    data: JSON.stringify(payment_params),
  });
}

export const getPaymentParamsCache = async (order_no: string): Promise<PaymentParams | null> => {
  if (!order_no) {
    return null;
  }

  const cache = await mpx.getStorageInfo();

  const key = cache.keys.find((k: string) => k.endsWith(`${DELIMITER}${order_no}`));

  if (!key) {
    return null;
  }

  const [, time,] = key.split(DELIMITER);

  // 10min 支付超时
  if (dayjs().diff(dayjs(Number(time)), 'minute') > VALIDITY_PERIOD) {
    mpx.removeStorage({ key });
    return null;
  }

  const res = await mpx.getStorage({ key });

  if (!res.data) {
    return null;
  }

  try {
    return JSON.parse(res.data) as PaymentParams;
  } catch {
    return null;
  }
};

export const clearPaymentParamsCache = async () => {
  const cache = await mpx.getStorageInfo();

  const keys = cache.keys.filter((k: string) => k.startsWith(PREFIX));

  const expiredKeys = keys.filter((k: string) => {
    const [, time,] = k.split(DELIMITER);
    return dayjs().diff(dayjs(Number(time)), 'minute') > VALIDITY_PERIOD;
  });

  expiredKeys.forEach((k: string) => {
    mpx.removeStorage({ key: k });
  });
}
