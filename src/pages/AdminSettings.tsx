import React, { useState, useRef, useEffect } from 'react';
import { Users, Upload, FileText, AlertCircle, CheckCircle2, UserPlus, Trash2, Mail, Shield, Download, RefreshCcw, Edit2, X, Settings2, Layout as LayoutIcon, Save } from 'lucide-react';
import { User, SystemSettings } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface AdminSettingsProps {
    user: User | null;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<'users' | 'title'>('users');
    const [users, setUsers] = useState<User[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Title Management State
    const [portalName, setPortalName] = useState('김천다수 교무포털');
    const [isSavingTitle, setIsSavingTitle] = useState(false);

    const [newEmail, setNewEmail] = useState('');
    const [newName, setNewName] = useState('');
    const [newRole, setNewRole] = useState<'admin' | 'user'>('user');

    useEffect(() => {
        fetchUsers();
        fetchSystemSettings();
    }, []);

    const fetchUsers = async () => {
        try {
            if (supabase) {
                const { data, error } = await supabase
                    .from('registered_users')
                    .select('*')
                    .order('name', { ascending: true });

                if (!error && data) {
                    setUsers(data as User[]);
                    localStorage.setItem('registered_users', JSON.stringify(data));
                    return;
                }
            }

            const savedUsers = localStorage.getItem('registered_users');
            if (savedUsers && savedUsers !== 'undefined') {
                setUsers(JSON.parse(savedUsers));
            }
        } catch (err) {
            console.error('Failed to load users:', err);
            setUsers([]);
        }
    };

    const fetchSystemSettings = async () => {
        try {
            if (supabase) {
                const { data, error } = await supabase
                    .from('site_settings')
                    .select('*')
                    .eq('id', 'main')
                    .single();

                if (!error && data) {
                    setPortalName(data.portal_name);
                    localStorage.setItem('site_portal_name', data.portal_name);
                    return;
                }
            }
            const savedPortalName = localStorage.getItem('site_portal_name');
            if (savedPortalName) {
                setPortalName(savedPortalName);
            }
        } catch (err) {
            console.error('Failed to load settings:', err);
        }
    };

    const saveUsers = async (newUsers: User[]) => {
        setUsers(newUsers);
        localStorage.setItem('registered_users', JSON.stringify(newUsers));

        if (supabase) {
            try {
                const { error } = await supabase
                    .from('registered_users')
                    .upsert(newUsers, { onConflict: 'email' });

                if (error) console.error('Supabase Sync Error:', error);
            } catch (err) {
                console.error('Supabase connection error:', err);
            }
        }
    };

    const handleIndividualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!newEmail || !newEmail.includes('@')) {
            setMessage({ type: 'error', text: '유효한 이메일을 입력해주세요.' });
            return;
        }

        if (users.find(u => u.email === newEmail)) {
            setMessage({ type: 'error', text: '이미 등록된 이메일입니다.' });
            return;
        }

        const newUser: User = {
            id: newEmail,
            email: newEmail,
            name: newName || newEmail.split('@')[0],
            role: newRole,
            password: '123456'
        };

        const updatedUsers = [...users, newUser];
        setUsers(updatedUsers);
        localStorage.setItem('registered_users', JSON.stringify(updatedUsers));

        if (supabase) {
            try {
                const { error } = await supabase
                    .from('registered_users')
                    .upsert(newUser, { onConflict: 'email' });

                if (error) {
                    console.error('Supabase Sync Error:', error);
                    setMessage({ type: 'error', text: 'DB 동기화에 실패했습니다. (로컬에는 저장됨)' });
                    return;
                }
            } catch (err) {
                console.error('Supabase connection error:', err);
            }
        }

        setMessage({ type: 'success', text: '사용자가 등록되었습니다.' });
        setNewEmail('');
        setNewName('');
    };

    const handleTitleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingTitle(true);
        setMessage(null);

        try {
            localStorage.setItem('site_portal_name', portalName);

            if (supabase) {
                const { error } = await supabase
                    .from('site_settings')
                    .upsert({ id: 'main', portal_name: portalName }, { onConflict: 'id' });

                if (error) throw error;
            }

            setMessage({ type: 'success', text: '상단 제목이 성공적으로 변경되었습니다.' });
            // Refresh to apply changes globally
            window.dispatchEvent(new Event('storage'));
        } catch (err) {
            console.error('Failed to save title:', err);
            setMessage({ type: 'error', text: '제목 저장 중 오류가 발생했습니다. (로컬에는 저장됨)' });
        } finally {
            setIsSavingTitle(false);
        }
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

                const startIndex = lines[0].includes('email') || lines[0].includes('이메일') ? 1 : 0;

                for (let i = startIndex; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    const [email, name, role] = line.split(',').map(s => s.trim());
                    if (email && email.includes('@')) {
                        newUsers.push({
                            id: email,
                            email,
                            name: name || email.split('@')[0],
                            role: (role === 'admin' || role === '관리자') ? 'admin' : 'user',
                            password: '123456'
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

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editName, setEditName] = useState('');
    const [editRole, setEditRole] = useState<'admin' | 'user'>('user');

    const openEditModal = (u: User) => {
        setEditingUser(u);
        setEditName(u.name);
        setEditRole(u.role);
        setIsEditModalOpen(true);
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        const updatedUser = { ...editingUser, name: editName, role: editRole };
        const updatedUsers = users.map(u => u.id === editingUser.id ? updatedUser : u);

        setUsers(updatedUsers);
        localStorage.setItem('registered_users', JSON.stringify(updatedUsers));

        if (supabase) {
            try {
                const { error } = await supabase
                    .from('registered_users')
                    .upsert(updatedUser);

                if (error) {
                    console.error('Supabase update error:', error);
                    setMessage({ type: 'error', text: 'DB 업데이트에 실패했습니다.' });
                } else {
                    setMessage({ type: 'success', text: `${editName} 선생님의 정보가 수정되었습니다.` });
                }
            } catch (err) {
                console.error('Connection error:', err);
            }
        }
        setIsEditModalOpen(false);
    };

    const deleteUser = async (id: string) => {
        if (!window.confirm('해당 사용자를 삭제하시겠습니까?')) return;
        const updatedUsers = users.filter(u => u.id !== id);
        setUsers(updatedUsers);
        localStorage.setItem('registered_users', JSON.stringify(updatedUsers));

        if (supabase) {
            try {
                const { error } = await supabase
                    .from('registered_users')
                    .delete()
                    .eq('id', id);

                if (error) console.error('Failed to delete user from Supabase:', error);
            } catch (err) {
                console.error('Delete connection error:', err);
            }
        }
    };

    const resetPassword = (id: string) => {
        if (!window.confirm('비밀번호를 123456으로 초기화하시겠습니까?')) return;
        const updatedUsers = users.map(u =>
            u.id === id ? { ...u, password: '123456' } : u
        );
        saveUsers(updatedUsers);
        const targetUser = users.find(u => u.id === id);
        setMessage({ type: 'success', text: `${targetUser?.name} 선생님의 비밀번호가 '123456'으로 초기화되었습니다.` });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Settings2 className="w-8 h-8 text-blue-600" />
                        시스템 설정
                    </h2>
                    <p className="text-slate-500 mt-1">사용자 및 시스템 환경을 관리할 수 있습니다.</p>
                </div>

                <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={cn(
                            "px-6 py-2.5 rounded-xl font-bold transition-all text-sm flex items-center gap-2",
                            activeTab === 'users' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <Users className="w-4 h-4" />
                        사용자 관리
                    </button>
                    <button
                        onClick={() => setActiveTab('title')}
                        className={cn(
                            "px-6 py-2.5 rounded-xl font-bold transition-all text-sm flex items-center gap-2",
                            activeTab === 'title' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <LayoutIcon className="w-4 h-4" />
                        제목 관리
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
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

            {activeTab === 'users' ? (
                <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={handleDownloadTemplate}
                                className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm text-sm"
                            >
                                <Download className="w-4 h-4" />
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
                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-100 disabled:opacity-50 text-sm"
                            >
                                <Upload className="w-4 h-4" />
                                {isUploading ? '처리 중...' : 'CSV 일괄 등록'}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-blue-600" />
                            개별 사용자 등록
                        </h3>
                        <form onSubmit={handleIndividualSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 ml-1">이메일</label>
                                <input
                                    type="email"
                                    placeholder="example@sc2.gyo6.net"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 ml-1">이름</label>
                                <input
                                    type="text"
                                    placeholder="성함 입력"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 ml-1">권한</label>
                                <select
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value as 'admin' | 'user')}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="user">교직원 (User)</option>
                                    <option value="admin">관리자 (Admin)</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                className="w-full px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95"
                            >
                                등록하기
                            </button>
                        </form>
                    </div>

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
                                                <p>등록된 사용자가 없습니다.</p>
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
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => openEditModal(u)}
                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                            title="정보 수정"
                                                        >
                                                            <Edit2 className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => resetPassword(u.id)}
                                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                            title="비밀번호 초기화"
                                                        >
                                                            <RefreshCcw className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => deleteUser(u.id)}
                                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                            title="사용자 삭제"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="animate-in slide-in-from-right-4 duration-500">
                    <div className="max-w-2xl bg-white rounded-3xl border border-slate-200 p-8 shadow-xl">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                <LayoutIcon className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">상단 부제목 설정</h3>
                                <p className="text-slate-500">로고 옆 고정 명칭 뒤에 표시될 추가 명칭(학년도 등)을 설정합니다.</p>
                            </div>
                        </div>

                        <form onSubmit={handleTitleSave} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 ml-1">추가 명칭 (부제목)</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={portalName}
                                        onChange={(e) => setPortalName(e.target.value)}
                                        placeholder="예: 2026학년도"
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-lg font-black"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase">
                                        Preview
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 ml-1 italic">* 로고와 '김천다수 교무포털'은 수정할 수 없으며, 그 뒤에 표시됩니다.</p>
                            </div>

                            <div className="p-6 bg-slate-900 rounded-2xl text-white shadow-inner">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">미리보기 (Header Preview)</p>
                                <div className="flex items-center gap-3 py-3 px-5 bg-white rounded-xl shadow-lg">
                                    <div className="w-8 h-8 flex items-center justify-center overflow-hidden rounded-full shrink-0">
                                        <img src="/logo.png" alt="logo" className="w-full h-full object-contain" />
                                    </div>
                                    <h1 className="text-lg font-black flex items-center">
                                        <span className="text-blue-600 mr-2">김천다수</span>
                                        <span className="text-slate-900">교무포털</span>
                                        {portalName && (
                                            <>
                                                <span className="w-px h-4 bg-slate-200 mx-3" />
                                                <span className="text-slate-500 font-medium">{portalName}</span>
                                            </>
                                        )}
                                    </h1>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSavingTitle}
                                className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-100 transition-all active:scale-[0.98] disabled:opacity-70"
                            >
                                {isSavingTitle ? (
                                    <RefreshCcw className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        설정 저장하기
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <AnimatePresence>
                {isEditModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200"
                        >
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-xl font-bold text-slate-900">사용자 정보 수정</h3>
                                <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                                    <X className="w-6 h-6 text-slate-400" />
                                </button>
                            </div>
                            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-slate-700">이메일</label>
                                    <input
                                        type="text"
                                        value={editingUser?.email}
                                        disabled
                                        className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-slate-700">이름</label>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-slate-700">권한</label>
                                    <select
                                        value={editRole}
                                        onChange={(e) => setEditRole(e.target.value as 'admin' | 'user')}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="user">교직원 (User)</option>
                                        <option value="admin">관리자 (Admin)</option>
                                    </select>
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
                                    >
                                        취소
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all"
                                    >
                                        수정 완료
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
