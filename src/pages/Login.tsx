import React, { useState } from 'react';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

import { User } from '../types';

interface LoginProps {
    onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const inputEmail = email.trim();
        const inputPassword = password.trim();

        // Admin check via environment variables
        const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
        const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;

        if (adminEmail && adminPassword &&
            inputEmail === adminEmail.trim() &&
            inputPassword === adminPassword.trim()) {
            setTimeout(() => {
                onLogin({
                    id: inputEmail,
                    email: inputEmail,
                    name: '맹민우',
                    role: 'admin',
                    password: inputPassword
                });
                setIsLoading(false);
            }, 800);
            return;
        }

        // 1. Supabase에서 사용자 조회 시도 (최신 정보)
        let regUser = null;
        if (supabase) {
            try {
                const { data, error } = await supabase
                    .from('registered_users')
                    .select('*')
                    .eq('email', email)
                    .single();

                if (!error && data) {
                    regUser = data;
                }
            } catch (err) {
                console.error('Supabase auth search error:', err);
            }
        }

        // 2. LocalStorage에서 사용자 조회 시도 (오프라인/캐시 fallback)
        if (!regUser) {
            const savedUsers = localStorage.getItem('registered_users');
            if (savedUsers) {
                try {
                    const users = JSON.parse(savedUsers);
                    regUser = users.find((u: any) => u.email === email);
                } catch (e) {
                    console.error('Failed to parse local users:', e);
                }
            }
        }

        // 3. 비밀번호 확인 및 로그인 처리
        if (regUser && regUser.password === password) {
            // 정보 업데이트 (캐시)
            const savedUsers = localStorage.getItem('registered_users');
            let currentLocalUsers = savedUsers ? JSON.parse(savedUsers) : [];
            const index = currentLocalUsers.findIndex((u: any) => u.email === email);
            if (index > -1) {
                currentLocalUsers[index] = regUser;
            } else {
                currentLocalUsers.push(regUser);
            }
            localStorage.setItem('registered_users', JSON.stringify(currentLocalUsers));

            setTimeout(() => {
                onLogin(regUser);
                setIsLoading(false);
            }, 800);
            return;
        }



        setTimeout(() => {
            setError('아이디 또는 비밀번호가 올바르지 않습니다.');
            setIsLoading(false);
        }, 800);

    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                    <div className="bg-blue-600 p-8 text-white text-center">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                            <LogIn className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold">교무통신 서비스 로그인</h2>
                        <p className="text-blue-100 mt-2">김천다수초등학교 구성원 전용</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-sm font-medium">{error}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 ml-1">이메일 주소</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="example@sc2.gyo6.net"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 ml-1">비밀번호</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center"
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                '로그인'
                            )}
                        </button>

                        <div className="text-center">
                            <p className="text-slate-500 text-sm">
                                아이디/비밀번호 분실 시 관리자에게 문의하세요.
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
