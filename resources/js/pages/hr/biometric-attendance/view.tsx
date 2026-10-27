import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { Timer } from 'lucide-react';
import {
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface ViewProps {
    employee: { code: string; date: string; name: string } | null;
    entries: any[];
}

export default function View({ employee, entries }: ViewProps) {
    const { t } = useTranslation();

    return (
        <DialogContent className="sm:max-w-2xl w-[95vw] sm:w-full p-0 overflow-hidden flex flex-col max-h-[90vh]" onOpenAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader className="px-4 sm:px-6 pt-5 border-b">
                <div className="flex items-start sm:items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg shrink-0 mt-0.5 sm:mt-0">
                        <Timer className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <DialogTitle className="text-base sm:text-xl font-semibold break-words leading-snug">
                            {t('Punch Details')} — {employee?.name}
                            {employee?.code && (
                                <span className="text-sm sm:text-base font-normal text-gray-500 dark:text-gray-400 ltr:ml-1.5 rtl:mr-1.5 inline-block">({employee.code})</span>
                            )}
                        </DialogTitle>
                        {employee?.date && (
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {window.appSettings.formatDateTimeSimple(employee.date, false)}
                            </p>
                        )}
                    </div>
                </div>
            </DialogHeader>
            <div className="p-4 sm:p-6 flex-1 min-h-0 min-w-0 flex flex-col">
                <div className="rounded-md border border-gray-200 dark:border-gray-800 overflow-auto max-h-[60vh] w-full">
                    <table className="w-full text-sm min-w-[500px] caption-bottom text-foreground dark:bg-gray-900">
                        <TableHeader className="sticky top-0 z-10 bg-[#F0F0F1] dark:bg-gray-800">
                            <TableRow className="bg-[#F0F0F1] dark:bg-gray-800 border-b hover:!bg-[#F0F0F1] dark:hover:!bg-gray-800">
                                <TableHead className="ltr:text-left rtl:text-right px-3 sm:px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 tracking-wider bg-[#F0F0F1] dark:bg-gray-800">{t('Time')}</TableHead>
                                <TableHead className="ltr:text-left rtl:text-right px-3 sm:px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 tracking-wider bg-[#F0F0F1] dark:bg-gray-800">{t('Status')}</TableHead>
                                <TableHead className="ltr:text-left rtl:text-right px-3 sm:px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 tracking-wider bg-[#F0F0F1] dark:bg-gray-800">{t('Verify Type')}</TableHead>
                                <TableHead className="ltr:text-left rtl:text-right px-3 sm:px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 tracking-wider bg-[#F0F0F1] dark:bg-gray-800">{t('Terminal')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                            {entries.map((entry: any) => (
                                <TableRow key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <TableCell className="px-3 sm:px-4 py-2.5 font-mono text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap ltr:text-left rtl:text-right">{entry.time}</TableCell>
                                    <TableCell className="px-3 sm:px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap ltr:text-left rtl:text-right">{entry.punch_state_display}</TableCell>
                                    <TableCell className="px-3 sm:px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap ltr:text-left rtl:text-right">{entry.verify_type_display}</TableCell>
                                    <TableCell className="px-3 sm:px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 break-words max-w-[150px] ltr:text-left rtl:text-right">{entry.terminal_alias}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </table>
                    {entries.length === 0 && (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                            {t('No entries found')}
                        </div>
                    )}
                </div>
            </div>
        </DialogContent>
    );
}
