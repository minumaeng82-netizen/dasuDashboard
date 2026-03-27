import React, { useState, useRef, useEffect } from 'react';
import { Users, Upload, FileText, AlertCircle, CheckCircle2, UserPlus, Trash2, Mail, Shield, Download, RefreshCcw, Edit2, X, Settings2, Layout as LayoutIcon, Save, Building2, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { User, SystemSettings } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface AdminSettingsProps {
    user: User | null;
}

export interface RegularReservation {
    id: string;
    roomName: string;
    dayOfWeek: number; // 1:월, 2:화, 3:수, 4:목, 5:금
    timeRange: string;
    classGrade: string;
    userName: string;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<'users' | 'title' | 'special'>('users');
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

    // Special Room Management State
    const [regularReservations, setRegularReservations] = useState<RegularReservation[]>([]);
    const [regSelectedRoom, setRegSelectedRoom] = useState('체육관');
    
    const [isRegModalOpen, setIsRegModalOpen] = useState(false);
    const [regEditingId, setRegEditingId] = useState<string | null>(null);
    const [regDay, setRegDay] = useState<number>(1);
    const [regTimeRange, setRegTimeRange] = useState('1교시');
    const [regClassGrade, setRegClassGrade] = useState('1-1');

    useEffect(() => {
        fetchUsers();
        fetchSystemSettings();
        const savedRegs = localStorage.getItem('room_regular_reservations');
        if (savedRegs) {
            try { 
                const parsed = JSON.parse(savedRegs).map((r: any) => 
                    r.roomName === '전담교실' ? { ...r, roomName: '전담실' } : r
                );
                setRegularReservations(parsed); 
            } catch(e){}
        }
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
            window.dispatchEvent(new Event('storage'));
        } catch (err) {
            console.error('Failed to save title:', err);
            setMessage({ type: 'error', text: '제목 저장 중 오류가 발생했습니다. (로컬에는 저장됨)' });
        } finally {
            setIsSavingTitle(false);
        }
    };

    const openRegModal = (dayCode: number, period: string, existingReg?: RegularReservation) => {
        setRegDay(dayCode);
        setRegTimeRange(period);
        if (existingReg) {
            setRegEditingId(existingReg.id);
            setRegClassGrade(existingReg.classGrade);
        } else {
            setRegEditingId(null);
            setRegClassGrade('1-1');
        }
        setIsRegModalOpen(true);
    };

    const handleRegModalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        let updated = [...regularReservations];
        if (regEditingId) {
            const idx = updated.findIndex(r => r.id === regEditingId);
            if (idx > -1) {
                updated[idx].classGrade = regClassGrade;
            }
            setMessage({ type: 'success', text: '정기 시간표 내용이 수정되었습니다.' });
        } else {
            updated.push({
                id: Math.random().toString(36).substr(2, 9),
                roomName: regSelectedRoom,
                dayOfWeek: regDay,
                timeRange: regTimeRange,
                classGrade: regClassGrade,
                userName: user?.name || user?.email?.split('@')[0] || '관리자'
            });
            setMessage({ type: 'success', text: '정기 시간표가 등록되었습니다.' });
        }
        setRegularReservations(updated);
        localStorage.setItem('room_regular_reservations', JSON.stringify(updated));
        setIsRegModalOpen(false);
    };

    const deleteRegReservation = () => {
        if (!regEditingId) return;
        if (!window.confirm('이 정기 시간표 구성을 삭제하시겠습니까?')) return;
        
        const updated = regularReservations.filter(r => r.id !== regEditingId);
        setRegularReservations(updated);
        localStorage.setItem('room_regular_reservations', JSON.stringify(updated));
        setMessage({ type: 'success', text: '해당 정기 시간표가 삭제되었습니다.' });
        setIsRegModalOpen(false);
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

                <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto scrollbar-hide shrink-0">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={cn(
                            "whitespace-nowrap px-6 py-2.5 rounded-xl font-bold transition-all text-sm flex items-center gap-2",
                            activeTab === 'users' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <Users className="w-4 h-4" />
                        사용자 관리
                    </button>
                    <button
                        onClick={() => setActiveTab('title')}
                        className={cn(
                            "whitespace-nowrap px-6 py-2.5 rounded-xl font-bold transition-all text-sm flex items-center gap-2",
                            activeTab === 'title' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <LayoutIcon className="w-4 h-4" />
                        제목 관리
                    </button>
                    <button
                        onClick={() => setActiveTab('special')}
                        className={cn(
                            "whitespace-nowrap px-6 py-2.5 rounded-xl font-bold transition-all text-sm flex items-center gap-2",
                            activeTab === 'special' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <Building2 className="w-4 h-4" />
                        특별실 관리
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

            {activeTab === 'users' && (
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
            )}

            {activeTab === 'title' && (
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

                            <div className="p-6 bg-slate-900 rounded-2xl text-white shadow-inner space-y-4">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">데스크톱 미리보기</p>
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

                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">모바일 미리보기</p>
                                    <div className="flex items-center gap-3 py-3 px-5 bg-white rounded-xl shadow-lg max-w-[280px]">
                                        <div className="w-8 h-8 flex items-center justify-center overflow-hidden rounded-full shrink-0">
                                            <img src="/logo.png" alt="logo" className="w-full h-full object-contain" />
                                        </div>
                                        <h1 className="flex flex-col items-start -space-y-1">
                                            <div className="flex items-center text-sm font-black">
                                                <span className="text-blue-600">김천다수</span>
                                                <span className="text-slate-900 ml-1">교무포털</span>
                                            </div>
                                            {portalName && (
                                                <span className="text-slate-500 font-medium text-[10px]">{portalName}</span>
                                            )}
                                        </h1>
                                    </div>
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

            {activeTab === 'special' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col p-4 md:p-6 min-h-[500px]">
                        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-100 gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                    <Building2 className="w-6 h-6 text-blue-600" />
                                    정기 특별실 시간표 달력
                                </h2>
                                <p className="text-slate-500 mt-1">요일별 교시 칸을 클릭하여 고정 시간표를 등록하면, 사용자의 특별실 예약 메뉴에 영구 반영됩니다.</p>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-6 mt-6 flex-1 h-full overflow-hidden">
                            {/* Room Selector */}
                            <div className="w-full md:w-56 flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide flex-shrink-0">
                                <h3 className="font-bold text-slate-700 mb-2 px-2 hidden md:block">특별실 선택</h3>
                                {['체육관', '전담실', '과학실'].map(room => (
                                    <button
                                        key={room}
                                        onClick={() => setRegSelectedRoom(room)}
                                        className={cn(
                                            "whitespace-nowrap flex-shrink-0 text-left px-4 py-3 rounded-xl font-bold transition-all border",
                                            regSelectedRoom === room
                                                ? room === '체육관' ? 'bg-red-50 text-red-600 border-red-100/50 shadow-sm'
                                                : room === '과학실' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50 shadow-sm'
                                                : 'bg-blue-50 text-blue-600 border-blue-100/50 shadow-sm'
                                                : "text-slate-600 hover:bg-slate-50 border-transparent"
                                        )}
                                    >
                                        {room}
                                    </button>
                                ))}
                            </div>

                            {/* Weekly Grid */}
                            <div className="flex-1 flex flex-col min-w-0">
                                <h3 className="text-xl font-black text-slate-800 mb-4 px-2 flex items-center gap-2">
                                    <CalendarIcon className={cn("w-5 h-5", regSelectedRoom === '체육관' ? "text-red-500" : regSelectedRoom === '과학실' ? "text-emerald-500" : "text-blue-500")} />
                                    {regSelectedRoom} 고정 시간표
                                </h3>
                                
                                <div className="flex-1 border border-slate-200 rounded-xl overflow-y-auto bg-white flex flex-col min-w-[500px]">
                                    {/* Weekdays Header */}
                                    <div className="grid grid-cols-5 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
                                        {[1, 2, 3, 4, 5].map((dayCode) => (
                                            <div key={dayCode} className="py-2 text-center text-xs font-bold tracking-wider text-slate-500">
                                                {['일', '월', '화', '수', '목', '금', '토'][dayCode]}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Grid Content */}
                                    <div className="flex-1 grid grid-cols-5 divide-x divide-slate-100">
                                        {[1, 2, 3, 4, 5].map((dayCode) => {
                                            const dayRegs = regularReservations.filter(r => r.roomName === regSelectedRoom && r.dayOfWeek === dayCode);
                                            return (
                                                <div key={dayCode} className="p-2 w-full bg-white flex flex-col min-h-[200px]">
                                                    <div className="flex-1 flex flex-col border border-slate-200 rounded-md overflow-hidden bg-white divide-y divide-slate-100 shadow-sm">
                                                        {['1교시', '2교시', '3교시', '4교시', '5교시', '6교시', '7교시', '8교시'].map(period => {
                                                            const reservation = dayRegs.find(r => r.timeRange === period);
                                                            
                                                            if (reservation) {
                                                                const eventColor = reservation.roomName === '체육관' ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                                                                : reservation.roomName === '과학실' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100';
                                                                const borderColor = reservation.roomName === '체육관' ? 'border-red-200'
                                                                                : reservation.roomName === '과학실' ? 'border-emerald-200'
                                                                                : 'border-blue-200';

                                                                return (
                                                                    <div 
                                                                        key={period} 
                                                                        onClick={() => openRegModal(dayCode, period, reservation)}
                                                                        className={cn("px-1.5 py-1.5 text-[10px] sm:text-[11px] font-bold flex items-center cursor-pointer transition-colors group/res", eventColor)}
                                                                    >
                                                                        <span className="opacity-70 flex-shrink-0 w-6 text-center">{period.replace('교시', '')}</span>
                                                                        <span className={cn("flex-1 truncate border-l ml-1 pl-1.5", borderColor)}>
                                                                            📌 {reservation.classGrade}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            } else {
                                                                return (
                                                                    <div
                                                                        key={period}
                                                                        onClick={() => openRegModal(dayCode, period)}
                                                                        className="px-1.5 py-1.5 text-[10px] sm:text-[11px] text-slate-400 bg-white hover:bg-slate-50 cursor-pointer flex items-center transition-colors group/slot"
                                                                    >
                                                                        <span className="opacity-50 flex-shrink-0 w-6 text-center">{period.replace('교시', '')}</span>
                                                                        <span className="flex-1 opacity-0 group-hover/slot:opacity-100 transition-opacity ml-1 pl-1.5 border-l border-slate-200 text-slate-400 font-medium truncate">+ 입력</span>
                                                                    </div>
                                                                );
                                                            }
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Special Room Calendar Edit Modal */}
            <AnimatePresence>
                {isRegModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 text-slate-900"
                        >
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                        {regEditingId ? <Edit2 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">{regEditingId ? '정기 시간표 변경' : '정기 시간표 입력'}</h3>
                                        <p className="text-sm font-medium text-blue-600">
                                            {regSelectedRoom} / {['일','월','화','수','목','금','토'][regDay]}요일 / {regTimeRange}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsRegModalOpen(false)}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <X className="w-6 h-6 text-slate-400" />
                                </button>
                            </div>

                            <form onSubmit={handleRegModalSubmit} className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 mx-1">사용 학반</label>
                                    <select
                                        value={['1-1', '2-1', '3-1', '4-1', '5-1', '5-2', '6-1'].includes(regClassGrade) ? regClassGrade : "직접 입력"}
                                        onChange={(e) => setRegClassGrade(e.target.value === "직접 입력" ? "" : e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold cursor-pointer"
                                        required
                                    >
                                        <option value="1-1">1-1</option>
                                        <option value="2-1">2-1</option>
                                        <option value="3-1">3-1</option>
                                        <option value="4-1">4-1</option>
                                        <option value="5-1">5-1</option>
                                        <option value="5-2">5-2</option>
                                        <option value="6-1">6-1</option>
                                        <option value="직접 입력">직접 입력 (직접 지정)</option>
                                    </select>
                                    {!['1-1', '2-1', '3-1', '4-1', '5-1', '5-2', '6-1'].includes(regClassGrade) && (
                                       <input
                                         type="text"
                                         placeholder="사용 학반 또는 목적을 직접 입력하세요"
                                         value={regClassGrade}
                                         onChange={(e) => setRegClassGrade(e.target.value)}
                                         className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all mt-2"
                                         required
                                       />
                                    )}
                                </div>

                                <div className="pt-4 flex gap-3">
                                    {regEditingId && (
                                        <button
                                            type="button"
                                            onClick={deleteRegReservation}
                                            className="px-4 py-3 border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 flex items-center justify-center gap-2 transition-all active:scale-95"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-md transition-all active:scale-95 flex justify-center items-center gap-2"
                                    >
                                        <CheckCircle2 className="w-5 h-5" />
                                        {regEditingId ? '변경 완료' : '매주 고정 등록'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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
