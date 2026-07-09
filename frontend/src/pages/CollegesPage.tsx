import { useEffect, useState } from 'react';
import api from '../api/axios';
import type { College, CollegeFormData } from '../types/college';
import BottomTabBar from '../components/BottomTabBar';
import CollegeCard from '../components/CollegeCard';
import CollegeForm from '../components/CollegeForm';
import ImportModal from '../components/ImportModal';
import SkeletonCard from '../components/SkeletonCard';
import Toast from '../components/Toast';
import { useDebounce } from '../hooks/useDebounce';
import { useToast } from '../hooks/useToast';
import * as XLSX from 'xlsx';

type StatusFilter = 'All' | 'Upcoming' | 'Follow-up Pending' | 'Completed';

const CollegesPage = () => {
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [showForm, setShowForm] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [showImport, setShowImport] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const debouncedSearch = useDebounce(search, 400);

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

  useEffect(() => {
    fetchColleges();
  }, [debouncedSearch, statusFilter]);

  const handleSave = async (data: CollegeFormData) => {
    if (selectedCollege) {
      await api.put(`/colleges/${selectedCollege._id}`, data);
      showToast('College updated successfully');
    } else {
      await api.post('/colleges', data);
      showToast('College added successfully');
    }
    await fetchColleges();
  };

  const handleMarkFollowUpDone = async (collegeId: string, followUpId: string) => {
    await api.put(`/colleges/${collegeId}/followup/${followUpId}/done`);
    showToast('Follow-up marked as done');
    await fetchColleges();
    // Update selectedCollege so form reflects new state
    const updated = await api.get(`/colleges/${collegeId}`);
    setSelectedCollege(updated.data.data);
  };

  const handleCardClick = (college: College) => {
    setSelectedCollege(college);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setSelectedCollege(null);
    setShowForm(true);
  };

  const handleClose = (deleted?: boolean) => {
    setShowForm(false);
    setSelectedCollege(null);
    if (deleted) {
      showToast('College deleted');
      fetchColleges();
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/colleges');
      const allColleges: College[] = response.data.data;

      const exportData = allColleges.map((c) => ({
        'College Name': c.collegeName,
        'Assigned Employee': c.assignedEmployee || '',
        'Contact Person': c.contactPerson || '',
        'Phone': c.phone || '',
        'Email': c.email || '',
        'Status': c.status,
        'Visit Date': c.visitDate ? new Date(c.visitDate).toLocaleDateString() : '',
        'Notes': c.notes || '',
        'Follow-Up Count': c.followUps?.length || 0,
        'Active Follow-Ups': c.followUps?.filter(f => !f.isDone).length || 0,
        'Last Updated By': c.lastUpdatedBy || '',
        'Last Updated': new Date(c.updatedAt).toLocaleDateString(),
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Colleges');

      worksheet['!cols'] = [
        { wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 18 },
        { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 18 },
        { wch: 18 }, { wch: 15 },
      ];

      const fileName = `college-outreach-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      showToast('Export downloaded successfully');
    } catch (err) {
      showToast('Export failed. Try again.', 'error');
    }
  };

  const filterPills: StatusFilter[] = ['All', 'Upcoming', 'Follow-up Pending', 'Completed'];

  return (
    <div className="min-h-screen bg-cream pb-20">
      {/* Header */}
      <div className="bg-white px-4 pt-10 pb-4 shadow-sm border-b border-warmgray sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-ink">Colleges</h1>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="border border-forest text-forest text-sm font-semibold px-3 py-2 rounded-xl hover:bg-forest/5 transition-colors"
            >
              Export
            </button>
            <button
              onClick={() => setShowImport(true)}
              className="border border-forest text-forest text-sm font-semibold px-3 py-2 rounded-xl hover:bg-forest/5 transition-colors"
            >
              Import
            </button>
            <button
              onClick={handleAddNew}
              className="bg-forest text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-forest-dark transition-colors"
            >
              + Add
            </button>
          </div>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search colleges..."
          className="w-full px-4 py-3 rounded-xl border border-warmgray focus:outline-none focus:ring-2 focus:ring-forest text-base mb-3"
        />

        <div className="flex gap-2 overflow-x-auto pb-1">
          {filterPills.map((pill) => (
            <button
              key={pill}
              onClick={() => setStatusFilter(pill)}
              className={`px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors
                ${statusFilter === pill
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
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : colleges.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-warmgray">
            {debouncedSearch || statusFilter !== 'All' ? (
              <>
                <p className="text-3xl mb-2">🔍</p>
                <p className="text-ink font-medium mb-1">No colleges found</p>
                <p className="text-sage text-sm">Try a different search or filter</p>
              </>
            ) : (
              <>
                <p className="text-3xl mb-2">🎓</p>
                <p className="text-ink font-medium mb-1">No colleges yet</p>
                <p className="text-sage text-sm mb-4">Add your first college or import from Excel</p>
                <button
                  onClick={handleAddNew}
                  className="bg-forest text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-forest-dark transition-colors"
                >
                  + Add College
                </button>
              </>
            )}
          </div>
        ) : (
          colleges.map((college) => (
            <CollegeCard
              key={college._id}
              college={college}
              onClick={() => handleCardClick(college)}
            />
          ))
        )}
      </div>

      {showForm && (
        <CollegeForm
          college={selectedCollege}
          onSave={handleSave}
          onClose={handleClose}
          onMarkFollowUpDone={handleMarkFollowUpDone}
        />
      )}

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImportComplete={(count: number) => {
            fetchColleges();
            showToast(`${count} college${count !== 1 ? 's' : ''} imported`);
          }}
        />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <BottomTabBar />
    </div>
  );
};

export default CollegesPage;