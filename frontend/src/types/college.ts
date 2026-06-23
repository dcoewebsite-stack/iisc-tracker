export interface College {
    _id: string;
    collegeName: string;
    assignedEmployee: string;
    status: 'Upcoming' | 'Visited';
    visitDate: string | null;
    notes: string;
    followUpDate: string | null;
    followUpNotes: string;
    lastUpdatedBy: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface CollegeFormData {
    collegeName: string;
    assignedEmployee: string;
    status: 'Upcoming' | 'Visited';
    visitDate?: string;
    notes?: string;
    followUpDate?: string;
    followUpNotes?: string;
  }
  
  export interface DashboardStats {
    total: number;
    upcoming: number;
    visited: number;
    overdueFollowUps: number;
    followUpsThisWeek: number;
    upcomingVisitsThisWeek: number;
  }