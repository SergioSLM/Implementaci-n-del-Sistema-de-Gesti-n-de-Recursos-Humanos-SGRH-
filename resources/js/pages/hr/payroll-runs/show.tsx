// pages/hr/payroll-runs/show.tsx
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { ArrowLeft, Download, Users, DollarSign, Calendar, TrendingDown, TrendingUp, Clock, ChevronDown, ChevronUp, Trash2, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/custom-toast';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import React, { useState } from 'react';
import { useBrand } from '@/contexts/BrandContext';
import { THEME_COLORS } from '@/hooks/use-appearance';

export default function PayrollRunShow() {
  const { t } = useTranslation();
  const { payrollRun, auth } = usePage().props as any;
  const permissions = auth?.permissions || [];
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<any>(null);
  const [expandedEntry, setExpandedEntry] = useState<number | null>(null);

  const { themeColor, customColor } = useBrand();
  const primaryColor = themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS] ?? '#10b77f';

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Payroll Management') },
    { title: t('Payroll Runs'), href: route('hr.payroll-runs.index') },
    { title: payrollRun.title }
  ];

  const pageActions = [
    {
      label: t('Back'),
      icon: <ArrowLeft className="h-4 w-4 rtl:rotate-180" />,
      variant: 'outline',
      onClick: () => router.get(route('hr.payroll-runs.index'))
    }
  ];

  if (payrollRun.status === 'completed') {
    pageActions.unshift({
      label: t('Generate Payslips'),
      icon: <Download className="h-4 w-4" />,
      variant: 'default',
      onClick: () => handleGeneratePayslips()
    });
  }

  const handleGeneratePayslips = () => {
    toast.loading(t('Generating payslips...'));
    router.post(route('hr.payslips.bulk-generate'), { payroll_run_id: payrollRun.id }, {
      onSuccess: (page) => {
        toast.dismiss();
        if (page.props.flash.success) {
          toast.success(t(page.props.flash.success));
          setTimeout(() => router.get(route('hr.payslips.index')), 1000);
        } else if (page.props.flash.error) {
          toast.error(t(page.props.flash.error));
        }
      },
      onError: (errors) => {
        toast.dismiss();
        toast.error(typeof errors === 'string' ? errors : t('Failed to generate payslips'));
      }
    });
  };

  const handleDeleteEntry = (entry: any) => {
    setCurrentEntry(entry);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    toast.loading(t('Deleting payroll entry...'));
    router.delete(route('hr.payroll-entries.destroy', currentEntry.id), {
      onSuccess: (page) => {
        setIsDeleteModalOpen(false);
        toast.dismiss();
        if (page.props.flash.success) toast.success(t(page.props.flash.success));
        else if (page.props.flash.error) toast.error(t(page.props.flash.error));
      },
      onError: (errors) => {
        toast.dismiss();
        toast.error(typeof errors === 'string' ? t(errors) : t('Failed to delete payroll entry'));
      }
    });
  };

  const statusConfig: Record<string, { label: string; className: string }> = {
    draft:      { label: t('Draft'),      className: 'bg-gray-100 text-gray-700 border border-gray-300' },
    processing: { label: t('Processing'), className: 'bg-yellow-100 text-yellow-700 border border-yellow-300' },
    completed:  { label: t('Completed'),  className: 'bg-green-100 text-green-700 border border-green-300' },
    cancelled:  { label: t('Cancelled'),  className: 'bg-red-100 text-red-700 border border-red-300' },
  };

  const status = statusConfig[payrollRun.status] || statusConfig.draft;

  const freqLabel = payrollRun.payroll_frequency === 'weekly'
    ? t('Weekly') : payrollRun.payroll_frequency === 'biweekly'
    ? t('Bi-Weekly') : t('Monthly');

  const entries = payrollRun.payroll_entries || [];



  return (
    <PageTemplate
      title={payrollRun.title}
      description={t("Payroll entries, earnings, and deductions for this run.")}
      url={`/hr/payroll-runs/${payrollRun.id}`}
      actions={pageActions}
      breadcrumbs={breadcrumbs}
      noPadding
    >
      <div className="p-4 sm:p-6 space-y-6 min-w-0">

        {/* ===== SUMMARY CARDS ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 min-w-0">
          <div className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 min-w-0">
            <div className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-gray-100 dark:bg-gray-700/40 rounded-bl-full pointer-events-none rtl:left-0 rtl:right-auto rtl:rounded-bl-none rtl:rounded-br-full" />
            <div className="relative flex items-start justify-between min-w-0 gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 break-words">{t('Total Employees')}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{payrollRun.employee_count}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium break-words">{t('In this run')}</span>
                </div>
              </div>
              <div className="relative z-10 p-2.5 sm:p-3 bg-gray-100 dark:bg-gray-700 rounded-xl shrink-0">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
          </div>
          <div className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 min-w-0">
            <div className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-green-50 dark:bg-green-900/20 rounded-bl-full pointer-events-none rtl:left-0 rtl:right-auto rtl:rounded-bl-none rtl:rounded-br-full" />
            <div className="relative flex items-start justify-between min-w-0 gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 break-words">{t('Gross Pay')}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{window.appSettings?.formatCurrency(payrollRun.total_gross_pay)}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium break-words">{t('Before deductions')}</span>
                </div>
              </div>
              <div className="relative z-10 p-2.5 sm:p-3 bg-green-100 dark:bg-green-900/40 rounded-xl shrink-0">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 min-w-0">
            <div className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-red-50 dark:bg-red-900/20 rounded-bl-full pointer-events-none rtl:left-0 rtl:right-auto rtl:rounded-bl-none rtl:rounded-br-full" />
            <div className="relative flex items-start justify-between min-w-0 gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 break-words">{t('Total Deductions')}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{window.appSettings?.formatCurrency(payrollRun.total_deductions)}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-xs text-red-600 dark:text-red-400 font-medium break-words">{t('Withheld amount')}</span>
                </div>
              </div>
              <div className="relative z-10 p-2.5 sm:p-3 bg-red-100 dark:bg-red-900/40 rounded-xl shrink-0">
                <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
          <div className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 min-w-0">
            <div className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-blue-50 dark:bg-blue-900/20 rounded-bl-full pointer-events-none rtl:left-0 rtl:right-auto rtl:rounded-bl-none rtl:rounded-br-full" />
            <div className="relative flex items-start justify-between min-w-0 gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 break-words">{t('Net Pay')}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{window.appSettings?.formatCurrency(payrollRun.total_net_pay)}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium break-words">{t('Take-home amount')}</span>
                </div>
              </div>
              <div className="relative z-10 p-2.5 sm:p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl shrink-0">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        {/* ===== INFO BAR ===== */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0" style={{ borderLeftColor: primaryColor, borderLeftWidth: '4px' }}>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 min-w-0">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 min-w-0">
              <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="font-medium text-gray-900 dark:text-gray-100 shrink-0">{t('Pay Period')}:</span>
              <span className="break-words">
                {window.appSettings?.formatDateTimeSimple(payrollRun.pay_period_start, false) || new Date(payrollRun.pay_period_start).toLocaleDateString()}
                {' → '}
                {window.appSettings?.formatDateTimeSimple(payrollRun.pay_period_end, false) || new Date(payrollRun.pay_period_end).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 min-w-0">
              <Clock className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="font-medium text-gray-900 dark:text-gray-100 shrink-0">{t('Pay Date')}:</span>
              <span>{window.appSettings?.formatDateTimeSimple(payrollRun.pay_date, false) || new Date(payrollRun.pay_date).toLocaleDateString()}</span>
            </div>
            <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border shrink-0" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor, borderColor: `${primaryColor}40` }}>
              {freqLabel}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
              {status.label}
            </span>
          </div>
        </div>


        {/* ===== FORMULA REFERENCE ===== */}
        <div className="rounded-xl border p-4 min-w-0" style={{ backgroundColor: `${primaryColor}10`, borderColor: `${primaryColor}30` }}>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 shrink-0" style={{ color: primaryColor }} />
            <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">{t('Payroll Calculation Reference')}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 min-w-0">
            <div className="bg-white dark:bg-gray-900/50 rounded-lg p-3 min-w-0">
              <p className="text-xs font-semibold mb-1 text-gray-900 dark:text-gray-100">{t('Gross Pay')}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono break-words">{t('Total Earnings')} - {t('LOP Deduction')} - {t('Unpaid Leave')} + {t('Overtime')}</p>
            </div>
            <div className="bg-white dark:bg-gray-900/50 rounded-lg p-3 min-w-0">
              <p className="text-xs font-semibold mb-1 text-gray-900 dark:text-gray-100">{t('Net Pay')}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono break-words">{t('Gross Pay')} - {t('Total Component Deductions')}</p>
            </div>
            <div className="bg-white dark:bg-gray-900/50 rounded-lg p-3 min-w-0">
              <p className="text-xs font-semibold mb-1 text-gray-900 dark:text-gray-100">{t('LOP Deduction')}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono break-words">({t('Basic Salary')} ÷ {t('Working Days')}) × {t('LOP Days')}</p>
            </div>
          </div>
        </div>

        {/* ===== EMPLOYEE PAYROLL ENTRIES ===== */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden min-w-0">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between min-w-0">
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">{t('Employee Payroll Entries')}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{entries.length} {t('employees in this payroll run')}</p>
            </div>
          </div>

          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Users className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">{t('No payroll entries found')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto min-w-0">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-xs font-semibold text-gray-500 dark:text-gray-400">
                    <th className="px-4 sm:px-6 py-3 whitespace-nowrap">{t('Employee')}</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">{t('Working Days')}</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">{t('Present')}</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">{t('LOP')}</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">{t('Gross Pay')}</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">{t('Deductions')}</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">{t('Net Pay')}</th>
                    <th className="px-4 sm:px-6 py-3 text-right whitespace-nowrap">{t('Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                  {entries.map((entry: any) => {
                    const isExpanded = expandedEntry === entry.id;
                    return (
                      <React.Fragment key={entry.id}>
                        <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: primaryColor }}>
                                {entry.employee?.avatar ? (
                                  <img src={entry.employee.avatar} alt={entry.employee?.name} className="h-full w-full object-cover" />
                                ) : (
                                  entry.employee?.name?.charAt(0).toUpperCase() || '?'
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{entry.employee?.name || '-'}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{t('Basic')}: {window.appSettings?.formatCurrency(entry.basic_salary)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center whitespace-nowrap font-mono text-gray-700 dark:text-gray-300">
                            {entry.working_days || 0}
                          </td>
                          <td className="px-4 py-4 text-center whitespace-nowrap font-mono font-medium text-green-600">
                            {entry.present_days || 0}
                          </td>
                          <td className="px-4 py-4 text-center whitespace-nowrap font-mono font-medium text-red-600">
                            {entry.lop_days || 0}
                          </td>
                          <td className="px-4 py-4 text-right whitespace-nowrap font-mono font-semibold text-green-700 dark:text-green-400">
                            {window.appSettings?.formatCurrency(entry.gross_pay)}
                          </td>
                          <td className="px-4 py-4 text-right whitespace-nowrap font-mono font-medium text-red-600 dark:text-red-400">
                            {window.appSettings?.formatCurrency(entry.total_deductions)}
                          </td>
                          <td className="px-4 py-4 text-right whitespace-nowrap font-mono font-bold text-indigo-700 dark:text-indigo-400">
                            {window.appSettings?.formatCurrency(entry.net_pay)}
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                                style={{ color: isExpanded ? primaryColor : undefined }}
                              >
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                <span>{isExpanded ? t('Less') : t('Details')}</span>
                              </button>
                              {permissions.includes('delete-payroll-entries') && (
                                <button
                                  onClick={() => handleDeleteEntry(entry)}
                                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors cursor-pointer"
                                  title={t('Delete entry')}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={8} className="p-0 border-b border-gray-200 dark:border-gray-700">
                              <div className="px-4 sm:px-6 pb-5 pt-3 bg-gray-50/80 dark:bg-gray-800/40">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Earnings */}
                                  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4" style={{ borderLeftColor: primaryColor, borderLeftWidth: '4px' }}>
                                    <p className="text-xs font-semibold capitalize tracking-wide mb-3" style={{ color: primaryColor }}>{t('Earnings')}</p>
                                    <div className="space-y-2">
                                      <div className="flex justify-between text-sm gap-2">
                                        <span className="text-gray-600 dark:text-gray-400 truncate">{t('Basic Salary')}</span>
                                        <span className="font-mono text-gray-900 dark:text-gray-100 shrink-0">{window.appSettings?.formatCurrency(entry.basic_salary)}</span>
                                      </div>
                                      <div className="flex justify-between text-sm gap-2">
                                        <span className="text-gray-600 dark:text-gray-400 truncate">{t('Component Earnings')}</span>
                                        <span className="font-mono text-blue-600 shrink-0">{window.appSettings?.formatCurrency(entry.component_earnings || 0)}</span>
                                      </div>
                                      {entry.overtime_amount > 0 && (
                                        <div className="flex justify-between text-sm gap-2">
                                          <span className="text-gray-600 dark:text-gray-400 truncate">{t('Overtime')}</span>
                                          <span className="font-mono text-green-600 shrink-0">{window.appSettings?.formatCurrency(entry.overtime_amount)}</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between text-sm border-t border-gray-100 dark:border-gray-700 pt-2 mt-2 gap-2">
                                        <span className="font-semibold text-gray-700 dark:text-gray-300 truncate">{t('Gross Pay')}</span>
                                        <span className="font-mono font-bold text-green-700 dark:text-green-400 shrink-0">{window.appSettings?.formatCurrency(entry.gross_pay)}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Deductions */}
                                  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4" style={{ borderLeftColor: '#ef4444', borderLeftWidth: '4px' }}>
                                    <p className="text-xs font-semibold text-red-600 capitalize tracking-wide mb-3">{t('Deductions')}</p>
                                    <div className="space-y-2">
                                      {entry.lop_deduction > 0 && (
                                        <div className="flex justify-between text-sm gap-2">
                                          <span className="text-gray-600 dark:text-gray-400 truncate">{t('LOP Deduction')} ({entry.lop_days} {t('days')})</span>
                                          <span className="font-mono font-medium text-red-600 shrink-0">{window.appSettings?.formatCurrency(entry.lop_deduction)}</span>
                                        </div>
                                      )}
                                      {entry.unpaid_leave_deduction > 0 && (
                                        <div className="flex justify-between text-sm gap-2">
                                          <span className="text-gray-600 dark:text-gray-400 truncate">{t('Unpaid Leave')} ({entry.unpaid_leave_days} {t('days')})</span>
                                          <span className="font-mono font-medium text-red-600 shrink-0">{window.appSettings?.formatCurrency(entry.unpaid_leave_deduction)}</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between text-sm gap-2">
                                        <span className="text-gray-600 dark:text-gray-400 truncate">{t('Component Deductions')}</span>
                                        <span className="font-mono text-red-600 shrink-0">{window.appSettings?.formatCurrency(entry.total_deductions)}</span>
                                      </div>
                                      <div className="flex justify-between text-sm border-t border-gray-100 dark:border-gray-700 pt-2 mt-2 gap-2">
                                        <span className="font-semibold text-gray-700 dark:text-gray-300 truncate">{t('Net Pay')}</span>
                                        <span className="font-mono font-bold text-red-600 dark:text-red-400 shrink-0">{window.appSettings?.formatCurrency(entry.net_pay)}</span>
                                      </div>
                                    </div>
                                  </div>
                                  {/* Attendance Summary */}
                                  <div className="md:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 capitalize tracking-wide mb-3">{t('Attendance Summary')}</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                                      {[
                                        { label: t('Working Days'), value: entry.working_days || 0, color: 'text-gray-700 dark:text-gray-300', bg: 'bg-gray-100 dark:bg-gray-700', border: 'border-gray-200 dark:border-gray-600' },
                                        { label: t('Present Days'), value: entry.present_days || 0, color: 'text-green-700 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30', border: 'border-green-200 dark:border-green-700' },
                                        { label: t('LOP Days'), value: entry.lop_days || 0, color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30', border: 'border-red-200 dark:border-red-700' },
                                        { label: t('Unpaid Leave'), value: entry.unpaid_leave_days || 0, color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/30', border: 'border-orange-200 dark:border-orange-700' },
                                        { label: t('OT Hours'), value: entry.overtime_hours || 0, color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-700' },
                                        { label: t('OT Amount'), value: window.appSettings?.formatCurrency(entry.overtime_amount || 0), color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-700' },
                                      ].map((item, i) => (
                                        <div key={i} className={`text-center p-2.5 rounded-lg border ${item.bg} ${item.border}`}>
                                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1 truncate">{item.label}</p>
                                          <p className={`font-mono font-bold text-sm sm:text-base ${item.color} truncate`}>{item.value}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Delete Modal */}
      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={currentEntry?.employee?.name || ''}
        entityName="payroll entry"
      />
    </PageTemplate>
  );
}
