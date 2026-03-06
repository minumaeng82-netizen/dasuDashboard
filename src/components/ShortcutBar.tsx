import React, { useState, useEffect } from 'react';
import { ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { Shortcut, User, DeviceMode } from '../types';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface ShortcutBarProps {
    user: User | null;
    currentPath: string;
    mode?: DeviceMode;
}

const DEFAULT_SHORTCUTS: Shortcut[] = [
    { id: '1', label: '나이스', url: 'https://www.neis.go.kr' },
    { id: '2', label: '에듀파인', url: 'https://klef.go.kr' },
    { id: '3', label: '학교홈페이지', url: 'http://dasu.es.kr' },
    { id: '4', label: 'K-에듀파인', url: 'https://fin.go.kr' },
];

export const ShortcutBar: React.FC<ShortcutBarProps> = ({ user, currentPath, mode }) => {
    const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);

    const isTablet = mode === 'Tablet';

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
        <div className={cn(
            "bg-slate-900 border-b border-white/5 px-4 flex items-center relative group/bar transition-all",
            isTablet ? "h-14 bg-slate-800" : "h-11"
        )}>
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
                        className={cn(
                            "flex items-center gap-1.5 bg-white/5 hover:bg-blue-600/20 text-slate-400 hover:text-blue-400 rounded-full font-bold transition-all border border-white/5 hover:border-blue-500/30 whitespace-nowrap group",
                            isTablet ? "px-4 py-2 text-xs" : "px-3 py-1 text-[11px]"
                        )}
                    >
                        {!isTablet && <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />}
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



