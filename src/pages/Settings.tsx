import React, { useState } from 'react';
import { User } from '../types';
import { Settings, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsProps {
    user: User | null;
    onUserUpdate: (updatedUser: User) => void;
}

export const PasswordSettings: React.FC<SettingsProps> = ({ user, onUserUpdate }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!user) return;

        // Check against registered users in localStorage to verify current password
        const savedUsers = localStorage.getItem('registered_users');
        if (!savedUsers) return;

        const users: User[] = JSON.parse(savedUsers);
        const userIndex = users.findIndex(u => u.email === user.email);

        if (userIndex === -1) {
            setMessage({ type: 'error', text: '사용자 정보를 찾을 수 없습니다.' });
            return;
        }

        const storedUser = users[userIndex];

        // Hardcoded admin check fallback if no password stored
        const actualStoredPassword = storedUser.password || (user.email === 'namdol01@sc2.gyo6.net' ? 'maengmw82@' : '123456');

        if (currentPassword !== actualStoredPassword) {
            setMessage({ type: 'error', text: '현재 비밀번호가 일치하지 않습니다.' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: '새 비밀번호와 확인 비밀번호가 일치하지 않습니다.' });
            return;
        }

        if (newPassword.length < 4) {
            setMessage({ type: 'error', text: '신규 비밀번호는 4자리 이상이어야 합니다.' });
            return;
        }

        // Update in localStorage
        const updatedUsers = [...users];
        updatedUsers[userIndex] = { ...storedUser, password: newPassword };
        localStorage.setItem('registered_users', JSON.stringify(updatedUsers));

        // Update in App state
        onUserUpdate({ ...user, password: newPassword });

        setMessage({ type: 'success', text: '비밀번호가 성공적으로 변경되었습니다.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    if (!user) return null;

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                    <Settings className="w-8 h-8 text-blue-600" />
                    내 설정
                </h2>
                <p className="text-slate-500 mt-1">계정 보안 및 개인 설정을 관리할 수 있습니다.</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                        <Lock className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">비밀번호 변경</h3>
                </div>

                <AnimatePresence mode="wait">
                    {message && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={`p-4 rounded-xl flex items-center gap-3 border mb-6 ${message.type === 'success'
                                    ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                    : 'bg-red-50 border-red-100 text-red-700'
                                }`}
                        >
                            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            <p className="font-medium">{message.text}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handlePasswordChange} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">현재 비밀번호</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="현재 비밀번호를 입력해주세요"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">새 비밀번호</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="새 비밀번호 (4자 이상)"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">새 비밀번호 확인</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="새 비밀번호를 한번 더"
                                required
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98]"
                        >
                            비밀번호 변경하기
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                <div className="flex gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-200 shadow-sm flex-shrink-0">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 mb-1">비밀번호 관리 안내</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            비밀번호를 분실하신 경우 시스템 관리자에게 요청하여 초기화할 수 있습니다.<br />
                            초기화 시 비밀번호는 최초 설정값인 <span className="font-bold text-blue-600 underline">123456</span>으로 변경됩니다.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
