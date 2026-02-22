import React, { useState, useEffect } from 'react';
import { ExternalLink, Plus, X, Settings2, Save } from 'lucide-react';
import { Shortcut, User } from '../types';

interface ShortcutBarProps {
    user: User | null;
}

const DEFAULT_SHORTCUTS: Shortcut[] = [
    { id: '1', label: '나이스', url: 'https://www.neis.go.kr' },
    { id: '2', label: '에듀파인', url: 'https://klef.go.kr_dummy' },
    { id: '3', label: '학교홈페이지', url: 'http://dasu.es.kr_dummy' },
    { id: '4', label: 'K-에듀파인', url: 'https://fin.go.kr_dummy' },
];

export const ShortcutBar: React.FC<ShortcutBarProps> = ({ user }) => {
    const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [newLabel, setNewLabel] = useState('');
    const [newUrl, setNewUrl] = useState('');

    useEffect(() => {
        // Load shortcuts based on user role
        const loadShortcuts = () => {
            const globalStored = localStorage.getItem('global_shortcuts');
            const global = globalStored ? JSON.parse(globalStored) : DEFAULT_SHORTCUTS;

            if (!user) {
                setShortcuts(global);
                return;
            }

            if (user.role === 'admin') {
                setShortcuts(global);
            } else {
                const personalStored = localStorage.getItem(`personal_shortcuts_${user.id}`);
                const personal = personalStored ? JSON.parse(personalStored) : global;
                setShortcuts(personal);
            }
        };

        loadShortcuts();
    }, [user]);

    const saveShortcuts = (updated: Shortcut[]) => {
        setShortcuts(updated);
        if (user?.role === 'admin') {
            localStorage.setItem('global_shortcuts', JSON.stringify(updated));
            // Optional: You could merge or notify users here, but simple overide is common.
        } else if (user) {
            localStorage.setItem(`personal_shortcuts_${user.id}`, JSON.stringify(updated));
        }
    };

    const addShortcut = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLabel || !newUrl) return;

        const url = newUrl.startsWith('http') ? newUrl : `https://${newUrl}`;
        const newItem: Shortcut = {
            id: Math.random().toString(36).substr(2, 9),
            label: newLabel,
            url
        };

        saveShortcuts([...shortcuts, newItem]);
        setNewLabel('');
        setNewUrl('');
    };

    const removeShortcut = (id: string) => {
        saveShortcuts(shortcuts.filter(s => s.id !== id));
    };

    return (
        <div className="bg-slate-900 border-b border-slate-800 px-8 py-2 flex items-center justify-center transition-colors">
            <div className="max-w-7xl w-full flex items-center gap-4 overflow-x-auto scrollbar-hide">
                <div className="flex items-center gap-2">
                    {shortcuts.map((s) => (
                        <div key={s.id} className="relative group flex items-center gap-1">
                            {isEditing ? (
                                <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
                                    <input
                                        type="text"
                                        value={s.label}
                                        onChange={(e) => {
                                            const updated = shortcuts.map(item =>
                                                item.id === s.id ? { ...item, label: e.target.value } : item
                                            );
                                            saveShortcuts(updated);
                                        }}
                                        className="w-16 px-1.5 py-1 text-[10px] bg-slate-900 text-white border border-slate-600 rounded focus:outline-none"
                                    />
                                    <input
                                        type="text"
                                        value={s.url}
                                        onChange={(e) => {
                                            const updated = shortcuts.map(item =>
                                                item.id === s.id ? { ...item, url: e.target.value } : item
                                            );
                                            saveShortcuts(updated);
                                        }}
                                        className="w-24 px-1.5 py-1 text-[10px] bg-slate-900 text-white border border-slate-600 rounded focus:outline-none"
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


                {user && (
                    <div className="flex items-center gap-2">
                        {isEditing ? (
                            <form onSubmit={addShortcut} className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700 animate-in fade-in slide-in-from-left-2 transition-all">
                                <input
                                    type="text"
                                    placeholder="이름"
                                    value={newLabel}
                                    onChange={(e) => setNewLabel(e.target.value)}
                                    className="w-16 px-2 py-1 text-[10px] bg-slate-900 text-white border border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="URL"
                                    value={newUrl}
                                    onChange={(e) => setNewUrl(e.target.value)}
                                    className="w-24 px-2 py-1 text-[10px] bg-slate-900 text-white border border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    required
                                />
                                <button type="submit" className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700">
                                    <Plus className="w-3 h-3" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="p-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
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



