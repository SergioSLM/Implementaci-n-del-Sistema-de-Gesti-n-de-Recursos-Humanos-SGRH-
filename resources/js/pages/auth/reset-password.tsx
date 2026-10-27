import { useForm } from '@inertiajs/react';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import AuthLayout from '@/layouts/auth-layout';
import AuthButton from '@/components/auth/auth-button';
import { useBrand } from '@/contexts/BrandContext';
import { THEME_COLORS } from '@/hooks/use-appearance';

interface ResetPasswordProps {
    token: string;
    email: string;
}

type ResetPasswordForm = {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
};

export default function ResetPassword({ token, email }: ResetPasswordProps) {
    const { t } = useTranslation();
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
    const { themeColor, customColor } = useBrand();
    const primaryColor = themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS];
    const { data, setData, post, processing, errors, reset } = useForm<Required<ResetPasswordForm>>({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout
            title={t("Reset your password")}
            description={t("Please enter your new password below")}
            icon={<Lock className="h-7 w-7" style={{ color: primaryColor }} />}
        >
            <form onSubmit={submit} className="space-y-5 [@media(max-height:850px)]:space-y-2 [@media(max-height:620px)]:space-y-1">
                <div className="space-y-4 [@media(max-height:850px)]:space-y-2 [@media(max-height:620px)]:space-y-1">
                    <div>
                        <Label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 [@media(max-height:680px)]:mb-1">{t("Email")}</Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-3 rtl:pr-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <Input
                                id="email"
                                type="email"
                                readOnly
                                value={data.email}
                                className="ltr:pl-10 rtl:pr-10 w-full border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-gray-900 dark:text-white h-11 [@media(max-height:850px)]:h-8 [@media(max-height:620px)]:h-7 [@media(max-height:850px)]:text-xs [@media(max-height:620px)]:text-[10px]"
                            />
                        </div>
                        <InputError message={errors.email} />
                    </div>

                    <div>
                        <Label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 [@media(max-height:680px)]:mb-1">{t("New Password")}</Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-3 rtl:pr-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                required
                                autoFocus
                                tabIndex={1}
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
                        <Label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 [@media(max-height:680px)]:mb-1">{t("Confirm Password")}</Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-3 rtl:pr-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <Input
                                id="password_confirmation"
                                type={showConfirmPassword ? "text" : "password"}
                                required
                                tabIndex={2}
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

                <button
                    type="submit"
                    disabled={processing}
                    tabIndex={3}
                    className="cursor-pointer w-full text-white py-2.5 [@media(max-height:850px)]:py-1.5 [@media(max-height:620px)]:py-1 [@media(max-height:850px)]:text-xs [@media(max-height:620px)]:text-[10px] text-sm font-medium tracking-wide transition-all duration-200 rounded-md shadow-md hover:shadow-lg transform hover:scale-[1.02] disabled:opacity-50"
                    style={{ backgroundColor: primaryColor }}
                >
                    {processing ? t("Resetting...") : t("Reset Password")}
                </button>
            </form>
        </AuthLayout>
    );
}