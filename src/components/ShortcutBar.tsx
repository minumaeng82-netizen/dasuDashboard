import React, { useState, useEffect } from 'react';
import { ExternalLink, Plus, X, Settings2, Save } from 'lucide-react';
import { Shortcut, User } from '../types';
import { supabase } from '../lib/supabase';

interface ShortcutBarProps {
    user: User | null;
}

const DEFAULT_SHORTCUTS: Shortcut[] = [
    { id: '1', label: '나이스', url: 'https://www.neis.go.kr' },
    { id: '2', label: '에듀파인', url: 'https://klef.go.kr' },
    { id: '3', label: '학교홈페이지', url: 'http://dasu.es.kr' },
    { id: '4', label: 'K-에듀파인', url: 'https://fin.go.kr' },
];

export const ShortcutBar: React.FC<ShortcutBarProps> = ({ user }) => {
    const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [newLabel, setNewLabel] = useState('');
    const [newUrl, setNewUrl] = useState('');

    useEffect(() => {
        fetchShortcuts();
    }, [user]);

    const fetchShortcuts = async () => {
        try {
            if (supabase) {
                // 관리자만 관리하므로 항상 공통(global) 링크만 조회
                const { data, error } = await supabase
                    .from('app_shortcuts')
                    .select('*')
                    .eq('type', 'global')
                    .order('created_at', { ascending: true });

                if (!error && data && data.length > 0) {
                    setShortcuts(data as Shortcut[]);
                    localStorage.setItem('cached_shortcuts', JSON.stringify(data));
                    return;
                }
            }
        } catch (err) {
            console.error('Failed to fetch shortcuts from Supabase:', err);
        }

        // Fallback to localStorage or Defaults
        const cached = localStorage.getItem('cached_shortcuts');
        if (cached) {
            setShortcuts(JSON.parse(cached));
        } else {
            setShortcuts(DEFAULT_SHORTCUTS);
        }
    };

    const handleSync = async () => {
        if (!supabase || user?.role !== 'admin') {
            setIsEditing(false);
            return;
        }

        try {
            const { error } = await supabase
                .from('app_shortcuts')
                .upsert(shortcuts.map(s => ({
                    id: s.id,
                    label: s.label,
                    url: s.url,
                    type: 'global',
                    user_email: user.email
                })));

            if (error) {
                console.error('Supabase Upsert Error:', error);
                throw error;
            }
            setIsEditing(false);
            alert('모든 바로가기가 저장되었습니다.');
        } catch (err: any) {
            console.error('Failed to sync shortcuts:', err);
            alert(`저장 실패: ${err.message || '알 수 없는 오류'}`);
        }
    };

    const addShortcut = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLabel || !newUrl || user?.role !== 'admin') return;

        const url = newUrl.startsWith('http') ? newUrl : `https://${newUrl}`;
        const newItem: any = {
            id: Math.random().toString(36).substr(2, 9),
            label: newLabel,
            url,
            type: 'global',
            user_email: user?.email
        };

        const updated = [...shortcuts, newItem];

        if (supabase) {
            const { error } = await supabase.from('app_shortcuts').insert([newItem]);
            if (error) {
                console.error('Insert error:', error);
                alert(`등록 실패: ${error.message}`);
                return;
            }
        }

        setShortcuts(updated);
        setNewLabel('');
        setNewUrl('');
    };

    const removeShortcut = async (id: string) => {
        if (user?.role !== 'admin') return;

        const updated = shortcuts.filter(s => s.id !== id);
        setShortcuts(updated);

        if (supabase) {
            await supabase.from('app_shortcuts').delete().eq('id', id);
        }
    };

    return (
        <div className="bg-slate-900 border-b border-slate-800 px-8 py-2 flex items-center justify-center transition-colors">
            <div className="max-w-7xl w-full flex items-center gap-4 overflow-x-auto scrollbar-hide">
                <div className="flex items-center gap-2">
                    {shortcuts.map((s) => (
                        <div key={s.id} className="relative group flex items-center gap-1">
                            {isEditing && user?.role === 'admin' ? (
                                <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
                                    <input
                                        type="text"
                                        value={s.label}
                                        size={Math.max(s.label.length, 2)}
                                        onChange={(e) => {
                                            const updated = shortcuts.map(item =>
                                                item.id === s.id ? { ...item, label: e.target.value } : item
                                            );
                                            setShortcuts(updated);
                                            localStorage.setItem('cached_shortcuts', JSON.stringify(updated));
                                        }}
                                        className="min-w-[40px] px-1.5 py-1 text-[10px] bg-slate-900 text-white border border-slate-600 rounded focus:outline-none"
                                    />
                                    <input
                                        type="text"
                                        value={s.url}
                                        size={Math.max(s.url.length, 5)}
                                        onChange={(e) => {
                                            const updated = shortcuts.map(item =>
                                                item.id === s.id ? { ...item, url: e.target.value } : item
                                            );
                                            setShortcuts(updated);
                                            localStorage.setItem('cached_shortcuts', JSON.stringify(updated));
                                        }}
                                        className="min-w-[60px] px-1.5 py-1 text-[10px] bg-slate-900 text-white border border-slate-600 rounded focus:outline-none"
                                    />
                                    <button
                                        onClick={() => removeShortcut(s.id)}
                                        className="p-1 text-red-400 hover:bg-red-500/10 rounded"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ) : (
                                <a
                                    href={s.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all border border-slate-700 hover:border-blue-500 whitespace-nowrap"
                                >
                                    <ExternalLink className="w-3 h-3" />
                                    {s.label}
                                </a>
                            )}
                        </div>
                    ))}
                </div>


                {user?.role === 'admin' && (
                    <div className="flex items-center gap-2">
                        {isEditing ? (
                            <form onSubmit={addShortcut} className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700 animate-in fade-in slide-in-from-left-2 transition-all">
                                <input
                                    type="text"
                                    placeholder="이름"
                                    value={newLabel}
                                    size={Math.max(newLabel.length, 4)}
                                    onChange={(e) => setNewLabel(e.target.value)}
                                    className="min-w-[40px] px-2 py-1 text-[10px] bg-slate-900 text-white border border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="URL"
                                    value={newUrl}
                                    size={Math.max(newUrl.length, 6)}
                                    onChange={(e) => setNewUrl(e.target.value)}
                                    className="min-w-[60px] px-2 py-1 text-[10px] bg-slate-900 text-white border border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    required
                                />
                                <button type="submit" className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700">
                                    <Plus className="w-3 h-3" />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSync}
                                    className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    <Save className="w-3 h-3" />
                                </button>
                            </form>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all border border-dashed border-slate-700 hover:border-slate-500"
                                    title={user.role === 'admin' ? "공통 링크 관리" : "개인 링크 관리"}
                                >
                                    <Settings2 className="w-3.5 h-3.5" />
                                </button>
                                {user.role === 'admin' && (
                                    <span className="text-[10px] text-blue-500 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                                        공통
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};



