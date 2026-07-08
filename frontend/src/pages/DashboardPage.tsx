import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import type { DashboardStats, College } from '../types/college';
import BottomTabBar from '../components/BottomTabBar';
import StatsCard from '../components/StatsCard';
import PriorityBadge from '../components/PriorityBadge';
import CalendarView from '../components/CalendarView';
import { getPriorityScore } from '../utils/priority';

const DashboardPage = () => {
  const navigate = useNavigate();
  const employeeName = localStorage.getItem('employeeName') || 'there';
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [urgentColleges, setUrgentColleges] = useState<College[]>([]);
  const [allColleges, setAllColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('employeeName');
    navigate('/login');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, collegesRes] = await Promise.all([
          api.get('/colleges/stats'),
          api.get('/colleges'),
        ]);
        setStats(statsRes.data.data);
        setAllColleges(collegesRes.data.data);

        const urgent = collegesRes.data.data.filter(
          (c: College) => getPriorityScore(c) <= 3
        );
        setUrgentColleges(urgent);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-3">
        <p className="text-3xl">🎓</p>
        <p className="text-sage text-sm">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-20">
      {/* Header */}
      <div className="bg-white px-4 pt-10 pb-6 shadow-sm border-b border-warmgray">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-sage">Good to see you,</p>
            <h1 className="text-xl font-bold text-ink">{employeeName} 👋</h1>
          </div>
          <button
            onClick={logout}
            className="text-sm text-red-600 font-medium px-3 py-1 rounded-lg border border-red-200"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Stats Grid */}
        {stats && (
          <div>
            <h2 className="text-sm font-semibold text-sage uppercase tracking-wide mb-3">
              Overview
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <StatsCard label="Total Colleges" value={stats.total} color="border-forest" icon="" />
              <StatsCard label="Upcoming" value={stats.upcoming} color="border-blue-500" icon="" />
              <StatsCard label="Follow-up Pending" value={stats.followUpPending} color="border-amber-500" icon="" />
              <StatsCard label="Visited Overall" value={stats.completed} color="border-green-500" icon="" />
              <StatsCard label="Overdue" value={stats.overdueFollowUps} color="border-red-500" icon="" />
              <StatsCard label="Visits This Week" value={stats.upcomingVisitsThisWeek} color="border-yellow-500" icon="" />
            </div>
          </div>
        )}

        {/* Needs Attention */}
        <div>
          <h2 className="text-sm font-semibold text-sage uppercase tracking-wide mb-3">
            Needs Attention
          </h2>
          {urgentColleges.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-warmgray">
              <p className="text-2xl mb-2">🎉</p>
              <p className="text-sage text-sm">All caught up! No urgent follow-ups.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {urgentColleges.map((college) => {
                const activeFollowUps = college.followUps?.filter(f => !f.isDone) ?? [];
                const nextFollowUp = activeFollowUps[0];
                return (
                  <div
                    key={college._id}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-warmgray cursor-pointer"
                    onClick={() => navigate('/colleges')}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-ink truncate">
                          {college.collegeName}
                        </p>
                        <p className="text-xs text-sage mt-0.5">
                          {college.assignedEmployee}
                        </p>
                        {nextFollowUp?.followUpDate && (
                          <p className="text-xs text-sage/70 mt-1">
                            Follow-up: {new Date(nextFollowUp.followUpDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <PriorityBadge score={getPriorityScore(college)} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Calendar */}
        <div>
          <h2 className="text-sm font-semibold text-sage uppercase tracking-wide mb-3">
            Calendar
          </h2>
          <CalendarView colleges={allColleges} />
        </div>
      </div>

      <BottomTabBar />
    </div>
  );
};

export default DashboardPage;