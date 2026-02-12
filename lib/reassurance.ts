export type ReassuranceInput = {
  activePapers: number;
  lastSubsectionCompletedAt: string | null;
  fundingEndDate: string | null;
  chapterCompletionPct: number;
};

export type ReassuranceMessage = {
  level: "warning" | "info";
  message: string;
};

export const evaluateReassurance = (input: ReassuranceInput): ReassuranceMessage => {
  const now = new Date();

  if (input.activePapers > 4) {
    return {
      level: "warning",
      message: "You are carrying more than four active papers. Consider reducing concurrent drafting load."
    };
  }

  if (input.lastSubsectionCompletedAt) {
    const lastCompletion = new Date(input.lastSubsectionCompletedAt);
    const inactiveMs = now.getTime() - lastCompletion.getTime();
    if (inactiveMs > 21 * 24 * 60 * 60 * 1000) {
      return {
        level: "warning",
        message: "No subsection has been completed in 21 days. Schedule a focused completion block this week."
      };
    }
  }

  if (input.fundingEndDate) {
    const fundingEnd = new Date(input.fundingEndDate);
    const inSixMonths = new Date(now);
    inSixMonths.setMonth(inSixMonths.getMonth() + 6);

    if (fundingEnd < inSixMonths && input.chapterCompletionPct < 50) {
      return {
        level: "warning",
        message: "Funding ends within 6 months and chapter completion is under 50%. Timeline risk is elevated."
      };
    }
  }

  return {
    level: "info",
    message: "Progress appears stable. Keep following your current chapter and subsection plan."
  };
};
