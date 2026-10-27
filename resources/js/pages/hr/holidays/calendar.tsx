// pages/hr/holidays/calendar.tsx
import { useState, useEffect, useRef } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { List, Download, FileText } from 'lucide-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export default function HolidayCalendar() {
  const { t, i18n } = useTranslation();
  const { calendarEvents, branches, categories, years, currentYear, filters = {} } = usePage().props as any;
  
  // State
  const [selectedCategory, setSelectedCategory] = useState(filters.category || '');
  const [selectedBranch, setSelectedBranch] = useState(filters.branch_id || '');
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const calendarRef = useRef<FullCalendar | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        if (window.innerWidth < 1024) {
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

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Handle event click
  const handleEventClick = (clickInfo: any) => {
    const event = clickInfo.event;
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      ...event.extendedProps
    });
    setIsDialogOpen(true);
    clickInfo.jsEvent?.target?.closest('.fc-popover')?.querySelector<HTMLElement>('.fc-popover-close')?.click();
  };
  
  
  

  
  // Handle back to list view
  const handleBackToList = () => {
    router.get(route('hr.holidays.index'), {
      year: selectedYear,
      category: selectedCategory || undefined,
      branch_id: selectedBranch || undefined
    });
  };
  
  // Handle export PDF
  const handleExportPdf = () => {
    window.open(route('hr.holidays.export.pdf', {
      year: selectedYear,
      category: selectedCategory || undefined,
      branch_id: selectedBranch || undefined
    }), '_blank');
  };
  
  // Handle export iCal
  const handleExportIcal = () => {
    window.open(route('hr.holidays.export.ical', {
      year: selectedYear,
      category: selectedCategory || undefined,
      branch_id: selectedBranch || undefined
    }), '_blank');
  };
  

  
  // Define page actions
  const pageActions = [
    {
      label: t('List View'),
      icon: <List className="h-4 w-4" />,
      variant: 'outline' as const,
      onClick: handleBackToList
    },
    {
      label: t('Export PDF'),
      icon: <FileText className="h-4 w-4" />,
      variant: 'outline' as const,
      onClick: handleExportPdf
    },
    {
      label: t('Export iCal'),
      icon: <Download className="h-4 w-4" />,
      variant: 'outline' as const,
      onClick: handleExportIcal
    }
  ];
  
  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Organization Structure') },
    { title: t('Holidays'), href: route('hr.holidays.index') },
    { title: t('Calendar') }
  ];

  return (
    <PageTemplate 
      title={`${t("Holiday Calendar")} - ${selectedYear}`} 
      url="/hr/holidays/calendar"
      actions={pageActions}
      breadcrumbs={breadcrumbs}
    >
      <style>
        {`
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
            gap: 0.75rem;
        }
        @media (max-width: 1023px) {
            .fc .fc-toolbar-chunk:nth-child(3) {
                display: none !important;
            }
            .fc .fc-toolbar-chunk {
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .fc .fc-toolbar {
                justify-content: space-between;
            }
            .fc .fc-toolbar-title {
                font-size: 1.125rem !important;
            }
        }
        `}
      </style>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Legend */}
        <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex-wrap">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('Legend')}:</span>
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-50 text-xs">
            {t('National')}
          </Badge>
          <Badge variant="secondary" className="bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 hover:bg-purple-50 text-xs">
            {t('Religious')}
          </Badge>
          <Badge variant="secondary" className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-50 text-xs">
            {t('Company Specific')}
          </Badge>
          <Badge variant="secondary" className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-50 text-xs">
            {t('Regional')}
          </Badge>
        </div>

        {/* Calendar */}
        <div className="p-3 sm:p-4" style={{ height: '750px' }}>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={typeof window !== 'undefined' && window.innerWidth < 1024 ? 'timeGridDay' : 'dayGridMonth'}
            locale={i18n.language || 'en'}
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
            height="100%"
            eventClick={handleEventClick}
            dayMaxEvents={true}
            weekends={true}
            displayEventTime={false}
          />
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-semibold break-words">{selectedEvent?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              {selectedEvent?.category && <Badge variant="outline" className="text-xs">{selectedEvent?.category}</Badge>}
              {selectedEvent?.is_half_day && (
                <Badge variant="secondary" className="text-xs">{t('Half Day')}</Badge>
              )}
              {selectedEvent?.is_paid !== undefined && (
                selectedEvent?.is_paid ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">{t('Paid')}</Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs">{t('Unpaid')}</Badge>
                )
              )}
            </div>
            {selectedEvent?.description && (
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">{t('Description')}</p>
                <p className="text-xs sm:text-sm font-medium break-words mt-0.5">{selectedEvent.description}</p>
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">{t('Start Date')}</p>
              <p className="text-xs sm:text-sm font-medium break-words mt-0.5">
                {selectedEvent?.start ? window.appSettings?.formatDateTimeSimple(selectedEvent.start, false) || new Date(selectedEvent.start).toLocaleDateString() : ''}
              </p>
            </div>
            {selectedEvent?.end && (
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">{t('End Date')}</p>
                <p className="text-xs sm:text-sm font-medium break-words mt-0.5">
                  {window.appSettings?.formatDateTimeSimple(selectedEvent.end, false) || new Date(selectedEvent.end).toLocaleDateString()}
                </p>
              </div>
            )}
            {selectedEvent?.branches && selectedEvent.branches.length > 0 && (
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">{t('Branches')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedEvent.branches.map((branch: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs break-words">{branch}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </PageTemplate>
  );
}