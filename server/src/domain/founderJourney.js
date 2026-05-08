const JOURNEY_STAGE_COUNT = 6;

export function defaultJourneyProgress() {
  return {
    currentStage: 1,
    completedStages: [],
    stageData: {
      1: {
        startedAt: new Date().toISOString(),
        completionPercentage: 0,
        milestonesCompleted: [],
      },
    },
  };
}

/**
 * Normalize journey object from DB or client; fill missing shape with defaults.
 */
export function normalizeJourney(raw) {
  const base = defaultJourneyProgress();
  if (!raw || typeof raw !== "object") return base;

  const currentStage = Number(raw.currentStage);
  const stage =
    Number.isFinite(currentStage) && currentStage >= 1 && currentStage <= JOURNEY_STAGE_COUNT
      ? currentStage
      : 1;

  const completedStages = Array.isArray(raw.completedStages)
    ? [...new Set(raw.completedStages.map(Number).filter((n) => n >= 1 && n <= JOURNEY_STAGE_COUNT))]
    : [];

  const stageData =
    raw.stageData && typeof raw.stageData === "object" ? { ...raw.stageData } : { ...base.stageData };

  for (let i = 1; i <= JOURNEY_STAGE_COUNT; i += 1) {
    if (!stageData[i]) {
      stageData[i] = {
        startedAt: new Date().toISOString(),
        completionPercentage: 0,
        milestonesCompleted: [],
      };
    } else {
      stageData[i] = {
        startedAt: String(stageData[i].startedAt || new Date().toISOString()),
        completionPercentage: Math.min(
          100,
          Math.max(0, Number(stageData[i].completionPercentage) || 0),
        ),
        milestonesCompleted: Array.isArray(stageData[i].milestonesCompleted)
          ? stageData[i].milestonesCompleted.map(String).slice(0, 50)
          : [],
        ...(stageData[i].completedAt ? { completedAt: String(stageData[i].completedAt) } : {}),
      };
    }
  }

  return {
    currentStage: stage,
    completedStages,
    stageData,
  };
}

/**
 * Validate body for PUT /journey. Returns { ok, journey?, homeUi?, errors? }
 */
export function validateJourneyPut(body = {}) {
  const errors = [];
  if (!body || typeof body !== "object") {
    return { ok: false, errors: ["Body must be an object."] };
  }

  const hasJourney = body.journey !== undefined;
  let journey;
  if (hasJourney) {
    const raw = body.journey;
    if (Array.isArray(raw?.completedStages) && raw.completedStages.length > JOURNEY_STAGE_COUNT) {
      errors.push("Too many completedStages entries.");
    }
    journey = normalizeJourney(raw);
  }

  const hasHomeUi = body.homeUi !== undefined && body.homeUi !== null;
  const homeUiErrors = [];
  let homeUi;
  if (hasHomeUi) {
    if (typeof body.homeUi !== "object" || Array.isArray(body.homeUi)) {
      homeUiErrors.push("homeUi must be a plain object.");
    } else if (Object.keys(body.homeUi).length > 40) {
      homeUiErrors.push("homeUi has too many keys.");
    } else {
      const tasks = body.homeUi.completedTasksForStage;
      if (tasks !== undefined) {
        if (!Array.isArray(tasks)) {
          homeUiErrors.push("completedTasksForStage must be an array.");
        } else if (tasks.length > 80) {
          homeUiErrors.push("completedTasksForStage too long.");
        }
      }
      if (
        body.homeUi.phase3WelcomeSeen !== undefined &&
        typeof body.homeUi.phase3WelcomeSeen !== "boolean"
      ) {
        homeUiErrors.push("phase3WelcomeSeen must be boolean.");
      }
      if (!homeUiErrors.length) {
        homeUi = { ...body.homeUi };
        if (Array.isArray(homeUi.completedTasksForStage)) {
          homeUi.completedTasksForStage = homeUi.completedTasksForStage
            .map(String)
            .map((s) => s.slice(0, 64))
            .slice(0, 80);
        }
      }
    }
  }

  errors.push(...homeUiErrors);
  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    hasJourney,
    ...(hasJourney ? { journey } : {}),
    hasHomeUi,
    ...(hasHomeUi && homeUi ? { homeUi } : {}),
  };
}
