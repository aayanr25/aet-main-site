import { onRequestOptions as __api_newsletter_signup_ts_onRequestOptions } from "/Users/aayanr/dev/chipsi-main-site/functions/api/newsletter-signup.ts"
import { onRequestPost as __api_newsletter_signup_ts_onRequestPost } from "/Users/aayanr/dev/chipsi-main-site/functions/api/newsletter-signup.ts"
import { onRequestOptions as __api_verify_passcode_ts_onRequestOptions } from "/Users/aayanr/dev/chipsi-main-site/functions/api/verify-passcode.ts"
import { onRequestPost as __api_verify_passcode_ts_onRequestPost } from "/Users/aayanr/dev/chipsi-main-site/functions/api/verify-passcode.ts"
import { onRequest as __api_calendar_ts_onRequest } from "/Users/aayanr/dev/chipsi-main-site/functions/api/calendar.ts"
import { onRequest as __api_image_ts_onRequest } from "/Users/aayanr/dev/chipsi-main-site/functions/api/image.ts"
import { onRequest as __api_members_ts_onRequest } from "/Users/aayanr/dev/chipsi-main-site/functions/api/members.ts"
import { onRequest as __api_newsletter_ts_onRequest } from "/Users/aayanr/dev/chipsi-main-site/functions/api/newsletter.ts"
import { onRequest as __api_newsletter_pdf_ts_onRequest } from "/Users/aayanr/dev/chipsi-main-site/functions/api/newsletter-pdf.ts"
import { onRequest as __api_photos_ts_onRequest } from "/Users/aayanr/dev/chipsi-main-site/functions/api/photos.ts"

export const routes = [
    {
      routePath: "/api/newsletter-signup",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_newsletter_signup_ts_onRequestOptions],
    },
  {
      routePath: "/api/newsletter-signup",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_newsletter_signup_ts_onRequestPost],
    },
  {
      routePath: "/api/verify-passcode",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_verify_passcode_ts_onRequestOptions],
    },
  {
      routePath: "/api/verify-passcode",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_verify_passcode_ts_onRequestPost],
    },
  {
      routePath: "/api/calendar",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_calendar_ts_onRequest],
    },
  {
      routePath: "/api/image",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_image_ts_onRequest],
    },
  {
      routePath: "/api/members",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_members_ts_onRequest],
    },
  {
      routePath: "/api/newsletter",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_newsletter_ts_onRequest],
    },
  {
      routePath: "/api/newsletter-pdf",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_newsletter_pdf_ts_onRequest],
    },
  {
      routePath: "/api/photos",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_photos_ts_onRequest],
    },
  ]