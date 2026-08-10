/** Barrel for the API client + endpoint modules (FE Architecture §1 & §9). */
export { api, request, ApiError, BASE_URL, type RequestOptions } from "./client";
export { authApi } from "./auth";
export { signalsApi, type SignalEvent } from "./signals";
export { intelligenceApi } from "./intelligence";
export { contentApi } from "./content";
export { exportApi } from "./export";
export { askNevoApi } from "./askNevo";
export { notificationsApi } from "./notifications";
export { analyticsApi } from "./analytics";
export { baselineApi } from "./baseline";
export {
  partnerInquiriesApi,
  INQUIRY_ROLES,
  type PartnerInquiry,
  type PartnerInquiryReceipt,
  type InquiryRoleLabel,
} from "./partner-inquiries";
