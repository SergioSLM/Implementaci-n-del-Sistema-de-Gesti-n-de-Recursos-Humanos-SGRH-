import { useForm, router, usePage } from '@inertiajs/react';
import { Mail, Lock, Eye, EyeOff, Users, ShieldCheck, Building2, User, Copy, Briefcase } from 'lucide-react';
import { FormEventHandler, useState, useEffect } from 'react';

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
import { Button } from '@/components/ui/button';
import { isUserRegistrationEnabled } from '@/utils/helpers';

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
    recaptcha_token?: string;
};

interface Business {
    id: number;
    name: string;
    slug: string;
    business_type: string;
}

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
    demoBusinesses?: Business[];
}

export default function Login({ status, canResetPassword, demoBusinesses = [] }: LoginProps) {
    const { t } = useTranslation();
    const [recaptchaToken, setRecaptchaToken] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [validationErrors, setValidationErrors] = useState<any>({});
    const { themeColor, customColor } = useBrand();
    const primaryColor = themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS];
    const { props } = usePage();
    const isSaas = (props as any).globalSettings?.is_saas;
    const isDemo = (props as any).globalSettings?.is_demo;

    const { data, setData, post, processing, errors, reset, transform } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
        recaptcha_token: '',
    });

    useEffect(() => {
        // Set default credentials if in demo mode
        if (isDemo) {
            setData((prev) => ({
                ...prev,
                email: isSaas ? 'company@example.com' : 'company@example.com',
                password: 'password',
                remember: false
            }));
        }
    }, [isDemo]);

    const handleCopyCredentials = (email: string, password = 'password') => {
        setData((prev) => ({
            ...prev,
            email: email,
            password: password
        }));

        if (navigator.clipboard) {
            navigator.clipboard.writeText(email);
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        setValidationErrors({});

        const tokenToSend = recaptchaToken || data.recaptcha_token || (typeof window !== 'undefined' && window.grecaptcha?.getResponse ? window.grecaptcha.getResponse() : '');

        transform((currentData) => ({
            ...currentData,
            recaptcha_token: tokenToSend,
        }));

        post(route('login'), {
            onFinish: () => reset('password'),
            preserveState: true,
            preserveScroll: true,
            onError: (errors) => {
                setValidationErrors(errors);
            }
        });
    };

    // No longer needed as we're using router.post directly in the button handlers

    const openBusinessInNewTab = (businessId: number, slug: string, e: React.MouseEvent) => {
        // Prevent the default form submission
        e.preventDefault();
        e.stopPropagation();

        // Use the same URL structure as in vcard-builder/index.tsx
        const url = route('public.vcard.show.direct', slug);
        window.open(url, '_blank');
    };

    // plan_expired comes back as a validation error key from CheckPlanAccess middleware
    const planExpiredMessage = (errors as any).plan_expired;
    const displayStatus = planExpiredMessage || status;
    const displayStatusType = planExpiredMessage ? 'error' : 'success';
    return (
            <AuthLayout
                title={t("Welcome back!")}
                description={t("Sign in to continue to your account")}
                status={displayStatus}
                statusType={displayStatusType}
            >
            <form className="space-y-3 sm:space-y-4 [@media(max-height:680px)]:space-y-2 [@media(max-height:620px)]:space-y-1" onSubmit={submit}>
                <div className="space-y-4 [@media(max-height:850px)]:space-y-2 [@media(max-height:620px)]:space-y-1">
                    <div>
                        <Label htmlFor="email" required className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 [@media(max-height:680px)]:mb-1">{t("Email address")}</Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-3 rtl:pr-3 flex items-center pointer-events-none">
                                <Mail className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-gray-400" />
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
                        <InputError message={validationErrors.email || errors.email} />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2 [@media(max-height:680px)]:mb-1">
                            <Label htmlFor="password" required className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("Password")}</Label>
                            {canResetPassword && (
                                <TextLink
                                    href={route('password.request')}
                                    className="text-sm no-underline hover:underline hover:underline-primary"
                                    style={{ color: primaryColor }}
                                    tabIndex={5}
                                >
                                    {t("Forgot password?")}
                                </TextLink>
                            )}
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-3 rtl:pr-3 flex items-center pointer-events-none">
                                <Lock className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-gray-400" />
                            </div>
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                required
                                tabIndex={2}
                                autoComplete="current-password"
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
                        <InputError message={validationErrors.password || errors.password} />
                    </div>

                    <div className="flex items-center !mt-2.5 !mb-3 [@media(max-height:680px)]:!mt-1.5 [@media(max-height:680px)]:!mb-2 [@media(max-height:620px)]:!mt-1 [@media(max-height:620px)]:!mb-1">
                        <Checkbox
                            id="remember"
                            name="remember"
                            checked={data.remember}
                            onClick={() => setData('remember', !data.remember)}
                            tabIndex={3}
                            className="w-[14px] h-[14px] border border-gray-300 dark:border-gray-600 rounded"
                        />
                        <Label htmlFor="remember" className="ltr:ml-2 rtl:mr-2 text-sm text-gray-600 dark:text-gray-400">{t("Remember me")}</Label>
                    </div>
                </div>

                <Recaptcha
                    onVerify={(token) => {
                        setRecaptchaToken(token);
                        setData('recaptcha_token', token);
                    }}
                    onExpired={() => {
                        setRecaptchaToken('');
                        setData('recaptcha_token', '');
                    }}
                    onError={() => {
                        setRecaptchaToken('');
                        setData('recaptcha_token', '');
                    }}
                />
                <InputError message={validationErrors.recaptcha_token || errors.recaptcha_token} />

                <button
                    type="submit"
                    disabled={processing}
                    tabIndex={4}
                    className="cursor-pointer w-full text-white py-2.5 [@media(max-height:850px)]:py-1.5 [@media(max-height:620px)]:py-1 [@media(max-height:850px)]:text-xs [@media(max-height:620px)]:text-[10px] text-sm font-medium tracking-wide transition-all duration-200 rounded-md shadow-md hover:shadow-lg transform hover:scale-[1.02] disabled:opacity-50"
                    style={{ backgroundColor: primaryColor }}
                >
                    {processing ? t("Signing in...") : t("Login")}
                </button>

                {isSaas && isUserRegistrationEnabled() && (
                    <div className="text-center">
                        <p className="text-sm text-gray-500">
                            {t("Don't have an account?")}{' '}
                            <TextLink
                                href={route('register')}
                                className="font-medium hover:underline"
                                style={{ color: primaryColor }}
                                tabIndex={6}
                            >
                                {t("Sign up")}
                            </TextLink>
                        </p>
                    </div>
                )}

                {isDemo && (
                    <>
                        <div className="mt-2 sm:mt-3 border-t border-gray-100/60 dark:border-gray-700 pt-2 sm:pt-3 [@media(max-height:680px)]:mt-1.5 [@media(max-height:680px)]:pt-1.5 [@media(max-height:620px)]:mt-1 [@media(max-height:620px)]:pt-1">
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-2 sm:p-3 [@media(max-height:850px)]:p-1.5 [@media(max-height:620px)]:p-1 [@media(max-height:850px)]:mt-2 [@media(max-height:620px)]:mt-1 border border-gray-100 dark:border-gray-700 shadow-sm">
                                <div className="flex items-center mb-1.5 sm:mb-2">
                                    <div className="w-6 h-6 rounded-full flex items-center justify-center ltr:mr-2 rtl:ml-2" style={{ backgroundColor: `${primaryColor}15` }}>
                                        <Users className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                                    </div>
                                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">{t('Demo Login Credentials')}</h3>
                                </div>

                                <div className="w-full overflow-hidden rounded-lg border border-gray-100 dark:border-gray-700">
                                    <table className="w-full text-[11px] sm:text-xs ltr:text-left rtl:text-right table-fixed">
                                        <thead style={{ backgroundColor: `${primaryColor}10` }}>
                                            <tr className="text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700">
                                                <th className="py-1.5 [@media(max-height:680px)]:py-0.5 ltr:pl-2 rtl:pr-2 font-semibold w-[35%]">{t("Role")}</th>
                                                <th className="py-1.5 [@media(max-height:680px)]:py-0.5 font-semibold w-[35%] truncate">{t("Email")}</th>
                                                <th className="py-2 [@media(max-height:680px)]:py-0.5 font-semibold w-[20%]">{t("Password")}</th>
                                                <th className="py-2 [@media(max-height:680px)]:py-0.5 ltr:pr-3 rtl:pl-3 w-[10%]"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100/80 dark:divide-gray-700">
                                            {isSaas && (
                                                <tr>
                                                    <td className="py-1 [@media(max-height:680px)]:py-0 ltr:pl-2 rtl:pr-2">
                                                        <div className="flex items-center">
                                                            <div className="hidden sm:flex w-5 h-5 [@media(max-height:680px)]:w-4 [@media(max-height:680px)]:h-4 rounded-full bg-green-50 dark:bg-green-900/30 items-center justify-center ltr:mr-2 rtl:ml-2 flex-shrink-0">
                                                                <ShieldCheck className="w-3 h-3 [@media(max-height:680px)]:w-2.5 [@media(max-height:680px)]:h-2.5" style={{ color: primaryColor }} />
                                                            </div>
                                                            <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{t("Super Admin")}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-1 [@media(max-height:680px)]:py-0 text-gray-600 dark:text-gray-300 truncate ltr:pr-2 rtl:pl-2" title="superadmin@example.com">superadmin@example.com</td>
                                                    <td className="py-1 [@media(max-height:680px)]:py-0 text-gray-600 dark:text-gray-300 truncate font-mono text-sm [@media(max-height:680px)]:text-xs">password</td>
                                                    <td className="py-1 [@media(max-height:680px)]:py-0 ltr:pr-3 rtl:pl-3 ltr:text-right rtl:text-left">
                                                        <button type="button" onClick={() => handleCopyCredentials('superadmin@example.com')} className="inline-flex items-center justify-center rounded p-1.5 [@media(max-height:680px)]:p-1 transition-colors cursor-pointer hover:opacity-80" style={{ backgroundColor: `${primaryColor}15` }}>
                                                            <Copy className="w-3.5 h-3.5 [@media(max-height:680px)]:w-3 [@media(max-height:680px)]:h-3" style={{ color: primaryColor }} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )}
                                            <tr>
                                                <td className="py-1 [@media(max-height:680px)]:py-0 ltr:pl-2 rtl:pr-2">
                                                    <div className="flex items-center">
                                                        <div className="hidden sm:flex w-5 h-5 [@media(max-height:680px)]:w-4 [@media(max-height:680px)]:h-4 rounded-full bg-purple-50 dark:bg-purple-900/30 items-center justify-center ltr:mr-2 rtl:ml-2 flex-shrink-0">
                                                            <Building2 className="w-3 h-3 [@media(max-height:680px)]:w-2.5 [@media(max-height:680px)]:h-2.5" style={{ color: primaryColor }} />
                                                        </div>
                                                        <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{t("Company")}</span>
                                                    </div>
                                                </td>
                                                <td className="py-1 [@media(max-height:680px)]:py-0 text-gray-600 dark:text-gray-300 truncate ltr:pr-2 rtl:pl-2" title={isSaas ? "company@example.com" : "company@example.com"}>{isSaas ? "company@example.com" : "company@example.com"}</td>
                                                <td className="py-1 [@media(max-height:680px)]:py-0 text-gray-600 dark:text-gray-300 truncate font-mono text-sm [@media(max-height:680px)]:text-xs">password</td>
                                                <td className="py-1 [@media(max-height:680px)]:py-0 ltr:pr-3 rtl:pl-3 ltr:text-right rtl:text-left">
                                                    <button type="button" onClick={() => handleCopyCredentials(isSaas ? 'company@example.com' : 'company@example.com')} className="inline-flex items-center justify-center rounded p-1.5 [@media(max-height:680px)]:p-1 transition-colors cursor-pointer hover:opacity-80" style={{ backgroundColor: `${primaryColor}15` }}>
                                                        <Copy className="w-3.5 h-3.5 [@media(max-height:680px)]:w-3 [@media(max-height:680px)]:h-3" style={{ color: primaryColor }} />
                                                    </button>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="py-1 [@media(max-height:680px)]:py-0 ltr:pl-2 rtl:pr-2">
                                                    <div className="flex items-center">
                                                        <div className="hidden sm:flex w-5 h-5 [@media(max-height:680px)]:w-4 [@media(max-height:680px)]:h-4 rounded-full bg-indigo-50 dark:bg-indigo-900/30 items-center justify-center ltr:mr-2 rtl:ml-2 flex-shrink-0">
                                                            <Briefcase className="w-3 h-3 [@media(max-height:680px)]:w-2.5 [@media(max-height:680px)]:h-2.5" style={{ color: primaryColor }} />
                                                        </div>
                                                        <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{t("HR")}</span>
                                                    </div>
                                                </td>
                                                <td className="py-1 [@media(max-height:680px)]:py-0 text-gray-600 dark:text-gray-300 truncate ltr:pr-2 rtl:pl-2" title={isSaas ? "maggie93@example.com" : "hr@example.com"}>{isSaas ? "maggie93@example.com" : "hr@example.com"}</td>
                                                <td className="py-1 [@media(max-height:680px)]:py-0 text-gray-600 dark:text-gray-300 truncate font-mono text-sm [@media(max-height:680px)]:text-xs">password</td>
                                                <td className="py-1 [@media(max-height:680px)]:py-0 ltr:pr-3 rtl:pl-3 ltr:text-right rtl:text-left">
                                                    <button type="button" onClick={() => handleCopyCredentials(isSaas ? 'maggie93@example.com' : 'hr@example.com')} className="inline-flex items-center justify-center rounded p-1.5 [@media(max-height:680px)]:p-1 transition-colors cursor-pointer hover:opacity-80" style={{ backgroundColor: `${primaryColor}15` }}>
                                                        <Copy className="w-3.5 h-3.5 [@media(max-height:680px)]:w-3 [@media(max-height:680px)]:h-3" style={{ color: primaryColor }} />
                                                    </button>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="py-1 [@media(max-height:680px)]:py-0 ltr:pl-2 rtl:pr-2">
                                                    <div className="flex items-center">
                                                        <div className="hidden sm:flex w-5 h-5 [@media(max-height:680px)]:w-4 [@media(max-height:680px)]:h-4 rounded-full bg-blue-50 dark:bg-blue-900/30 items-center justify-center ltr:mr-2 rtl:ml-2 flex-shrink-0">
                                                            <User className="w-3 h-3 [@media(max-height:680px)]:w-2.5 [@media(max-height:680px)]:h-2.5" style={{ color: primaryColor }} />
                                                        </div>
                                                        <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{t("Employee")}</span>
                                                    </div>
                                                </td>
                                                <td className="py-1 [@media(max-height:680px)]:py-0 text-gray-600 dark:text-gray-300 truncate ltr:pr-2 rtl:pl-2" title={isSaas ? "qwaters@example.com" : "employee@example.com"}>{isSaas ? "qwaters@example.com" : "employee@example.com"}</td>
                                                <td className="py-1 [@media(max-height:680px)]:py-0 text-gray-600 dark:text-gray-300 truncate font-mono text-sm [@media(max-height:680px)]:text-xs">password</td>
                                                <td className="py-1 [@media(max-height:680px)]:py-0 ltr:pr-3 rtl:pl-3 ltr:text-right rtl:text-left">
                                                    <button type="button" onClick={() => handleCopyCredentials(isSaas ? 'qwaters@example.com' : 'employee@example.com')} className="inline-flex items-center justify-center rounded p-1.5 [@media(max-height:680px)]:p-1 transition-colors cursor-pointer hover:opacity-80" style={{ backgroundColor: `${primaryColor}15` }}>
                                                        <Copy className="w-3.5 h-3.5 [@media(max-height:680px)]:w-3 [@media(max-height:680px)]:h-3" style={{ color: primaryColor }} />
                                                    </button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </>
                )}


            </form>
        </AuthLayout>
    );
}
