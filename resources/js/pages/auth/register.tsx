import { useForm, usePage } from '@inertiajs/react';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import AuthLayout from '@/layouts/auth-layout';
import AuthButton from '@/components/auth/auth-button';
import Recaptcha from '@/components/recaptcha';
import { useBrand } from '@/contexts/BrandContext';
import { THEME_COLORS } from '@/hooks/use-appearance';

type RegisterForm = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    terms: boolean;
    recaptcha_token?: string;
    plan_id?: string;
    referral_code?: string;
};

export default function Register({ referralCode, planId }: { referralCode?: string; planId?: string }) {
    const { t } = useTranslation();
    const { globalSettings } = usePage().props as any;
    const termsConditionsUrl = globalSettings?.termsConditionsUrl;
    const [recaptchaToken, setRecaptchaToken] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
    const { themeColor, customColor } = useBrand();
    const primaryColor = themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS];
    const { data, setData, post, processing, errors, reset } = useForm<RegisterForm>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        terms: false,
        plan_id: planId,
        referral_code: referralCode,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), {
            data: { ...data, recaptcha_token: recaptchaToken },
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout
            title={t("Create your account")}
            description={t("Enter your details below to get started")}
        >
            <form className="space-y-5 [@media(max-height:850px)]:space-y-2 [@media(max-height:620px)]:space-y-1" onSubmit={submit}>
                <div className="space-y-4 [@media(max-height:850px)]:space-y-2 [@media(max-height:620px)]:space-y-1">
                    <div>
                        <Label htmlFor="name" required className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 [@media(max-height:680px)]:mb-1">{t("Full name")}</Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-3 rtl:pr-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <Input
                                id="name"
                                type="text"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder={t("Enter your full name")}
                                className="ltr:pl-10 rtl:pr-10 w-full border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg transition-all duration-200 text-gray-900 dark:text-white h-11 [@media(max-height:850px)]:h-8 [@media(max-height:620px)]:h-7 [@media(max-height:850px)]:text-xs [@media(max-height:620px)]:text-[10px]"
                            />
                        </div>
                        <InputError message={errors.name} />
                    </div>

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
                                tabIndex={2}
                                autoComplete="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="company@example.com"
                                className="ltr:pl-10 rtl:pr-10 w-full border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg transition-all duration-200 text-gray-900 dark:text-white h-11 [@media(max-height:850px)]:h-8 [@media(max-height:620px)]:h-7 [@media(max-height:850px)]:text-xs [@media(max-height:620px)]:text-[10px]"
                            />
                        </div>
                        <InputError message={errors.email} />
                    </div>

                    <div>
                        <Label htmlFor="password" required className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 [@media(max-height:680px)]:mb-1">{t("Password")}</Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-3 rtl:pr-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                required
                                tabIndex={3}
                                autoComplete="new-password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="••••••••••••"
                                className="ltr:pl-10 rtl:pr-10 ltr:pr-10 rtl:pl-10 w-full border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg transition-all duration-200 text-gray-900 dark:text-white h-11 [@media(max-height:850px)]:h-8 [@media(max-height:620px)]:h-7 [@media(max-height:850px)]:text-xs [@media(max-height:620px)]:text-[10px]"
                            />
                            <div className="absolute inset-y-0 ltr:right-0 rtl:left-0 ltr:pr-3 rtl:pl-3 flex items-center">
                                <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none cursor-pointer">
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <InputError message={errors.password} />
                    </div>

                    <div>
                        <Label htmlFor="password_confirmation" required className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 [@media(max-height:680px)]:mb-1">{t("Confirm password")}</Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-3 rtl:pr-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <Input
                                id="password_confirmation"
                                type={showConfirmPassword ? "text" : "password"}
                                required
                                tabIndex={4}
                                autoComplete="new-password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                placeholder="••••••••••••"
                                className="ltr:pl-10 rtl:pr-10 ltr:pr-10 rtl:pl-10 w-full border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg transition-all duration-200 text-gray-900 dark:text-white h-11 [@media(max-height:850px)]:h-8 [@media(max-height:620px)]:h-7 [@media(max-height:850px)]:text-xs [@media(max-height:620px)]:text-[10px]"
                            />
                            <div className="absolute inset-y-0 ltr:right-0 rtl:left-0 ltr:pr-3 rtl:pl-3 flex items-center">
                                <button type="button" tabIndex={-1} onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none cursor-pointer">
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <InputError message={errors.password_confirmation} />
                    </div>
                </div>

                <div className="flex items-center !mt-4 !mb-5 [@media(max-height:680px)]:!mt-2 [@media(max-height:680px)]:!mb-2">
                    <Checkbox
                        id="terms"
                        name="terms"
                        checked={data.terms}
                        onClick={() => setData('terms', !data.terms)}
                        tabIndex={5}
                        className="border border-gray-300 rounded"
                    />
                    <Label htmlFor="terms" required className="ml-2 text-sm text-gray-600">
                        {t("I agree to the")}{' '}
                        <a 
                            href={termsConditionsUrl || route('home')} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ color: primaryColor }} 
                            className="hover:underline"
                        >
                            {t("Terms and Conditions")}
                        </a>
                    </Label>
                </div>
                <InputError message={errors.terms} />

                <Recaptcha 
                    onVerify={setRecaptchaToken}
                    onExpired={() => setRecaptchaToken('')}
                    onError={() => setRecaptchaToken('')}
                />

                <button
                    type="submit"
                    disabled={processing}
                    tabIndex={6}
                    className="cursor-pointer w-full text-white py-2.5 [@media(max-height:850px)]:py-1.5 [@media(max-height:620px)]:py-1 [@media(max-height:850px)]:text-xs [@media(max-height:620px)]:text-[10px] text-sm font-medium tracking-wide transition-all duration-200 rounded-md shadow-md hover:shadow-lg transform hover:scale-[1.02] disabled:opacity-50"
                    style={{ backgroundColor: primaryColor }}
                >
                    {processing ? t("Creating account...") : t("Create Account")}
                </button>

                <div className="text-center">
                    <p className="text-sm text-gray-500">
                        {t("Already have an account?")}{' '}
                        <TextLink 
                            href={route('login')} 
                            className="font-medium hover:underline" 
                            style={{ color: primaryColor }}
                            tabIndex={7}
                        >
                            {t("Sign in")}
                        </TextLink>
                    </p>
                </div>
            </form>
        </AuthLayout>
    );
}