import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';
import { UserX, Calendar, Clock, FileText, Tag, Eye } from 'lucide-react';
import { useInitials } from '@/hooks/use-initials';
import { getImagePath } from '@/utils/helpers';
interface ViewTerminationProps {
    termination: any;
}
export default function View({ termination }: ViewTerminationProps) {
    const { t } = useTranslation();
    const getInitials = useInitials();
    const getStatusClass = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20';
            case 'in progress': return 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20';
            default: return 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20';
        }
    };
    return (
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 w-[95vw] sm:w-full rounded-lg" onOpenAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader className="px-4 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                        <UserX className="h-5 w-5 text-primary" />
                    </div>
                    <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">{t('Termination Details')}</DialogTitle>
                </div>
            </DialogHeader>
            <div className="px-4 sm:px-6 py-4 pb-6 space-y-4 sm:space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white overflow-hidden shrink-0">
                            {termination.employee?.avatar ? (
                                <img src={termination.employee.avatar} alt={termination.employee?.name} className="h-full w-full object-cover" />
                            ) : (
                                getInitials(termination.employee?.name || '')
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('Employee')}</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{termination.employee?.name || '-'}</p>
                        </div>
                    </div>
                    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium capitalize shrink-0 ${getStatusClass(termination.status)}`}>
                        {termination.status || '-'}
                    </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="min-w-0">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <Tag className="h-4 w-4 shrink-0" />
                            {t('Termination Type')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100 break-words">{termination.termination_type || '-'}</p>
                    </div>
                    <div className="min-w-0">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <Clock className="h-4 w-4 shrink-0" />
                            {t('Notice Period')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100 break-words">{termination.notice_period || '-'}</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="min-w-0">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <Calendar className="h-4 w-4 shrink-0" />
                            {t('Notice Date')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100 break-words">{termination.notice_date ? (window.appSettings?.formatDateTimeSimple(termination.notice_date, false) || termination.notice_date) : '-'}</p>
                    </div>
                    <div className="min-w-0">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <Calendar className="h-4 w-4 shrink-0" />
                            {t('Termination Date')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100 break-words">{termination.termination_date ? (window.appSettings?.formatDateTimeSimple(termination.termination_date, false) || termination.termination_date) : '-'}</p>
                    </div>
                </div>
                {termination.documents && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="min-w-0">
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 shrink-0" />
                                {t('Documents')}
                            </label>
                            <a href={getImagePath(termination.documents)} target="_blank" rel="noreferrer" className="group block relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-primary transition-colors">
                                <img
                                    src={getImagePath(termination.documents)}
                                    alt={t('Document')}
                                    className="w-full h-36 object-cover group-hover:opacity-90 transition-opacity"
                                    onError={(e) => { e.currentTarget.parentElement!.style.display = 'none'; }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                    <Eye className="h-6 w-6 text-white" />
                                </div>
                            </a>
                        </div>
                    </div>
                )}
                <div className="min-w-0">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0" />
                        {t('Reason')}
                    </label>
                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100 break-words">{termination.reason || '-'}</p>
                </div>
                {termination.description && (
                    <div className="min-w-0">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <FileText className="h-4 w-4 shrink-0" />
                            {t('Description')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100 break-words">{termination.description}</p>
                    </div>
                )}
                {termination.exit_feedback && (
                    <div className="min-w-0">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <FileText className="h-4 w-4 shrink-0" />
                            {t('Exit Feedback')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100 break-words">{termination.exit_feedback}</p>
                    </div>
                )}
            </div>
        </DialogContent>
    );
}
