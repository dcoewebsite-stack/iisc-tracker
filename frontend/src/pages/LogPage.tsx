import { useEffect, useState } from 'react';
import api from '../api/axios';
import BottomTabBar from '../components/BottomTabBar';
import { timeAgo } from '../utils/formatTime';

interface AuditLog {
  _id: string;
  eventType: 'DELETION' | 'POSTPONE';
  collegeName: string;
  performedBy: string;
  reason: string;
  metadata?: {
    field: string;
    oldDate: string;
    newDate: string;
  };
  createdAt: string;
}

interface LogData {
  deletions: AuditLog[];
  postpones: AuditLog[];
}

type ActiveTab = 'deletions' | 'postpones';

const LogPage = () => {
  const [logs, setLogs] = useState<LogData>({ deletions: [], postpones: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('deletions');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await api.get('/audit');
        setLogs(response.data.data);
      } catch (err) {
        console.error('Failed to fetch audit logs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const currentLogs = activeTab === 'deletions' ? logs.deletions : logs.postpones;

  return (
    <div className="min-h-screen bg-cream pb-20">
      <div className="bg-white px-4 pt-10 pb-4 shadow-sm border-b border-warmgray sticky top-0 z-10">
        <h1 className="text-xl font-bold text-ink mb-4">Activity Log</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('deletions')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors
              ${activeTab === 'deletions' ? 'bg-forest text-white' : 'bg-warmgray/40 text-sage'}`}
          >
            Deletions ({logs.deletions.length})
          </button>
          <button
            onClick={() => setActiveTab('postpones')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors
              ${activeTab === 'postpones' ? 'bg-forest text-white' : 'bg-warmgray/40 text-sage'}`}
          >
            Postpones ({logs.postpones.length})
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <p className="text-center text-sage py-10">Loading...</p>
        ) : currentLogs.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-warmgray">
            <p className="text-2xl mb-2">📋</p>
            <p className="text-ink font-medium mb-1">No logs yet</p>
            <p className="text-sage text-sm">
              {activeTab === 'deletions'
                ? 'No colleges have been deleted'
                : 'No overdue dates have been rescheduled'}
            </p>
          </div>
        ) : (
          currentLogs.map((log) => (
            <div key={log._id} className="bg-white rounded-2xl p-4 border border-warmgray shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-semibold text-ink flex-1 min-w-0 truncate">
                  {log.collegeName}
                </p>
                <p className="text-xs text-sage whitespace-nowrap">{timeAgo(log.createdAt)}</p>
              </div>

              <p className="text-xs text-sage mb-2">
                By <span className="font-medium text-ink">{log.performedBy}</span>
              </p>

              {log.eventType === 'POSTPONE' && log.metadata && (
                <div className="bg-amber-50 rounded-xl px-3 py-2 mb-2">
                  <p className="text-xs text-amber-700">
                    {log.metadata.field === 'followUpDate' ? 'Follow-up' : 'Visit'} rescheduled:{' '}
                    <span className="font-medium">
                      {new Date(log.metadata.oldDate).toLocaleDateString()}
                    </span>
                    {' → '}
                    <span className="font-medium">
                      {new Date(log.metadata.newDate).toLocaleDateString()}
                    </span>
                  </p>
                </div>
              )}

              <div className="bg-cream rounded-xl px-3 py-2 border border-warmgray">
                <p className="text-xs text-sage font-medium mb-0.5">Reason</p>
                <p className="text-xs text-ink">{log.reason}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <BottomTabBar />
    </div>
  );
};

export default LogPage;