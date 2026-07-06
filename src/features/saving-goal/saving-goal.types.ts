export interface SavingGoalRecord {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  progress: number;
  completed: boolean;
}

export interface SavingGoalSummary {
  totalGoals: number;
  totalTarget: number;
  totalSaved: number;
  averageProgress: number;
}

export interface SavingGoalDashboard {
  summary: SavingGoalSummary;
  savingGoals: SavingGoalRecord[];
}
