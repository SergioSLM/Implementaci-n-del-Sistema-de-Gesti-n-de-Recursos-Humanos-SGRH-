// pages/hr/training/assessments/show.tsx
import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { hasPermission } from '@/utils/authorization';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Calendar, Edit, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CrudFormModal } from '@/components/CrudFormModal';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { toast } from '@/components/custom-toast';

export default function TrainingAssessmentShow() {
  const { t } = useTranslation();
  const { auth, trainingAssessment, statistics, globalSettings } = usePage().props as any;
  const permissions = auth?.permissions || [];

  // State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  const handleBackToList = () => {
    router.get(route('hr.training-assessments.index'));
  };

  const handleEdit = () => {
    setIsFormModalOpen(true);
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = (formData: any) => {
    if (!globalSettings?.is_demo) toast.loading(t('Updating assessment...'));

    router.put(route('hr.training-assessments.update', trainingAssessment.id), formData, {
      onSuccess: (page) => {
        setIsFormModalOpen(false);
        if (!globalSettings?.is_demo) toast.dismiss();
        if (page.props.flash.success) {
          toast.success(t(page.props.flash.success));
        } else if (page.props.flash.error) {
          toast.error(t(page.props.flash.error));
        } else {
          toast.success(t('Assessment updated successfully'));
        }
      },
      onError: (errors) => {
        if (!globalSettings?.is_demo) toast.dismiss();
        if (typeof errors === 'string') {
          toast.error(errors);
        } else {
          toast.error(`Failed to update assessment: ${Object.values(errors).join(', ')}`);
        }
      }
    });
  };

  const handleDeleteConfirm = () => {
    if (!globalSettings?.is_demo) toast.loading(t('Deleting assessment...'));

    router.delete(route('hr.training-assessments.destroy', trainingAssessment.id), {
      onSuccess: (page) => {
        if (!globalSettings?.is_demo) toast.dismiss();
        if (page.props.flash.success) {
          toast.success(t(page.props.flash.success));
        } else if (page.props.flash.error) {
          toast.error(t(page.props.flash.error));
        } else {
          toast.success(t('Assessment deleted successfully'));
        }
        router.get(route('hr.training-assessments.index'));
      },
      onError: (errors) => {
        if (!globalSettings?.is_demo) toast.dismiss();
        if (typeof errors === 'string') {
          toast.error(errors);
        } else {
          toast.error(`Failed to delete assessment: ${Object.values(errors).join(', ')}`);
        }
      }
    });
  };

  // Define page actions
  const pageActions = [];

  // Add the "Back to List" button
  pageActions.push({
    label: t('Back'),
    icon: <ArrowLeft className="h-4 w-4 rtl:rotate-180" />,
    variant: 'outline' as const,
    onClick: handleBackToList
  });

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Training & Development') },
    { title: t('Training Assessments'), href: route('hr.training-assessments.index') },
    { title: trainingAssessment.name }
  ];

  // Assessment type badge classes
  const typeClasses = {
    'quiz':         'bg-blue-100 text-blue-800 border-blue-200',
    'practical':    'bg-green-100 text-green-800 border-green-200',
    'presentation': 'bg-purple-100 text-purple-800 border-purple-200'
  };

  // Prepare training program options for form
  const trainingProgramOptions = [
    { value: trainingAssessment.training_program.id.toString(), label: trainingAssessment.training_program.name }
  ];

  return (
    <PageTemplate
      title={t('Assessment Details')}
      description={t("View the questions, results, and details of this training assessment.")}
      url={`/hr/training/assessments/${trainingAssessment.id}`}
      actions={pageActions}
      breadcrumbs={breadcrumbs}
    >
      <style>{`
        main { max-width: 100vw; overflow-x: clip !important; }
        body { overflow-x: clip !important; }
      `}</style>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
        {/* Assessment Details */}
        <div className="lg:col-span-2 min-w-0">
          <Card className="mb-6">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3 min-w-0">
                <div className="min-w-0">
                  <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 break-words">{trainingAssessment.name}</CardTitle>
                  <CardDescription className="mt-1 sm:mt-2 break-words">
                    {trainingAssessment.training_program?.name || t('Unknown Program')}
                  </CardDescription>
                </div>
                <Badge className={`${typeClasses[trainingAssessment.type] || 'bg-gray-100 text-gray-800 border-gray-200'} capitalize shrink-0 whitespace-nowrap`}>
                  {trainingAssessment.type ? trainingAssessment.type.charAt(0).toUpperCase() + trainingAssessment.type.slice(1) : ''}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 min-w-0">
                <div className="min-w-0">
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('Passing Score')}</h3>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">{trainingAssessment.passing_score}%</p>
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('Created By')}</h3>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 break-words">{trainingAssessment.creator?.name || '-'}</p>
                </div>
              </div>

              {trainingAssessment.description && (
                <div className="mb-4 min-w-0">
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('Description')}</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 break-words leading-relaxed">{trainingAssessment.description}</p>
                </div>
              )}

              {trainingAssessment.criteria && (
                <div className="min-w-0">
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('Assessment Criteria')}</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 break-words leading-relaxed">{trainingAssessment.criteria}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assessment Results */}
          <Card className="min-w-0">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">{t('Assessment Results')}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              {trainingAssessment.employee_results && trainingAssessment.employee_results.length > 0 ? (
                <div className="overflow-x-auto min-w-0 border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">{t('Employee')}</TableHead>
                        <TableHead className="whitespace-nowrap">{t('Date')}</TableHead>
                        <TableHead className="whitespace-nowrap">{t('Score')}</TableHead>
                        <TableHead className="whitespace-nowrap">{t('Result')}</TableHead>
                        <TableHead className="whitespace-nowrap">{t('Assessed By')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trainingAssessment.employee_results.map((result: any) => (
                        <TableRow key={result.id}>
                          <TableCell className="whitespace-nowrap">
                            <div className="font-medium text-gray-900 dark:text-gray-100">{result.employee_training?.employee?.name || '-'}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{result.employee_training?.employee?.employee?.employee_id || '-'}</div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                              <div className="flex items-center gap-2 text-gray-500">
                                  {result.assessment_date && <Calendar className="h-4 w-4 shrink-0" />}
                                  <span>{window.appSettings?.formatDateTimeSimple(result.assessment_date, false) || '-'}</span>
                              </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap font-medium">
                            {result.score}%
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {result.is_passed ? (
                              <Badge className="bg-green-100 text-green-800 border-green-200 capitalize whitespace-nowrap">
                                {t('Passed')}
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800 border-red-200 capitalize whitespace-nowrap">
                                {t('Failed')}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {result.assessor?.name || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-sm text-gray-500 dark:text-gray-400">
                  {t('No assessment results available')}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Statistics */}
        <div className="min-w-0 lg:sticky lg:top-6 self-start">
          <Card className="mb-6 min-w-0">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">{t('Statistics')}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <div className="space-y-4 min-w-0">
                <div className="min-w-0">
                  <div className="flex justify-between items-center mb-1 gap-2 min-w-0">
                    <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{t('Total Results')}</span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 shrink-0">{statistics.totalResults}</span>
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex justify-between items-center mb-1 gap-2 min-w-0">
                    <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{t('Pass Rate')}</span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 shrink-0">{statistics.passRate.toFixed(1)}%</span>
                  </div>
                  <Progress
                    value={statistics.passRate}
                    className="h-2"
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex justify-between items-center mb-1 gap-2 min-w-0">
                    <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{t('Average Score')}</span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 shrink-0">{statistics.averageScore.toFixed(1)}%</span>
                  </div>
                  <Progress
                    value={statistics.averageScore}
                    className="h-2"
                  />
                </div>

                <div className="pt-2 border-t min-w-0">
                  <div className="flex justify-between items-center mb-1 gap-2 min-w-0">
                    <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{t('Passed')}</span>
                    <span className="text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400 shrink-0">{statistics.passedResults}</span>
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex justify-between items-center mb-1 gap-2 min-w-0">
                    <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{t('Failed')}</span>
                    <span className="text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400 shrink-0">{statistics.failedResults}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Form Modal */}
      <CrudFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        formConfig={{
          fields: [
            {
              name: 'training_program_id',
              label: t('Training Program'),
              type: 'select',
              required: true,
              options: trainingProgramOptions,
              disabled: true
            },
            {
              name: 'name',
              label: t('Assessment Name'),
              type: 'text',
              required: true
            },
            {
              name: 'description',
              label: t('Description'),
              type: 'textarea'
            },
            {
              name: 'type',
              label: t('Assessment Type'),
              type: 'select',
              required: true,
              options: [
                { value: 'quiz', label: t('Quiz') },
                { value: 'practical', label: t('Practical') },
                { value: 'presentation', label: t('Presentation') }
              ]
            },
            {
              name: 'passing_score',
              label: t('Passing Score (%)'),
              type: 'number',
              required: true,
              min: 0,
              max: 100
            },
            {
              name: 'criteria',
              label: t('Assessment Criteria'),
              type: 'textarea',
              helpText: t('Describe the criteria used to evaluate this assessment')
            }
          ],
          modalSize: 'lg'
        }}
        initialData={trainingAssessment}
        title={t('Edit Assessment')}
        mode="edit"
      />

      {/* Delete Modal */}
      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={trainingAssessment.name}
        entityName="assessment"
      />
    </PageTemplate>
  );
}
