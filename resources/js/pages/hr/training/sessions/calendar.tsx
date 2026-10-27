
// pages/hr/training/sessions/calendar.tsx
import { useState, useEffect, useRef } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { List } from 'lucide-react';
import { Card } from '@/components/ui/card';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TrainingSessionsCalendar() {
  const { t, i18n } = useTranslation();
  const { calendarEvents, trainingPrograms, filters: pageFilters = {} } = usePage().props as any;

  // State
  const [selectedProgram, setSelectedProgram] = useState(pageFilters.training_program_id || 'all');
  const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || 'all');
  const calendarRef = useRef<FullCalendar | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        if (window.innerWidth < 768) {
          if (calendarApi.view.type !== 'timeGridDay') {
            calendarApi.changeView('timeGridDay');
          }
        } else {
          if (calendarApi.view.type === 'timeGridDay') {
            calendarApi.changeView('dayGridMonth');
          }
        }
      }
    };

    // Run initial check after component mount
    const timer = setTimeout(handleResize, 100);
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleViewList = () => {
    router.get(route('hr.training-sessions.index'));
  };

  const handleEventClick = (info: any) => {
    const eventId = info.event.id;
    router.get(route('hr.training-sessions.show', eventId));
  };

  const handleFilterChange = (field: string, value: string) => {
    router.get(route('hr.training-sessions.calendar'), {
      [field]: value === 'all' ? undefined : value,
      ...(field !== 'training_program_id' && selectedProgram !== 'all' ? { training_program_id: selectedProgram } : {}),
      ...(field !== 'status' && selectedStatus !== 'all' ? { status: selectedStatus } : {})
    }, { preserveState: true });
  };

  // Define page actions
  const pageActions = [
    {
      label: t('List View'),
      icon: <List className="h-4 w-4 shrink-0" />,
      variant: 'outline' as const,
      onClick: handleViewList
    }
  ];

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Training & Development') },
    { title: t('Training Sessions'), href: route('hr.training-sessions.index') },
    { title: t('Calendar') }
  ];

  // Prepare training program options for filter
  const trainingProgramOptions = [
    { value: 'all', label: t('All Programs') },
    ...(trainingPrograms || []).map((program: any) => ({
      value: program.id.toString(),
      label: program.name
    }))
  ];

  // Prepare status options for filter
  const statusOptions = [
    { value: 'all', label: t('All Statuses') },
    { value: 'scheduled', label: t('Scheduled') },
    { value: 'in_progress', label: t('In Progress') },
    { value: 'completed', label: t('Completed') },
    { value: 'cancelled', label: t('Cancelled') }
  ];

  return (
    <PageTemplate
      title={t("Training Sessions Calendar")}
      description={t("View all upcoming and past training sessions in a calendar view.")}
      url="/hr/training/sessions/calendar"
      actions={pageActions}
      breadcrumbs={breadcrumbs}
    >
      <style>
        {`
        main { max-width: 100vw; overflow-x: clip !important; }
        body { overflow-x: clip !important; }
        .fc .fc-event-title {
            font-size: 0.75rem;
        }
        .fc .fc-daygrid-event-harness {
            margin-bottom: 3px !important;
        }
        .fc .fc-popover-body {
            max-height: 130px;
            overflow-y: auto;
        }
        .fc .fc-toolbar {
            flex-wrap: wrap;
            gap: 0.5rem;
        }
        @media (max-width: 767px) {
            .fc .fc-toolbar-chunk:nth-child(3) {
                display: none !important;
            }
            .fc .fc-toolbar {
                flex-direction: row;
                justify-content: space-between;
                align-items: center;
                gap: 0.5rem;
            }
            .fc .fc-toolbar-chunk {
                display: flex;
                align-items: center;
            }
            .fc .fc-toolbar-title {
                font-size: 1rem !important;
            }
        }
        `}
      </style>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-4 min-w-0">
        <div className="w-full sm:w-64 min-w-0">
          <label className="block text-xs sm:text-sm font-medium mb-1">{t('Program')}</label>
          <Select
            value={selectedProgram}
            onValueChange={(value) => {
              setSelectedProgram(value);
              handleFilterChange('training_program_id', value);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('All Programs')} />
            </SelectTrigger>
            <SelectContent>
              {trainingProgramOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-64 min-w-0">
          <label className="block text-xs sm:text-sm font-medium mb-1">{t('Status')}</label>
          <Select
            value={selectedStatus}
            onValueChange={(value) => {
              setSelectedStatus(value);
              handleFilterChange('status', value);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('All Statuses')} />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Calendar */}
      <Card className="p-3 sm:p-4 min-w-0 overflow-hidden">
        <div className="w-full min-h-[600px]">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            locale={i18n.language || 'en'}
            initialView={typeof window !== 'undefined' && window.innerWidth < 768 ? 'timeGridDay' : 'dayGridMonth'}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            buttonText={{
              today: t('Today'),
              month: t('Month'),
              week: t('Week'),
              day: t('Day')
            }}
            events={calendarEvents}
            eventClick={handleEventClick}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: 'short'
            }}
            height="auto"
            eventDisplay="block"
            eventContent={(eventInfo) => {
              return (
                <div className="p-1 overflow-hidden min-w-0">
                  <div className="font-medium text-xs truncate">{eventInfo.event.title}</div>
                  {eventInfo.view.type !== 'dayGridMonth' && (
                    <div className="text-xs truncate">{eventInfo.event.extendedProps.program}</div>
                  )}
                </div>
              );
            }}
          />
        </div>
      </Card>
    </PageTemplate>
  );
}
