import React, { useState, useRef, useEffect } from 'react';
import { Users, Upload, FileText, AlertCircle, CheckCircle2, UserPlus, Trash2, Mail, Shield, Download } from 'lucide-react';
import { User } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const savedUsers = localStorage.getItem('registered_users');
        if (savedUsers) {
            setUsers(JSON.parse(savedUsers));
        }
    }, []);

    const saveUsers = (newUsers: User[]) => {
        setUsers(newUsers);
        localStorage.setItem('registered_users', JSON.stringify(newUsers));
    };

    const handleDownloadTemplate = () => {
        const headers = '이메일, 이름, 역할\n';
        const example = 'example@sc2.gyo6.net, 홍길동, user\n';
        const blob = new Blob([headers + example], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'user_upload_template.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            setMessage({ type: 'error', text: 'CSV 파일만 업로드 가능합니다.' });
            return;
        }

        setIsUploading(true);
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                const lines = text.split('\n');
                const newUsers: User[] = [];

                // Skip header if it exists
                const startIndex = lines[0].includes('email') || lines[0].includes('이메일') ? 1 : 0;

                for (let i = startIndex; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    const [email, name, role] = line.split(',').map(s => s.trim());
                    if (email && email.includes('@')) {
                        newUsers.push({
                            id: Math.random().toString(36).substr(2, 9),
                            email,
                            name: name || email.split('@')[0],
                            role: (role === 'admin' || role === '관리자') ? 'admin' : 'user'
                        });
                    }
                }

                if (newUsers.length === 0) {
                    throw new Error('유효한 사용자 데이터가 없습니다.');
                }

                const updatedUsers = [...users];
                newUsers.forEach(nu => {
                    if (!updatedUsers.find(u => u.email === nu.email)) {
                        updatedUsers.push(nu);
                    }
                });

                saveUsers(updatedUsers);
                setMessage({ type: 'success', text: `${newUsers.length}명의 사용자가 등록되었습니다.` });
                if (fileInputRef.current) fileInputRef.current.value = '';
            } catch (err: any) {
                setMessage({ type: 'error', text: err.message || '파일 처리 중 오류가 발생했습니다.' });
            } finally {
                setIsUploading(false);
            }
        };
        reader.readAsText(file);
    };

    const deleteUser = (id: string) => {
        saveUsers(users.filter(u => u.id !== id));
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Users className="w-8 h-8 text-blue-600" />
                        사용자 관리
                    </h2>
                    <p className="text-slate-500 mt-1">교직원 계정을 일괄 등록하고 관리할 수 있습니다.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleDownloadTemplate}
                        className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <Download className="w-5 h-5" />
                        양식 다운로드
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".csv"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
                    >
                        <Upload className="w-5 h-5" />
                        {isUploading ? '처리 중...' : 'CSV 일괄 등록'}
                    </button>
                </div>
            </div>


            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`p-4 rounded-xl flex items-center gap-3 border ${message.type === 'success'
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                            : 'bg-red-50 border-red-100 text-red-700'
                            }`}
                    >
                        {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <p className="font-medium">{message.text}</p>
                        <button onClick={() => setMessage(null)} className="ml-auto text-current opacity-50 hover:opacity-100">×</button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-slate-400" />
                        등록된 사용자 목록
                        <span className="ml-2 px-2 py-0.5 bg-slate-200 text-slate-600 text-xs rounded-full">
                            {users.length}명
                        </span>
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-slate-400 text-sm font-bold border-b border-slate-100">
                                <th className="px-6 py-4">사용자</th>
                                <th className="px-6 py-4">이메일</th>
                                <th className="px-6 py-4">역할</th>
                                <th className="px-6 py-4 text-right">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                        <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>등록된 사용자가 없습니다. CSV 파일로 일괄 등록해주세요.</p>
                                    </td>
                                </tr>
                            ) : (
                                users.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200">
                                                    {u.name[0]}
                                                </div>
                                                <span className="font-bold text-slate-700">{u.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 font-medium">
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-slate-300" />
                                                {u.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${u.role === 'admin'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                <Shield className="w-3 h-3" />
                                                {u.role === 'admin' ? '관리자' : '교직원'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => deleteUser(u.id)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 flex gap-4">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0 text-blue-600">
                    <FileText className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="font-bold text-blue-900 mb-1">CSV 파일 형식 안내</h4>
                    <p className="text-sm text-blue-700 leading-relaxed">
                        CSV 파일은 <code className="bg-white px-2 py-0.5 rounded border border-blue-200 font-bold">이메일, 이름, 역할</code> 순서로 작성해주세요.<br />
                        역할은 'admin'(관리자) 또는 'user'(교직원)으로 입력 가능합니다. (헤더 생략 가능)
                    </p>
                </div>
            </div>
        </div>
    );
};
