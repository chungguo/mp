import mpx from "@mpxjs/core";
import { BASE_URL } from "./request";
import { useUserStore } from "@/store/user";

const upload = async (url: string) => {
  const userStore = useUserStore();

  try {
    const res = await mpx.uploadFile({
      url: `${BASE_URL}/upload/image`,
      filePath: url,
      name: 'file',
      header: {
        'Authorization': `Bearer ${userStore.token.value}`,
      },
    });
    const data = JSON.parse(res.data);
    if (data.data?.url) {
      return data.data.url;
    } else {
      return null;
    }
  } catch (e) {
    return null;
  }
};

export const uploadImages = async (url: string[]) => {
  return Promise.all(url.map(upload));
}
