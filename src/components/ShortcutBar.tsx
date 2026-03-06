import React, { useState, useEffect } from 'react';
import { ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { Shortcut, User } from '../types';
import { supabase } from '../lib/supabase';

interface ShortcutBarProps {
    user: User | null;
    currentPath: string;
}

const DEFAULT_SHORTCUTS: Shortcut[] = [
    { id: '1', label: '나이스', url: 'https://www.neis.go.kr' },
    { id: '2', label: '에듀파인', url: 'https://klef.go.kr' },
    { id: '3', label: '학교홈페이지', url: 'http://dasu.es.kr' },
    { id: '4', label: 'K-에듀파인', url: 'https://fin.go.kr' },
];

export const ShortcutBar: React.FC<ShortcutBarProps> = ({ user, currentPath }) => {
    const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);

    useEffect(() => {
        fetchShortcuts();
    }, [user, currentPath]);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setShowLeftArrow(scrollLeft > 0);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
        }
    };

    useEffect(() => {
        const timer = setTimeout(checkScroll, 500);
        window.addEventListener('resize', checkScroll);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', checkScroll);
        };
    }, [shortcuts]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 300;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
            setTimeout(checkScroll, 500);
        }
    };

    const fetchShortcuts = async () => {
        try {
            if (supabase) {
                const { data, error } = await supabase
                    .from('app_shortcuts')
                    .select('*')
                    .order('position', { ascending: true })
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

        const cached = localStorage.getItem('cached_shortcuts');
        if (cached) {
            setShortcuts(JSON.parse(cached));
        } else {
            setShortcuts(DEFAULT_SHORTCUTS);
        }
    };

    return (
        <div className="bg-slate-900 border-b border-white/5 px-4 h-11 flex items-center relative group/bar">
            {showLeftArrow && (
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 z-10 h-full px-2 bg-gradient-to-r from-slate-900 via-slate-900 to-transparent text-slate-400 hover:text-white transition-all flex items-center"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
            )}

            <div
                ref={scrollRef}
                onScroll={checkScroll}
                className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide scroll-smooth px-2"
            >
                {shortcuts.map((s) => (
                    <a
                        key={s.id}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-blue-600/20 text-slate-400 hover:text-blue-400 rounded-full text-[11px] font-bold transition-all border border-white/5 hover:border-blue-500/30 whitespace-nowrap group"
                    >
                        <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                        {s.label}
                    </a>
                ))}
            </div>

            {showRightArrow && (
                <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 z-10 h-full px-2 bg-gradient-to-l from-slate-900 via-slate-900 to-transparent text-slate-400 hover:text-white transition-all flex items-center"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            )}
        </div>
    );
};



