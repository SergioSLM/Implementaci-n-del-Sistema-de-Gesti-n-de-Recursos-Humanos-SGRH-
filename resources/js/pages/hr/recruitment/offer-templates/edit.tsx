import { PageTemplate } from '@/components/page-template';
import { usePage, router, useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { toast } from '@/components/custom-toast';

export default function EditOfferTemplate() {
    const { t } = useTranslation();
    const { offerTemplate, globalSettings } = usePage().props as any;

    const { data, setData, put, processing, errors, clearErrors } = useForm({
        name: offerTemplate.name || '',
        template_content: offerTemplate.template_content || '',
        variables: Array.isArray(offerTemplate.variables) ? offerTemplate.variables.join(', ') : (offerTemplate.variables || ''),
        status: offerTemplate.status || 'active',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        clearErrors();

        if (!globalSettings?.is_demo) toast.loading(t('Updating offer template...'));

        put(route('hr.recruitment.offer-templates.update', offerTemplate.id), {
            onSuccess: (page) => {
                toast.dismiss();
                if (page.props.flash?.success) toast.success(t(page.props.flash.success));
            },
            onError: () => {
                toast.dismiss();
                toast.error(t('Please fix the errors below'));
            },
        });
    };

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Recruitment') },
        { title: t('Offer Templates'), href: route('hr.recruitment.offer-templates.index') },
        { title: t('Edit') },
    ];

    return (
        <PageTemplate
            title={t('Edit Offer Template')}
            description={t("Update the content and settings of this offer template.")}
            breadcrumbs={breadcrumbs}
            actions={[
                {
                    label: t('Back'),
                    icon: <ArrowLeft className="h-4 w-4 rtl:rotate-180" />,
                    variant: 'outline',
                    onClick: () => router.get(route('hr.recruitment.offer-templates.index')),
                },
            ]}
        >
            <style>{`
                main { max-width: 100vw; overflow-x: clip !important; }
                body { overflow-x: clip !important; }
            `}</style>
            <form onSubmit={handleSubmit} className="space-y-6 min-w-0">
                {/* Basic Information */}
                <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
                    <CardHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
                        <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">{t('Basic Information')}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            <div className="space-y-2 min-w-0">
                                <Label htmlFor="name" required>{t('Template Name')}</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder={t('Enter template name')}
                                    required
                                    className={`w-full ${errors.name ? 'border-red-500' : ''}`}
                                />
                                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                            </div>

                            <div className="space-y-2 min-w-0">
                                <Label htmlFor="status" required>{t('Status')}</Label>
                                <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                                    <SelectTrigger className={`w-full ${errors.status ? 'border-red-500' : ''}`}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">{t('Active')}</SelectItem>
                                        <SelectItem value="inactive">{t('Inactive')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.status && <p className="text-sm text-red-500 mt-1">{errors.status}</p>}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Template Content */}
                <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
                    <CardHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
                        <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">{t('Template Content')}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-2 min-w-0">
                            <Label htmlFor="template_content" required>{t('Content')}</Label>
                            <p className="text-xs text-gray-500 mb-1">{t('Use {{variable_name}} for dynamic content')}</p>
                            <Textarea
                                id="template_content"
                                value={data.template_content}
                                onChange={(e) => setData('template_content', e.target.value)}
                                placeholder={t('Enter template content...')}
                                rows={12}
                                required
                                className={`w-full font-mono text-xs sm:text-sm ${errors.template_content ? 'border-red-500' : ''}`}
                            />
                            {errors.template_content && <p className="text-sm text-red-500 mt-1">{errors.template_content}</p>}
                        </div>
                    </CardContent>
                </Card>

                {/* Variables */}
                <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
                    <CardHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
                        <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">{t('Variables')}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-2 min-w-0">
                            <Label htmlFor="variables" required>{t('Variables')}</Label>
                            <p className="text-xs text-gray-500 mb-1">{t('Comma-separated list of variable names (without {{}})')}</p>
                            <Input
                                required
                                id="variables"
                                value={data.variables}
                                onChange={(e) => setData('variables', e.target.value)}
                                placeholder="candidate_name, position, salary, start_date"
                                className={`w-full ${errors.variables ? 'border-red-500' : ''}`}
                            />
                            {errors.variables && <p className="text-sm text-red-500 mt-1">{errors.variables}</p>}
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => router.get(route('hr.recruitment.offer-templates.index'))} className="w-full sm:w-auto">
                        {t('Cancel')}
                    </Button>
                    <Button type="submit" disabled={processing} className="w-full sm:w-auto">
                        {processing ? t('Updating...') : t('Update Template')}
                    </Button>
                </div>
            </form>
        </PageTemplate>
    );
}
