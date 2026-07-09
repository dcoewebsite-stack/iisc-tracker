import { useState, useEffect } from 'react';
import type { College, CollegeFormData } from '../types/college';
import api from '../api/axios';

const EMPLOYEE_NAMES = [
  'Aaron',
  'Sakshita',
  'Nevin',
  'Varsha',
  'Arnav',
  'Pravar',
];

interface CollegeFormProps {
  college?: College | null;
  onSave: (data: CollegeFormData) => Promise<void>;
  onClose: (deleted?: boolean) => void;
  onMarkFollowUpDone: (collegeId: string, followUpId: string) => Promise<void>;
}

const EMPTY_FORM: CollegeFormData = {
  collegeName: '',
  assignedEmployee: '',
  contactPerson: '',
  phone: '',
  email: '', 
  visitDate: '',
  notes: '',
  followUps: [],

};

const CollegeForm = ({ college, onSave, onClose, onMarkFollowUpDone }: CollegeFormProps) => {
  const [form, setForm] = useState<CollegeFormData>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [postponeReason, setPostponeReason] = useState('');
  const [showPostponeModal, setShowPostponeModal] = useState(false);
  const [pendingPostponeField, setPendingPostponeField] = useState('');
  const [postponeAction, setPostponeAction] = useState<'submit' | 'complete'>('submit');
  const [markingDone, setMarkingDone] = useState<string | null>(null);

  useEffect(() => {
    if (college) {
      setForm({
        collegeName: college.collegeName,
        assignedEmployee: college.assignedEmployee || '',
        contactPerson: college.contactPerson || '',
        phone: college.phone || '',
email: college.email || '',
        visitDate: college.visitDate
          ? new Date(college.visitDate).toISOString().split('T')[0]
          : '',
        notes: college.notes || '',
        followUps: college.followUps.map((fu) => ({
          _id: fu._id,
          followUpDate: fu.followUpDate
            ? new Date(fu.followUpDate).toISOString().split('T')[0]
            : '',
          followUpNotes: fu.followUpNotes || '',
          isDone: fu.isDone,
          doneAt: fu.doneAt || null,
        })),
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [college]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFollowUpChange = (
    index: number,
    field: 'followUpDate' | 'followUpNotes',
    value: string
  ) => {
    setForm((prev) => {
      const updated = [...(prev.followUps || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, followUps: updated };
    });
  };

  const addFollowUp = () => {
    setForm((prev) => ({
      ...prev,
      followUps: [
        ...(prev.followUps || []),
        { followUpDate: '', followUpNotes: '', isDone: false },
      ],
    }));
  };

  const removeFollowUp = (index: number) => {
    setForm((prev) => {
      const updated = [...(prev.followUps || [])];
      updated.splice(index, 1);
      return { ...prev, followUps: updated };
    });
  };

  const handleMarkDone = async (followUpId: string) => {
    if (!college) return;
    setMarkingDone(followUpId);
    try {
      await onMarkFollowUpDone(college._id, followUpId);
    } finally {
      setMarkingDone(null);
    }
  };

  const handleSubmit = async (overrideReason?: string) => {
    if (!form.collegeName.trim()) {
      setError('College name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload: CollegeFormData = overrideReason
        ? { ...form, reason: overrideReason }
        : { ...form };

      await onSave(payload);
      onClose();
    } catch (err: any) {
      if (err.response?.data?.requiresReason) {
        setPostponeAction('submit');
        setShowPostponeModal(true);
        setPendingPostponeField(err.response.data.field);
        setError('');
      } else {
        setError(err.response?.data?.error || 'Something went wrong. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMarkCompleted = async (overrideReason?: string) => {
    setLoading(true);
    setError('');
    try {
      const payload: CollegeFormData = {
        ...form,
        status: 'Completed',
        ...(overrideReason ? { reason: overrideReason } : {}),
      };
      await onSave(payload);
      onClose();
    } catch (err: any) {
      if (err.response?.data?.requiresReason) {
        setPostponeAction('complete');
        setShowPostponeModal(true);
        setPendingPostponeField(err.response.data.field);
        setError('');
      } else {
        setError(err.response?.data?.error || 'Failed to mark as completed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!college || !deleteReason.trim()) return;
    setLoading(true);
    try {
      await api.delete(`/colleges/${college._id}`, {
        data: { reason: deleteReason.trim() },
      });
      onClose(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const isEditing = !!college;

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-end"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-cream w-full rounded-t-3xl max-h-[90vh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-warmgray rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-warmgray">
          <h2 className="text-lg font-bold text-ink">
            {isEditing ? 'Edit College' : 'Add College'}
          </h2>
          <button onClick={() => onClose()} className="text-sage hover:text-ink text-2xl leading-none">
            ×
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 pb-28">

          {/* College Name */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              College Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="collegeName"
              value={form.collegeName}
              onChange={handleChange}
              placeholder="e.g. IIT Bombay"
              className="w-full px-4 py-3 rounded-xl border border-warmgray focus:outline-none focus:ring-2 focus:ring-forest bg-white text-ink text-base"
            />
          </div>

          {/* Assigned Employee */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Assigned Employee
            </label>
            <select
              name="assignedEmployee"
              value={form.assignedEmployee}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-warmgray focus:outline-none focus:ring-2 focus:ring-forest bg-white text-ink text-base"
            >
              <option value="">Select employee (optional)</option>
              {EMPLOYEE_NAMES.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* Contact Person */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Contact Person
            </label>
            <input
              type="text"
              name="contactPerson"
              value={form.contactPerson}
              onChange={handleChange}
              placeholder="e.g. Dr. Sharma (optional)"
              className="w-full px-4 py-3 rounded-xl border border-warmgray focus:outline-none focus:ring-2 focus:ring-forest bg-white text-ink text-base"
            />
          </div>
{/* Phone */}
<div>
  <label className="block text-sm font-medium text-ink mb-1">
    Phone Number
  </label>
  <input
    type="tel"
    name="phone"
    value={form.phone}
    onChange={handleChange}
    placeholder="e.g. +91 98765 43210 (optional)"
    className="w-full px-4 py-3 rounded-xl border border-warmgray focus:outline-none focus:ring-2 focus:ring-forest bg-white text-ink text-base"
  />
</div>

{/* Email */}
<div>
  <label className="block text-sm font-medium text-ink mb-1">
    Email
  </label>
  <input
    type="email"
    name="email"
    value={form.email}
    onChange={handleChange}
    placeholder="e.g. principal@college.edu (optional)"
    className="w-full px-4 py-3 rounded-xl border border-warmgray focus:outline-none focus:ring-2 focus:ring-forest bg-white text-ink text-base"
  />
</div>
          {/* Visit Date */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Visit Date
            </label>
            <input
              type="date"
              name="visitDate"
              value={form.visitDate}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-warmgray focus:outline-none focus:ring-2 focus:ring-forest bg-white text-ink text-base"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Any notes about this college..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-warmgray focus:outline-none focus:ring-2 focus:ring-forest bg-white text-ink text-base resize-none"
            />
          </div>

          {/* Follow-Ups */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-ink">Follow-Ups</label>
              <button
                onClick={addFollowUp}
                className="text-xs font-semibold text-forest border border-forest px-3 py-1 rounded-lg hover:bg-forest/5 transition-colors"
              >
                + Add Follow-Up
              </button>
            </div>

            {(form.followUps || []).length === 0 && (
              <p className="text-xs text-sage text-center py-3 bg-white rounded-xl border border-warmgray">
                No follow-ups added yet
              </p>
            )}

            <div className="space-y-3">
              {(form.followUps || []).map((fu, index) => (
                <div
                  key={fu._id || index}
                  className={`rounded-xl border p-3 space-y-2
                    ${fu.isDone
                      ? 'bg-green-50 border-green-200 opacity-70'
                      : 'bg-white border-warmgray'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-ink">
                      Follow-Up #{index + 1}
                      {fu.isDone && (
                        <span className="ml-2 text-green-600">✓ Done</span>
                      )}
                    </p>
                    <div className="flex gap-2">
                      {fu._id && !fu.isDone && isEditing && (
                        <button
                          onClick={() => handleMarkDone(fu._id!)}
                          disabled={markingDone === fu._id}
                          className="text-xs text-green-700 border border-green-300 px-2 py-0.5 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
                        >
                          {markingDone === fu._id ? 'Saving...' : 'Mark Done'}
                        </button>
                      )}
                      {!fu.isDone && (
                        <button
                          onClick={() => removeFollowUp(index)}
                          className="text-xs text-red-500 border border-red-200 px-2 py-0.5 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {!fu.isDone && (
                    <>
                      <input
                        type="date"
                        value={fu.followUpDate || ''}
                        onChange={(e) => handleFollowUpChange(index, 'followUpDate', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-warmgray focus:outline-none focus:ring-2 focus:ring-forest bg-white text-ink text-sm"
                      />
                      <textarea
                        value={fu.followUpNotes || ''}
                        onChange={(e) => handleFollowUpChange(index, 'followUpNotes', e.target.value)}
                        placeholder="Notes for this follow-up..."
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-warmgray focus:outline-none focus:ring-2 focus:ring-forest bg-white text-ink text-sm resize-none"
                      />
                    </>
                  )}

                  {fu.isDone && fu.doneAt && (
                    <p className="text-xs text-green-600">
                      Completed on {new Date(fu.doneAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={() => handleSubmit()}
            disabled={loading}
            className="w-full bg-forest hover:bg-forest-dark disabled:bg-forest/40 text-white font-semibold py-3 rounded-xl transition-colors text-base"
          >
            {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add College'}
          </button>

          {/* Mark as Completed */}
          {isEditing && college?.status !== 'Completed' && college?.visitDate && (
            <button
              onClick={() => handleMarkCompleted()}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold py-3 rounded-xl transition-colors text-base"
            >
              ✓ Mark as Completed
            </button>
          )}

          {/* Delete */}
          {isEditing && (
            <div className="pt-4 mt-2 border-t border-warmgray">
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full text-red-500 font-medium py-3 rounded-xl border border-red-200 hover:bg-red-50 transition-colors text-base bg-white"
                >
                  Delete College
                </button>
              ) : (
                <div className="bg-red-50 rounded-xl p-4 space-y-3">
                  <p className="text-red-700 text-sm font-medium text-center">
                    Are you sure? This cannot be undone.
                  </p>
                  <textarea
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder="Reason for deletion (required)..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl border border-red-200 bg-white text-ink text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setConfirmDelete(false); setDeleteReason(''); }}
                      className="flex-1 py-2 rounded-xl border border-warmgray text-sage font-medium text-sm bg-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={loading || !deleteReason.trim()}
                      className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-medium text-sm transition-colors"
                    >
                      {loading ? 'Deleting...' : 'Yes, Delete'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Postpone Modal */}
      {showPostponeModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-4">
            <h3 className="font-bold text-ink text-base">Reason Required</h3>
            <p className="text-sm text-sage">
              {postponeAction === 'complete'
                ? 'This college has an overdue date. Please provide a reason for marking it as completed.'
                : `The ${pendingPostponeField === 'followUpDate' ? 'follow-up' : 'visit'} date was overdue. Please provide a reason for rescheduling.`
              }
            </p>
            <textarea
              value={postponeReason}
              onChange={(e) => setPostponeReason(e.target.value)}
              placeholder="e.g. Visit completed despite delay..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-warmgray text-ink text-sm resize-none focus:outline-none focus:ring-2 focus:ring-forest"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowPostponeModal(false); setPostponeReason(''); }}
                className="flex-1 py-2 rounded-xl border border-warmgray text-sage text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!postponeReason.trim()) return;
                  setShowPostponeModal(false);
                  if (postponeAction === 'complete') {
                    handleMarkCompleted(postponeReason.trim());
                  } else {
                    handleSubmit(postponeReason.trim());
                  }
                  setPostponeReason('');
                }}
                disabled={!postponeReason.trim()}
                className="flex-1 py-2 rounded-xl bg-forest text-white text-sm disabled:bg-forest/40"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollegeForm;