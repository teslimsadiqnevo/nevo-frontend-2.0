/** Barrel for the API client + endpoint modules (FE Architecture §1 & §9). */
export { api, request, ApiError, BASE_URL, type RequestOptions } from "./client";
export { authApi } from "./auth";
export {
  teamApi,
  roleForScopes,
  type AcceptInvitationResponse,
  type InvitedTeamMember,
  type TeamMember,
} from "./team";
export { signalsApi, type SignalEvent } from "./signals";
export { intelligenceApi } from "./intelligence";
export { contentApi, type ParseContentRequest, type ParseContentResponse } from "./content";
export { exportApi, type IepExport, type IepExportShare } from "./export";
export { classesApi, type AssignedClass, type AssignedTeacher } from "./classes";
export { permissionsApi, type PermissionsMe } from "./permissions";
export {
  schoolIntelligenceApi,
  type ComplianceAudit,
  type AdaptationLog,
  type AdaptationEventRow,
} from "./schoolIntelligence";
export {
  ssoApi,
  PROVIDER_LABELS,
  type SsoStatus,
  type SsoProvider,
  type RosterSyncHistory,
} from "./sso";
export { askNevoApi, asUuid } from "./askNevo";
export { consentsApi, type ConsentGateStatus } from "./consents";
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
