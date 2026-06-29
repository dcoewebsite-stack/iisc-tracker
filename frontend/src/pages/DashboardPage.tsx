import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import type { DashboardStats, College } from '../types/college';
import BottomTabBar from '../components/BottomTabBar';
import StatsCard from '../components/StatsCard';
import PriorityBadge from '../components/PriorityBadge';

const getPriorityScore = (college: College): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = (dateStr: string) => {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (college.followUpDate) {
    const days = diffDays(college.followUpDate);
    if (days < 0) return 1;
    if (days <= 3) return 2;
    if (days <= 7) return 3;
  }

  if (college.status === 'Upcoming' && college.visitDate) {
    const days = diffDays(college.visitDate);
    if (days >= 0 && days <= 3) return 4;
    if (days > 3 && days <= 7) return 5;
  }

  return 6;
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const employeeName = localStorage.getItem('employeeName') || 'there';
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [urgentColleges, setUrgentColleges] = useState<College[]>([]);
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

        // Only show priority 1-3 (overdue + follow-ups) on dashboard
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white px-4 pt-10 pb-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Good to see you,</p>
            <h1 className="text-xl font-bold text-gray-800">{employeeName} 👋</h1>
          </div>
          <button
            onClick={logout}
            className="text-sm text-red-500 font-medium px-3 py-1 rounded-lg border border-red-200"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Stats Grid */}
        {stats && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Overview
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <StatsCard
                label="Total Colleges"
                value={stats.total}
                color="border-blue-500"
                icon=""
              />
              <StatsCard
                label="Upcoming"
                value={stats.upcoming}
                color="border-indigo-500"
                icon=""
              />
              <StatsCard
                label="Visited"
                value={stats.visited}
                color="border-green-500"
                icon=""
              />
              <StatsCard
                label="Overdue"
                value={stats.overdueFollowUps}
                color="border-red-500"
                icon=""
              />
              <StatsCard
                label="Follow-ups"
                value={stats.followUpsThisWeek}
                color="border-orange-500"
                icon=""
              />
              <StatsCard
                label="Visits This Week"
                value={stats.upcomingVisitsThisWeek}
                color="border-yellow-500"
                icon=""
              />
            </div>
          </div>
        )}

        {/* Urgent Colleges */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Needs Attention
          </h2>
          {urgentColleges.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <p className="text-2xl mb-2">🎉</p>
              <p className="text-gray-500 text-sm">All caught up! No urgent follow-ups.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {urgentColleges.map((college) => (
                <div
                  key={college._id}
                  className="bg-white rounded-2xl p-4 shadow-sm"
                  onClick={() => navigate('/colleges')}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">
                        {college.collegeName}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {college.assignedEmployee}
                      </p>
                      {college.followUpDate && (
                        <p className="text-xs text-gray-400 mt-1">
                          Follow-up: {new Date(college.followUpDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <PriorityBadge score={getPriorityScore(college)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomTabBar />
    </div>
  );
};

export default DashboardPage;