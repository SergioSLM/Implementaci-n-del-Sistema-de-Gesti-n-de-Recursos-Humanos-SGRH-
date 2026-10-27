import { useForm } from '@inertiajs/react';
import { Lock } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import AuthLayout from '@/layouts/auth-layout';
import AuthButton from '@/components/auth/auth-button';
import { useBrand } from '@/contexts/BrandContext';
import { THEME_COLORS } from '@/hooks/use-appearance';

export default function ConfirmPassword() {
    const { t } = useTranslation();
    const { themeColor, customColor } = useBrand();
    const primaryColor = themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS];
    const { data, setData, post, processing, errors, reset } = useForm<Required<{ password: string }>>({
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout
            title={t("Confirm your password")}
            description={t("This is a secure area of the application. Please confirm your password before continuing.")}
            icon={<Lock className="h-7 w-7" style={{ color: primaryColor }} />}
        >
            <form onSubmit={submit} className="space-y-5 [@media(max-height:850px)]:space-y-2 [@media(max-height:620px)]:space-y-1">
                <div className="space-y-4 [@media(max-height:850px)]:space-y-2 [@media(max-height:620px)]:space-y-1">
                    <div className="relative">
                        <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 font-medium mb-1 [@media(max-height:680px)]:mb-0.5 block text-sm" required>{t("Password")}</Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-3 rtl:pr-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <Input
                                id="password"
                                type="password"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="current-password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="••••••••"
                                className="ltr:pl-10 rtl:pr-10 w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg transition-all duration-200 h-11 [@media(max-height:850px)]:h-8 [@media(max-height:620px)]:h-7 [@media(max-height:850px)]:text-xs [@media(max-height:620px)]:text-[10px]"
                                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                            />
                        </div>
                        <InputError message={errors.password} />
                    </div>
                </div>

                <AuthButton 
                    tabIndex={2} 
                    processing={processing}
                    className="[@media(max-height:850px)]:!py-1.5 [@media(max-height:620px)]:!py-1 [@media(max-height:850px)]:text-xs [@media(max-height:620px)]:text-[10px]"
                >
                    {t("Confirm password")}
                </AuthButton>
            </form>
        </AuthLayout>
    );
}