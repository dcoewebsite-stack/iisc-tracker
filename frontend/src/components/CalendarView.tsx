import { useState } from 'react';
import type { College } from '../types/college';

interface CalendarViewProps {
  colleges: College[];
}

interface DayEvent {
  college: College;
  type: 'visit' | 'followup';
}

const CalendarView = ({ colleges }: CalendarViewProps) => {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const eventMap: Record<string, DayEvent[]> = {};
  colleges.forEach((college) => {
    if (college.visitDate) {
      const key = new Date(college.visitDate).toISOString().split('T')[0];
      if (!eventMap[key]) eventMap[key] = [];
      eventMap[key].push({ college, type: 'visit' });
    }
    if (college.followUpDate) {
      const key = new Date(college.followUpDate).toISOString().split('T')[0];
      if (!eventMap[key]) eventMap[key] = [];
      eventMap[key].push({ college, type: 'followup' });
    }
  });

  const today = new Date();
  const todayKey = today.toISOString().split('T')[0];

  const formatKey = (year: number, month: number, day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const renderMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });

    const cells = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`e-${i}`} className="h-8" />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const key = formatKey(year, month, d);
      const events = eventMap[key] || [];
      const hasEvents = events.length > 0;
      const isToday = key === todayKey;
      const isSelected = selectedDay === key;

      cells.push(
        <div
          key={key}
          onClick={() => hasEvents && setSelectedDay(isSelected ? null : key)}
          className={`h-8 flex flex-col items-center justify-center rounded-lg text-xs font-medium transition-all select-none mx-0.5
            ${hasEvents ? 'cursor-pointer' : 'cursor-default'}
            ${isSelected
              ? 'bg-forest text-white'
              : isToday
              ? 'bg-forest/20 text-forest font-bold'
              : hasEvents
              ? 'bg-warmgray/80 text-ink'
              : 'bg-warmgray/30 text-ink hover:bg-warmgray/60'
            }`}
        >
          <span className="leading-none text-[11px]">{d}</span>
          {hasEvents && (
            <div className={`w-1 h-1 rounded-full mt-0.5
              ${isSelected ? 'bg-white' : 'bg-forest'}`}
            />
          )}
        </div>
      );
    }

    return (
      <div className="mb-3">
        <p className="text-xs font-semibold text-ink mb-2">{monthName}</p>
        <div className="grid grid-cols-7 mb-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="h-6 flex items-center justify-center text-[10px] text-sage">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells}
        </div>
      </div>
    );
  };

  const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const currMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const selectedEvents = selectedDay ? (eventMap[selectedDay] || []) : [];

  return (
    <div className="bg-white rounded-2xl p-4 border border-warmgray shadow-sm">
      {renderMonth(prevMonth)}
      <div className="border-t border-warmgray my-3" />
      {renderMonth(currMonth)}

      {selectedDay && selectedEvents.length > 0 && (
        <div className="mt-3 border-t border-warmgray pt-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-ink">
              {new Date(selectedDay + 'T00:00:00').toLocaleDateString('default', {
                weekday: 'short', month: 'short', day: 'numeric',
              })}
            </p>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-sage text-lg leading-none hover:text-ink"
            >
              ×
            </button>
          </div>
          <div className="space-y-2">
            {selectedEvents.map((event, i) => (
              <div key={i} className="bg-cream rounded-xl px-3 py-2 border border-warmgray">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink truncate flex-1">
                    {event.college.collegeName}
                  </p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap
                    ${event.type === 'visit'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-amber-100 text-amber-700'}`}>
                    {event.type === 'visit' ? 'Visit' : 'Follow-up'}
                  </span>
                </div>
                {event.college.assignedEmployee && (
                  <p className="text-xs text-sage mt-0.5">{event.college.assignedEmployee}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;