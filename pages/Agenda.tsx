import React, { useState, useEffect } from 'react';
import { formatDate, formatTime } from '../lib/dateUtils';

import NewAppointmentModal from '../components/NewAppointmentModal';
import EventDetailsModal from '../components/EventDetailsModal';
import { scheduleService } from '../lib/schedule';
import { supabase } from '../lib/supabase';
import { DBAppointment } from '../types';

interface CalendarEvent {
  id: string;
  title: string;
  patient: string;
  start: Date;
  end: Date;
  color: 'blue' | 'green' | 'purple' | 'orange';
  status: 'confirmed' | 'pending';
}

type ViewMode = 'day' | 'week' | 'month';

const Agenda: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [currentTimePosition, setCurrentTimePosition] = useState(0);

  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Calculate Date Range based on ViewMode
  const getDateRange = () => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    if (viewMode === 'day') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (viewMode === 'week') {
      start.setDate(currentDate.getDate() - currentDate.getDay());
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 7);
      end.setHours(23, 59, 59, 999);
    } else if (viewMode === 'month') {
      // Start from the first day of the visual grid (potentially previous month)
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      start.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay());
      start.setHours(0, 0, 0, 0);

      // End at the last day of the visual grid (potentially next month)
      // Usually displayed as 6 weeks (42 days) to cover all months
      const endOfGrid = new Date(start);
      endOfGrid.setDate(start.getDate() + 42);
      return { start, end: endOfGrid };
    }

    return { start, end };
  };

  const fetchAppointments = async () => {
    try {
      const { start, end } = getDateRange();
      const googleData = await scheduleService.listEvents(start, end);

      if (googleData.items) {
        const formattedEvents: CalendarEvent[] = googleData.items.map((item: any) => ({
          id: item.id,
          title: item.summary || 'Sem título',
          patient: item.description ? item.description.split('\n')[0] : 'Via Google Calendar',
          start: new Date(item.start.dateTime || item.start.date),
          end: new Date(item.end.dateTime || item.end.date),
          color: 'blue',
          status: 'confirmed'
        }));
        setEvents(formattedEvents);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [currentDate, viewMode]);

  // Update Time Line Position (only relevant for day/week)
  useEffect(() => {
    const updateTimePosition = () => {
      const now = new Date();
      const startOfDay = new Date();
      startOfDay.setHours(7, 0, 0, 0);
      const diffMinutes = (now.getTime() - startOfDay.getTime()) / 60000;
      setCurrentTimePosition((diffMinutes / 60) * 64);
    };
    updateTimePosition();
    const interval = setInterval(updateTimePosition, 60000);
    return () => clearInterval(interval);
  }, [currentDate]);

  // Utility to get visible days
  const getVisibleDays = () => {
    const days = [];
    if (viewMode === 'day') {
      days.push(new Date(currentDate));
    } else if (viewMode === 'week') {
      const start = new Date(currentDate);
      start.setDate(currentDate.getDate() - currentDate.getDay());
      for (let i = 0; i < 7; i++) {
        const next = new Date(start);
        next.setDate(start.getDate() + i);
        days.push(next);
      }
    } else if (viewMode === 'month') {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      start.setDate(start.getDate() - start.getDay()); // Start of grid
      for (let i = 0; i < 42; i++) { // 6 weeks
        const next = new Date(start);
        next.setDate(start.getDate() + i);
        days.push(next);
      }
    }
    return days;
  };

  const visibleDays = getVisibleDays();
  const hours = Array.from({ length: 13 }, (_, i) => i + 7); // 07:00 to 19:00

  // Navigation logic
  const navigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (viewMode === 'month') {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const colorStyles = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-600', hover: 'hover:bg-blue-200' },
    green: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-600', hover: 'hover:bg-emerald-200' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-600', hover: 'hover:bg-purple-200' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-600', hover: 'hover:bg-orange-200' },
  };

  return (
    <div className="flex flex-col h-full bg-white animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between px-4 md:px-6 py-4 border-b border-[#e3e0de] gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <button
              onClick={goToToday}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-[#e3e0de] rounded hover:bg-gray-50 transition-colors"
            >
              Hoje
            </button>
            <div className="flex items-center gap-1">
              <button onClick={() => navigate('prev')} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600">
                <span className="material-symbols-outlined text-xl">chevron_left</span>
              </button>
              <button onClick={() => navigate('next')} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600">
                <span className="material-symbols-outlined text-xl">chevron_right</span>
              </button>
            </div>
          </div>
          <h2 className="text-xl font-medium text-text-main capitalize">
            {viewMode === 'day'
              ? formatDate(currentDate, { day: 'numeric', month: 'long', year: 'numeric' })
              : formatDate(currentDate, { month: 'long', year: 'numeric' })
            }
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-lg self-start md:self-auto">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 text-xs font-medium rounded transition-all ${viewMode === 'day' ? 'bg-white shadow-sm text-gray-900 font-bold' : 'text-gray-600 hover:bg-white/50'}`}
            >
              Dia
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-xs font-medium rounded transition-all ${viewMode === 'week' ? 'bg-white shadow-sm text-gray-900 font-bold' : 'text-gray-600 hover:bg-white/50'}`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-xs font-medium rounded transition-all ${viewMode === 'month' ? 'bg-white shadow-sm text-gray-900 font-bold' : 'text-gray-600 hover:bg-white/50'}`}
            >
              Mês
            </button>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            <span className="text-sm font-bold">Agendar</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-auto relative flex flex-col">

        {/* Header Row (Days of Week) */}
        <div className={`flex border-b border-[#e3e0de] sticky top-0 bg-white z-20`}>
          {/* Spacer for time column only in day/week view */}
          {viewMode !== 'month' && <div className="w-16 shrink-0 border-r border-[#e3e0de]"></div>}

          <div className={`flex-1 grid ${viewMode === 'month' || viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-1'}`}>
            {(viewMode === 'day' ? [currentDate] : viewMode === 'week' ? visibleDays : visibleDays.slice(0, 7)).map((date, index) => {
              const active = isToday(date);
              return (
                <div key={index} className="py-3 text-center border-r border-[#e3e0de] last:border-r-0 bg-white">
                  <span className={`text-xs font-medium uppercase mb-1 block ${active ? 'text-primary' : 'text-text-muted'}`}>
                    {formatDate(date, { weekday: viewMode === 'month' ? 'short' : 'long' }).replace('.', '')}
                  </span>
                  {/* Only show date number in header for Day/Week views */}
                  {viewMode !== 'month' && (
                    <div className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full text-lg ${active ? 'bg-primary text-white font-bold' : 'text-text-main'}`}>
                      {date.getDate()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Body */}
        {viewMode === 'month' ? (
          /* Month View Grid */
          <div className="flex-1 grid grid-cols-7 auto-rows-fr min-h-[600px] bg-gray-50 min-w-[700px] md:min-w-0">
            {visibleDays.map((date, index) => {
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();
              const dayEvents = events.filter(e =>
                e.start.getDate() === date.getDate() &&
                e.start.getMonth() === date.getMonth() &&
                e.start.getFullYear() === date.getFullYear()
              );
              const active = isToday(date);

              return (
                <div
                  key={index}
                  className={`border-b border-r border-[#e3e0de] p-2 min-h-[100px] hover:bg-white transition-colors cursor-pointer ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}`}
                  onClick={() => {
                    if (dayEvents.length === 0) {
                      // Optional: Open create modal pre-filled?
                      // For now logic is just simple nav or do nothing
                    }
                  }}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${active ? 'bg-primary text-white' : ''}`}>
                      {date.getDate()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {dayEvents.map(event => {
                      const style = colorStyles[event.color];
                      return (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(event);
                          }}
                          className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium border-l-2 ${style.bg} ${style.text} ${style.border}`}
                        >
                          {formatTime(event.start, { hour: '2-digit', minute: '2-digit' })} {event.title}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Week/Day Time Grid */
          <div className="flex flex-1 relative min-h-[800px]">
            {/* Time Column */}
            <div className="w-16 shrink-0 border-r border-[#e3e0de] bg-white z-10 text-xs text-text-muted text-right pr-2">
              {hours.map((hour) => (
                <div key={hour} className="h-16 border-b border-transparent relative">
                  <span className="absolute -top-2.5 right-2">{hour.toString().padStart(2, '0')}:00</span>
                </div>
              ))}
            </div>

            {/* Grid Body */}
            <div className={`flex-1 grid relative ${viewMode === 'day' ? 'grid-cols-1' : 'grid-cols-7 min-w-[700px] md:min-w-0'}`}>
              {/* Background Grid Lines */}
              {hours.map((_, i) => (
                <div key={i} className="absolute w-full border-b border-[#e3e0de]" style={{ top: `${i * 64}px` }}></div>
              ))}

              {/* Current Time Indicator */}
              {isToday(visibleDays.find(d => isToday(d)) || new Date(0)) && currentTimePosition > 0 && currentTimePosition < hours.length * 64 && (
                <div className="absolute w-full z-10 pointer-events-none" style={{ top: `${currentTimePosition}px` }}>
                  <div className="absolute left-0 -ml-1.5 w-3 h-3 bg-red-500 rounded-full -mt-1.5 z-20"></div>
                  <div className="w-full border-t-2 border-red-500"></div>
                </div>
              )}

              {/* Columns */}
              {visibleDays.map((date, dayIndex) => {
                const dayEvents = events.filter(e =>
                  e.start.getDate() === date.getDate() &&
                  e.start.getMonth() === date.getMonth() &&
                  e.start.getFullYear() === date.getFullYear()
                );

                return (
                  <div key={dayIndex} className="relative border-r border-[#e3e0de] last:border-r-0 h-full hover:bg-gray-50/30 transition-colors group">
                    {dayEvents.map(event => {
                      const startHour = event.start.getHours();
                      const startMin = event.start.getMinutes();
                      const endHour = event.end.getHours();
                      const endMin = event.end.getMinutes();

                      // Basic clash handling or overlay logic essentially relies on absolute positioning
                      // 7 is start hour
                      const top = ((startHour - 7) * 64) + ((startMin / 60) * 64);
                      const durationHours = (endHour - startHour) + ((endMin - startMin) / 60);
                      const height = Math.max(durationHours * 64, 20); // Min height 20px

                      const style = colorStyles[event.color];

                      return (
                        <div
                          key={event.id}
                          onClick={() => setSelectedEvent(event)}
                          className={`absolute inset-x-1 rounded-md border-l-4 p-1.5 text-xs shadow-sm cursor-pointer transition-all z-10 ${style.bg} ${style.border} ${style.hover}`}
                          style={{ top: `${top}px`, height: `${height}px` }}
                        >
                          <p className={`font-bold ${style.text} truncate`}>{event.title}</p>
                          {height > 30 && (
                            <p className={`${style.text} truncate opacity-80`}>
                              {formatTime(event.start, { hour: '2-digit', minute: '2-digit' })} - {formatTime(event.end, { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                          {height > 45 && (
                            <p className="text-gray-600 truncate mt-0.5 font-medium">{event.patient}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <NewAppointmentModal
          onClose={() => {
            setShowModal(false);
            fetchAppointments();
          }}
        />
      )}

      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onDeleted={() => {
            setSelectedEvent(null);
            fetchAppointments();
          }}
          onUpdated={() => {
            setSelectedEvent(null);
            fetchAppointments();
          }}
        />
      )}
    </div>
  );
};

export default Agenda;