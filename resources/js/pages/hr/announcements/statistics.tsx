import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Eye, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

export default function AnnouncementStatistics() {
  const { t } = useTranslation();
  const { announcement, totalEmployees, viewedCount, viewPercentage, departmentStats, branchStats } = usePage().props as any;

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Organization Structure') },
    { title: t('Announcements'), href: route('hr.announcements.index') },
    { title: t('Statistics') }
  ];

  const pageActions = [
    {
      label: t('Back'),
      icon: <ArrowLeft className="h-4 w-4 rtl:rotate-180" />,
      variant: 'outline',
      onClick: () => router.get(route('hr.announcements.index'))
    }
  ];

  return (
    <PageTemplate
      title={t("Announcement Statistics")}
      description={t("View read rates and engagement stats for your announcements.")}
      url="/hr/announcements/statistics"
      actions={pageActions}
      breadcrumbs={breadcrumbs}
    >
      {/* Announcement Details */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
            <span className="break-words">{announcement.title}</span>
            <div className="flex flex-wrap gap-2 shrink-0">
              {announcement.is_featured && (
                <Badge variant="secondary" className="bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-xs">
                  {t('Featured')}
                </Badge>
              )}
              {announcement.is_high_priority && (
                <Badge variant="secondary" className="bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs">
                  {t('High Priority')}
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide mb-1">{t('Category')}</p>
              <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 break-words">{announcement.category}</p>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide mb-1">{t('Target Branch')}</p>
              <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 break-words">{announcement.branches?.[0]?.name || t('Company-wide')}</p>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide mb-1">{t('Target Department')}</p>
              <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 break-words">{announcement.departments?.[0]?.name || t('All Departments')}</p>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide mb-1">{t('Start Date')}</p>
              <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 break-words">{announcement.start_date ? (window.appSettings?.formatDateTimeSimple(announcement.start_date, false) || new Date(announcement.start_date).toLocaleString()) : '-'}</p>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide mb-1">{t('End Date')}</p>
              <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 break-words">
                {announcement.end_date ? (window.appSettings?.formatDateTimeSimple(announcement.end_date, false) || new Date(announcement.end_date).toLocaleString()) : t('Ongoing')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-blue-50 dark:bg-blue-900/30 p-2.5 sm:p-3 shrink-0 rtl:ml-2">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 break-words">{totalEmployees}</p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words">{t('Total Employees')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-green-50 dark:bg-green-900/30 p-2.5 sm:p-3 shrink-0 rtl:ml-2">
                <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 break-words">{viewedCount}</p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words">{t('Views')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 md:col-span-1">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-purple-50 dark:bg-purple-900/30 p-2.5 sm:p-3 shrink-0 rtl:ml-2">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 break-words">{viewPercentage}%</p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words">{t('View Rate')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Target Department Statistics */}
      {departmentStats && departmentStats.length > 0 && (
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">{t('Target Department Statistics')}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-3 sm:space-y-4">
              {departmentStats.map((branchData: any, branchIndex: number) => (
                <div key={branchIndex} className="space-y-3 sm:space-y-4">
                  {branchData.departments.map((dept: any, deptIndex: number) => (
                    <div key={deptIndex} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">{dept.department}</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1 break-words">
                          {dept.viewed} of {dept.total} employees viewed
                        </p>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 sm:gap-1 shrink-0">
                        <div className="text-base sm:text-xl font-bold text-gray-900 dark:text-gray-100">{dept.percentage}%</div>
                        <div className="w-20 sm:w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${dept.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Target Branch Statistics */}
      {branchStats && branchStats.length > 0 && (
        <Card>
          <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">{t('Target Branch Statistics')}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-3 sm:space-y-4">
              {branchStats.map((branch: any, index: number) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">{branch.branch}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1 break-words">
                      {branch.viewed} of {branch.total} employees viewed
                    </p>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 sm:gap-1 shrink-0">
                    <div className="text-base sm:text-xl font-bold text-gray-900 dark:text-gray-100">{branch.percentage}%</div>
                    <div className="w-20 sm:w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${branch.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </PageTemplate>
  );
}
