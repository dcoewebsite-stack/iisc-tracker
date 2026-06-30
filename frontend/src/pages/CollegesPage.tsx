import { useEffect, useState } from 'react';
import api from '../api/axios';
import type { College } from '../types/college';
import BottomTabBar from '../components/BottomTabBar';
import CollegeCard from '../components/CollegeCard';
import { useDebounce } from '../hooks/useDebounce';

type StatusFilter = 'All' | 'Upcoming' | 'Visited';

const CollegesPage = () => {
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');

  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    const fetchColleges = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (debouncedSearch) params.search = debouncedSearch;
        if (statusFilter !== 'All') params.status = statusFilter;

        const response = await api.get('/colleges', { params });
        setColleges(response.data.data);
      } catch (err) {
        console.error('Failed to fetch colleges', err);
      } finally {
        setLoading(false);
      }
    };

    fetchColleges();
  }, [debouncedSearch, statusFilter]);

  const filterPills: StatusFilter[] = ['All', 'Upcoming', 'Visited'];

  return (
    <div className="min-h-screen bg-cream pb-20">
      {/* Header */}
      <div className="bg-white px-4 pt-10 pb-4 shadow-sm border-b border-warmgray sticky top-0 z-10">
        <h1 className="text-xl font-bold text-ink mb-4">Colleges</h1>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search colleges..."
          className="w-full px-4 py-3 rounded-xl border border-warmgray focus:outline-none focus:ring-2 focus:ring-forest text-base mb-3"
        />

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto">
          {filterPills.map((pill) => (
            <button
              key={pill}
              onClick={() => setStatusFilter(pill)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                ${
                  statusFilter === pill
                    ? 'bg-forest text-white'
                    : 'bg-warmgray/40 text-sage'
                }`}
            >
              {pill}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <p className="text-center text-sage py-10">Loading...</p>
        ) : colleges.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-warmgray">
            <p className="text-2xl mb-2">🔍</p>
            <p className="text-sage text-sm">No colleges found</p>
          </div>
        ) : (
          colleges.map((college) => (
            <CollegeCard
              key={college._id}
              college={college}
              onClick={() => console.log('Open edit form for', college._id)}
            />
          ))
        )}
      </div>

      <BottomTabBar />
    </div>
  );
};

export default CollegesPage;