import mpx from "@mpxjs/core";
import { BASE_URL } from "./request";
import { useUserStore } from "@/store/user";

const upload = (url: string) => {
  const userStore = useUserStore();
  return new Promise((resolve, reject) => {
    mpx.uploadFile({
      url: `${BASE_URL}/upload/image`,
      filePath: url,
      name: 'file',
      header: {
        'Authorization': `Bearer ${userStore.token.value}`,
      },
      success: res => {
        try {
          const data = JSON.parse(res.data);
          if (data.data?.url) {
            resolve(data.data.url);
          } else {
            reject(data);
          }
        } catch (e) {
          reject(e);
        }
      },
      fail: e => {
        reject(e);
      },
    });
  });
};

export const uploadImages = async (url: string[]) => {
  return Promise.all(url.map(upload));
}
