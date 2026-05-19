// Founder
export {
  FOUNDER_INDUSTRY_OPTIONS,
  FOUNDER_TARGET_AUDIENCE_OPTIONS,
  FOUNDER_ROLES_NEEDED_OPTIONS,
  FOUNDER_TEAM_SIZE_OPTIONS,
  FOUNDER_STAGE_OPTIONS,
  FOUNDER_VALIDATED_IDEA_OPTIONS,
  FOUNDER_MVP_OPTIONS,
  FOUNDER_CUSTOMERS_OPTIONS,
  ORG_ADMIN_PROGRAM_STAGE_OPTIONS,
  resolveIndustryForPersistence,
  getFounderEditableFields,
  validateFounderStartupFields,
} from "./founder/founderProfileConfig.js";
export { mapFounderWeeklyLoop } from "./founder/mappers/founderWeeklyLoopMapper.js";
export {
  weekOfStartIso,
  MIN_WEEKLY_MILESTONE_TITLE_LEN,
  MIN_WEEKLY_TASK_TITLE_LEN,
  validateWeeklyPlanMilestones,
  nextPlanWeekOfIso,
  buildWeeklyPlanFromTemplate,
  buildWeeklyPlanCustom,
  buildWeeklyPlanFromIntent,
} from "./founder/mappers/weeklyPlanPayload.js";

// Office
export {
  mergeRowsById,
  mapOfficeWorkspaceModel,
} from "./office/mappers/officeViewModel.js";
export { useOfficeWorkspaceData } from "./office/hooks/useOfficeWorkspaceData.js";
export { useOfficePanels } from "./office/hooks/useOfficePanels.js";

// Talent
export { TALENT_SKILL_OPTIONS, TALENT_SKILL_OPTION_SET } from "./talent/talentSkillOptions.js";
export { mapTalentHomeViewModel } from "./talent/mappers/talentViewModel.js";
export { useTalentHomeData } from "./talent/hooks/useTalentHomeData.js";

// Team member
export {
  mapTeamMemberHomeViewModel,
  mapTeamMemberPerformanceViewModel,
} from "./team-member/mappers/teamMemberViewModel.js";
export { useTeamMemberHomeData } from "./team-member/hooks/useTeamMemberHomeData.js";
export { useTeamMemberPerformanceData } from "./team-member/hooks/useTeamMemberPerformanceData.js";
