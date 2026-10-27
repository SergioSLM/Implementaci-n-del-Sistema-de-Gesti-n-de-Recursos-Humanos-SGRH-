import { useForm } from '@inertiajs/react';
import { Mail } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import AuthLayout from '@/layouts/auth-layout';
import AuthButton from '@/components/auth/auth-button';
import Recaptcha from '@/components/recaptcha';
import { useBrand } from '@/contexts/BrandContext';
import { THEME_COLORS } from '@/hooks/use-appearance';

export default function ForgotPassword({ status }: { status?: string }) {
    const { t } = useTranslation();
    const [recaptchaToken, setRecaptchaToken] = useState<string>('');
    const { themeColor, customColor } = useBrand();
    const primaryColor = themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS];
    const { data, setData, post, processing, errors } = useForm<{ email: string; recaptcha_token?: string }>({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.email'), {
            data: { ...data, recaptcha_token: recaptchaToken },
        });
    };

    return (
        <AuthLayout
            title={t("Forgot your password?")}
            description={t("Enter your email to receive a password reset link")}
            icon={<Mail className="h-7 w-7" style={{ color: primaryColor }} />}
            status={status}
        >
            <form className="space-y-5 [@media(max-height:850px)]:space-y-2 [@media(max-height:620px)]:space-y-1" onSubmit={submit}>
                <div className="space-y-4 [@media(max-height:850px)]:space-y-2 [@media(max-height:620px)]:space-y-1">
                    <div>
                        <Label htmlFor="email" required className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 [@media(max-height:680px)]:mb-1">{t("Email address")}</Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-3 rtl:pr-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <Input
                                id="email"
                                type="email"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="company@example.com"
                                className="ltr:pl-10 rtl:pr-10 w-full border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg transition-all duration-200 text-gray-900 dark:text-white h-11 [@media(max-height:850px)]:h-8 [@media(max-height:620px)]:h-7 [@media(max-height:850px)]:text-xs [@media(max-height:620px)]:text-[10px]"
                            />
                        </div>
                        <InputError message={errors.email} />
                    </div>
                </div>

                <Recaptcha 
                    onVerify={setRecaptchaToken}
                    onExpired={() => setRecaptchaToken('')}
                    onError={() => setRecaptchaToken('')}
                />

                <button
                    type="submit"
                    disabled={processing}
                    tabIndex={2}
                    className="cursor-pointer w-full text-white py-2.5 [@media(max-height:850px)]:py-1.5 [@media(max-height:620px)]:py-1 [@media(max-height:850px)]:text-xs [@media(max-height:620px)]:text-[10px] text-sm font-medium tracking-wide transition-all duration-200 rounded-md shadow-md hover:shadow-lg transform hover:scale-[1.02] disabled:opacity-50"
                    style={{ backgroundColor: primaryColor }}
                >
                    {processing ? t("Sending...") : t("Send Reset Link")}
                </button>

                <div className="text-center">
                    <p className="text-sm text-gray-500">
                        {t("Remember your password?")}{' '}
                        <TextLink 
                            href={route('login')} 
                            className="font-medium hover:underline" 
                            style={{ color: primaryColor }}
                            tabIndex={3}
                        >
                            {t("Back to login")}
                        </TextLink>
                    </p>
                </div>
            </form>
        </AuthLayout>
    );
}