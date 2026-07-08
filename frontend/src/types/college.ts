export interface FollowUp {
  _id: string;
  followUpDate: string | null;
  followUpNotes: string;
  isDone: boolean;
  doneAt: string | null;
}

export interface College {
  _id: string;
  collegeName: string;
  assignedEmployee: string;
  contactPerson: string;
  status: 'Upcoming' | 'Follow-up Pending' | 'Completed';
  visitDate: string | null;
  notes: string;
  followUps: FollowUp[];
  lastUpdatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CollegeFormData {
  collegeName: string;
  assignedEmployee?: string;
  contactPerson?: string;
  status?: 'Upcoming' | 'Follow-up Pending' | 'Completed';
  visitDate?: string;
  notes?: string;
  followUps?: {
    _id?: string;
    followUpDate: string;
    followUpNotes: string;
    isDone: boolean;
    doneAt?: string | null;
  }[];
  reason?: string;
}

export interface DashboardStats {
  total: number;
  upcoming: number;
  followUpPending: number;
  completed: number;
  overdueFollowUps: number;
  followUpsThisWeek: number;
  upcomingVisitsThisWeek: number;
}