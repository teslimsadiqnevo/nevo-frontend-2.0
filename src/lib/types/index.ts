/** Barrel for shared domain types (FE Architecture §1, /lib/types). */
export type {
  TextContent,
  VisualContent,
  AudioContent,
  InteractiveContent,
  QuickCheck,
  CalculationVariant,
  CalcCardStep,
  CalcNumericStep,
  CalculationStep,
  CalculationSegment,
  LessonSegment,
  AssessmentQuestion,
  Assessment,
  Lesson,
  SegmentAdaptation,
  AdaptationPlan,
} from "./lesson";
export { isNumericStep } from "./lesson";
