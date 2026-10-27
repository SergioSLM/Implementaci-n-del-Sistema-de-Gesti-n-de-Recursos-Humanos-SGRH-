// pages/hr/training/programs/show.tsx
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Edit, Users, Calendar, BarChart, CheckCircle, BookOpen, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function TrainingProgramShow() {
  const { t } = useTranslation();
  const { trainingProgram, statistics } = usePage().props as any;

  const handleBack = () => {
    router.get(route('hr.training-programs.index'));
  };

  const handleEdit = () => {
    router.get(route('hr.training-programs.index'), {}, {
      onSuccess: () => {
        // Trigger edit modal - this would need to be implemented
        // For now, just redirect back to index
      }
    });
  };

  const pageActions = [
    {
      label: t('Back'),
      icon: <ArrowLeft className="h-4 w-4 rtl:rotate-180" />,
      variant: 'outline' as const,
      onClick: handleBack
    },
  ];

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Training & Development') },
    { title: t('Training Programs'), href: route('hr.training-programs.index') },
    { title: trainingProgram.name }
  ];

  const statusClasses = {
    'draft': 'bg-gray-50 text-gray-700 ring-gray-600/20',
    'active': 'bg-green-50 text-green-700 ring-green-600/20',
    'completed': 'bg-blue-50 text-blue-700 ring-blue-600/20',
    'cancelled': 'bg-red-50 text-red-700 ring-red-600/20'
  };

  return (
    <PageTemplate
      title={trainingProgram.name}
      description={t("View the details, sessions, and enrollments for this training program.")}
      url={`/hr/training/programs/${trainingProgram.id}`}
      actions={pageActions}
      breadcrumbs={breadcrumbs}
    >
      <style>{`
        main { max-width: 100vw; overflow-x: clip !important; }
        body { overflow-x: clip !important; }
      `}</style>
      {/* Program Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 min-w-0">
        <Card className="lg:col-span-2 min-w-0">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg font-semibold break-words">{t('Program Details')}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4 min-w-0">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">{t('Training Type')}</p>
              <p className="text-sm font-medium break-words">{trainingProgram.training_type?.name || '-'}</p>
            </div>

            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">{t('Description')}</p>
              <p className="text-sm break-words leading-relaxed">{trainingProgram.description || '-'}</p>
            </div>

            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">{t('Prerequisites')}</p>
              <p className="text-sm break-words leading-relaxed">{trainingProgram.prerequisites || '-'}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {trainingProgram.is_mandatory && (
                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 whitespace-nowrap">
                  {t('Mandatory')}
                </Badge>
              )}
              {trainingProgram.is_self_enrollment && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 whitespace-nowrap">
                  {t('Self-Enrollment')}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg font-semibold">{t('Program Info')}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4 min-w-0">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">{t('Status')}</p>
              <div>
                <Badge variant="outline" className={`text-xs ring-1 ring-inset whitespace-nowrap ${statusClasses[trainingProgram.status] || ''}`}>
                  {trainingProgram.status ? trainingProgram.status.charAt(0).toUpperCase() + trainingProgram.status.slice(1) : ''}
                </Badge>
              </div>
            </div>

            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">{t('Duration')}</p>
              <p className="text-sm font-medium">{trainingProgram.duration ? `${trainingProgram.duration} ${t('hours')}` : '-'}</p>
            </div>

            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">{t('Cost')}</p>
              <p className="text-sm font-mono font-medium">{trainingProgram.cost ? window.appSettings?.formatCurrency(parseFloat(trainingProgram.cost)) : '-'}</p>
            </div>

            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">{t('Capacity')}</p>
              <p className="text-sm font-medium">{trainingProgram.capacity || '-'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6 min-w-0">
        <div className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 min-w-0">
          <div className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-blue-50 dark:bg-blue-900/20 rounded-bl-full pointer-events-none rtl:rounded-bl-none rtl:rounded-br-full rtl:left-0 rtl:right-auto" />
          <div className="relative flex items-start justify-between min-w-0 gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 break-words">{t('Total Sessions')}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{statistics.totalSessions}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium break-words">{t('All sessions')}</span>
              </div>
            </div>
            <div className="relative z-10 p-2.5 sm:p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl shrink-0">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 min-w-0">
          <div className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-green-50 dark:bg-green-900/20 rounded-bl-full pointer-events-none rtl:rounded-bl-none rtl:rounded-br-full rtl:left-0 rtl:right-auto" />
          <div className="relative flex items-start justify-between min-w-0 gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 break-words">{t('Completed Sessions')}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{statistics.completedSessions}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-xs text-green-600 dark:text-green-400 font-medium break-words">{statistics.totalSessions > 0 ? Math.round((statistics.completedSessions / statistics.totalSessions) * 100) : 0}% {t('completion rate')}</span>
              </div>
            </div>
            <div className="relative z-10 p-2.5 sm:p-3 bg-green-100 dark:bg-green-900/40 rounded-xl shrink-0">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 min-w-0">
          <div className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-purple-50 dark:bg-purple-900/20 rounded-bl-full pointer-events-none rtl:rounded-bl-none rtl:rounded-br-full rtl:left-0 rtl:right-auto" />
          <div className="relative flex items-start justify-between min-w-0 gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 break-words">{t('Total Employees')}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{statistics.totalTrainings}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-xs text-purple-600 dark:text-purple-400 font-medium break-words">{t('Enrolled employees')}</span>
              </div>
            </div>
            <div className="relative z-10 p-2.5 sm:p-3 bg-purple-100 dark:bg-purple-900/40 rounded-xl shrink-0">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 min-w-0">
          <div className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-amber-50 dark:bg-amber-900/20 rounded-bl-full pointer-events-none rtl:rounded-bl-none rtl:rounded-br-full rtl:left-0 rtl:right-auto" />
          <div className="relative flex items-start justify-between min-w-0 gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 break-words">{t('Completed Trainings')}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{statistics.completedTrainings}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium break-words">{statistics.totalTrainings > 0 ? Math.round((statistics.completedTrainings / statistics.totalTrainings) * 100) : 0}% {t('completion rate')}</span>
              </div>
            </div>
            <div className="relative z-10 p-2.5 sm:p-3 bg-amber-100 dark:bg-amber-900/40 rounded-xl shrink-0">
              <BarChart className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
        <Card className="min-w-0">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg font-semibold">{t('Session Progress')}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="space-y-2 min-w-0">
              <div className="flex justify-between text-xs sm:text-sm font-medium gap-2">
                <span className="truncate">{t('Sessions Completed')}</span>
                <span className="shrink-0">{statistics.completedSessions || 0}/{statistics.totalSessions || 0}</span>
              </div>
              <Progress value={statistics.totalSessions > 0 ? (statistics.completedSessions / statistics.totalSessions) * 100 : 0} className="h-2" />
              <p className="text-xs text-muted-foreground truncate">
                {statistics.totalSessions > 0 ? Math.round((statistics.completedSessions / statistics.totalSessions) * 100) : 0}% {t('of sessions completed')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg font-semibold">{t('Employee Progress')}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="space-y-2 min-w-0">
              <div className="flex justify-between text-xs sm:text-sm font-medium gap-2">
                <span className="truncate">{t('Employees Completed')}</span>
                <span className="shrink-0">{statistics.completedTrainings || 0}/{statistics.totalTrainings || 0}</span>
              </div>
              <Progress value={statistics.totalTrainings > 0 ? (statistics.completedTrainings / statistics.totalTrainings) * 100 : 0} className="h-2" />
              <p className="text-xs text-muted-foreground truncate">
                {statistics.totalTrainings > 0 ? Math.round((statistics.completedTrainings / statistics.totalTrainings) * 100) : 0}% {t('of employees completed')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTemplate>
  );
}
