import { onRequest as __api_image_ts_onRequest } from "/Users/aayanr/dev/chipsi-main-site/functions/api/image.ts"
import { onRequest as __api_photos_ts_onRequest } from "/Users/aayanr/dev/chipsi-main-site/functions/api/photos.ts"

export const routes = [
    {
      routePath: "/api/image",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_image_ts_onRequest],
    },
  {
      routePath: "/api/photos",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_photos_ts_onRequest],
    },
  ]