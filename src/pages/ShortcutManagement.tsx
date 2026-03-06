import React, { useState, useEffect } from 'react';
import { ExternalLink, Plus, Trash2, Save, Globe, Link2, LayoutGrid, ChevronUp, ChevronDown } from 'lucide-react';
import { Shortcut, User } from '../types';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';

interface ShortcutManagementProps {
    user: User | null;
}

const DEFAULT_SHORTCUTS: Shortcut[] = [
    { id: '1', label: '나이스', url: 'https://www.neis.go.kr' },
    { id: '2', label: '에듀파인', url: 'https://klef.go.kr' },
    { id: '3', label: '학교홈페이지', url: 'http://dasu.es.kr' },
    { id: '4', label: 'K-에듀파인', url: 'https://fin.go.kr' },
];

export const ShortcutManagement: React.FC<ShortcutManagementProps> = ({ user }) => {
    const [shortcuts, setShortcuts] = useState<(Shortcut & { position?: number })[]>([]);
    const [newLabel, setNewLabel] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchShortcuts();
    }, []);

    const fetchShortcuts = async () => {
        setIsLoading(true);
        try {
            if (supabase) {
                const { data, error } = await supabase
                    .from('app_shortcuts')
                    .select('*')
                    .eq('type', 'global')
                    .order('position', { ascending: true })
                    .order('created_at', { ascending: true });

                if (!error && data) {
                    setShortcuts(data as Shortcut[]);
                    localStorage.setItem('cached_shortcuts', JSON.stringify(data));
                } else if (error) {
                    throw error;
                }
            }
        } catch (err) {
            console.error('Failed to fetch shortcuts:', err);
            const cached = localStorage.getItem('cached_shortcuts');
            if (cached) {
                setShortcuts(JSON.parse(cached));
            } else {
                setShortcuts(DEFAULT_SHORTCUTS);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const addShortcut = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLabel || !newUrl || user?.role !== 'admin') return;

        const url = newUrl.startsWith('http') ? newUrl : `https://${newUrl}`;
        const maxPos = shortcuts.length > 0 ? Math.max(...shortcuts.map(s => s.position || 0)) : 0;

        const newItem = {
            id: Math.random().toString(36).substr(2, 9),
            label: newLabel,
            url,
            type: 'global',
            authorEmail: user?.email,
            position: maxPos + 1
        };

        if (supabase) {
            const { error } = await supabase.from('app_shortcuts').insert([newItem]);
            if (error) {
                setMessage({ type: 'error', text: `등록 실패: ${error.message}` });
                return;
            }
        }

        setShortcuts([...shortcuts, newItem]);
        setNewLabel('');
        setNewUrl('');
        setMessage({ type: 'success', text: '새 바로가기가 등록되었습니다.' });
    };

    const deleteShortcut = async (id: string) => {
        if (user?.role !== 'admin' || !window.confirm('이 바로가기를 삭제하시겠습니까?')) return;

        if (supabase) {
            const { error } = await supabase.from('app_shortcuts').delete().eq('id', id);
            if (error) {
                setMessage({ type: 'error', text: `삭제 실패: ${error.message}` });
                return;
            }
        }

        setShortcuts(shortcuts.filter(s => s.id !== id));
        setMessage({ type: 'success', text: '바로가기가 삭제되었습니다.' });
    };

    const updateShortcut = async (id: string, label: string, url: string) => {
        if (user?.role !== 'admin') return;

        const updatedUrl = url.startsWith('http') ? url : `https://${url}`;

        if (supabase) {
            const { error } = await supabase
                .from('app_shortcuts')
                .update({ label, url: updatedUrl })
                .eq('id', id);

            if (error) {
                setMessage({ type: 'error', text: `수정 실패: ${error.message}` });
                return;
            }
        }

        setShortcuts(shortcuts.map(s => s.id === id ? { ...s, label, url: updatedUrl } : s));
        setMessage({ type: 'success', text: '바로가기 정보가 수정되었습니다.' });
    };

    const moveShortcut = async (id: string, direction: 'up' | 'down') => {
        const index = shortcuts.findIndex(s => s.id === id);
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === shortcuts.length - 1)) return;

        const newShortcuts = [...shortcuts];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        // Swap positions in local state
        const temp = newShortcuts[index];
        newShortcuts[index] = newShortcuts[targetIndex];
        newShortcuts[targetIndex] = temp;

        // Update position numbers
        const updated = newShortcuts.map((s, idx) => ({ ...s, position: idx }));
        setShortcuts(updated);

        if (supabase) {
            const { error } = await supabase.from('app_shortcuts').upsert(updated.map(s => ({
                id: s.id,
                label: s.label,
                url: s.url,
                position: s.position,
                authorEmail: user?.email,
                type: 'global'
            })));

            if (error) {
                console.error('Failed to update order:', error);
                setMessage({ type: 'error', text: '순서 저장에 실패했습니다.' });
                return;
            }
        }
        setMessage({ type: 'success', text: '순서가 변경되었습니다.' });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Globe className="w-8 h-8 text-blue-600" />
                        바로가기 관리
                    </h2>
                    <p className="text-slate-500 mt-1">상단 바에 표시될 공통 바로가기 링크를 관리합니다.</p>
                </div>
            </header>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-blue-600" />
                    새 바로가기 등록
                </h3>
                <form onSubmit={addShortcut} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 ml-1">사이트 이름</label>
                        <input
                            type="text"
                            placeholder="예: 나이스, 에듀파인"
                            value={newLabel}
                            onChange={(e) => setNewLabel(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 ml-1">URL 주소</label>
                        <input
                            type="text"
                            placeholder="https://..."
                            value={newUrl}
                            onChange={(e) => setNewUrl(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        추가하기
                    </button>
                </form>
            </div>

            {message && (
                <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                    <div className={`w-2 h-2 rounded-full ${message.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {message.text}
                    <button onClick={() => setMessage(null)} className="ml-auto opacity-50 hover:opacity-100 font-black">×</button>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <LayoutGrid className="w-5 h-5 text-slate-400" />
                        등록된 바로가기 목록
                        <span className="ml-2 px-2 py-0.5 bg-slate-200 text-slate-600 text-xs rounded-full">
                            {shortcuts.length}개
                        </span>
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-slate-400 text-sm font-bold border-b border-slate-100">
                                <th className="px-6 py-4 w-16 text-center">순서</th>
                                <th className="px-6 py-4 w-1/4">이름</th>
                                <th className="px-6 py-4">URL</th>
                                <th className="px-6 py-4 text-right">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {shortcuts.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                        <Globe className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>등록된 바로가기가 없습니다.</p>
                                    </td>
                                </tr>
                            ) : (
                                shortcuts.map((s, idx) => (
                                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-center gap-1">
                                                <button
                                                    onClick={() => moveShortcut(s.id, 'up')}
                                                    disabled={idx === 0}
                                                    className="p-1 hover:bg-slate-200 rounded disabled:opacity-20"
                                                >
                                                    <ChevronUp className="w-4 h-4" />
                                                </button>
                                                <span className="text-xs font-bold text-slate-400">{idx + 1}</span>
                                                <button
                                                    onClick={() => moveShortcut(s.id, 'down')}
                                                    disabled={idx === shortcuts.length - 1}
                                                    className="p-1 hover:bg-slate-200 rounded disabled:opacity-20"
                                                >
                                                    <ChevronDown className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="text"
                                                defaultValue={s.label}
                                                onBlur={(e) => {
                                                    if (e.target.value !== s.label) {
                                                        updateShortcut(s.id, e.target.value, s.url);
                                                    }
                                                }}
                                                className="w-full bg-transparent border-none focus:ring-0 font-bold text-slate-700 p-0 focus:bg-white focus:px-2 focus:py-1 rounded transition-all"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Link2 className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                <input
                                                    type="text"
                                                    defaultValue={s.url}
                                                    onBlur={(e) => {
                                                        if (e.target.value !== s.url) {
                                                            updateShortcut(s.id, s.label, e.target.value);
                                                        }
                                                    }}
                                                    className="w-full bg-transparent border-none focus:ring-0 text-slate-500 text-sm p-0 focus:bg-white focus:px-2 focus:py-1 rounded transition-all font-medium"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => window.open(s.url, '_blank')}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="이동하기"
                                                >
                                                    <ExternalLink className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => deleteShortcut(s.id)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                    title="삭제"
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

            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 flex gap-4">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0 text-amber-600">
                    <Save className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="font-bold text-amber-900 mb-1">편집 및 정렬 안내</h4>
                    <p className="text-sm text-amber-700 leading-relaxed">
                        화살표 아이콘을 클릭하여 바로가기의 표시 순서를 변경할 수 있습니다.<br />
                        텍스트 수정 시 입력란에서 포커스를 벗어나면 자동으로 저장됩니다.
                    </p>
                </div>
            </div>
        </div>
    );
};
