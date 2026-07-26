/** Barrel for static mock content (Lesson Player pre-backend). TODO(api): remove
 * once the real content + adaptation endpoints are wired. */
export {
  getMockLesson,
  getMockAdaptation,
  FIRST_LESSON_ID,
} from "./lessons";
export { resolveMockSso, SSO_RESOLVE_MS, type SsoResolution } from "./sso";
