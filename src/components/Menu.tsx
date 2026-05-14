import { useState } from 'react';

export function Menu({ onSelectMode }: { onSelectMode: (mode: 'local' | 'online', name: string) => void }) {
    const [name, setName] = useState('');

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 text-slate-800">
            <div className="max-w-md w-full bg-white rounded-[40px] p-8 shadow-2xl border border-slate-100 flex flex-col gap-6">
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-amber-400 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6 mb-4">
                        <span className="text-4xl text-white font-bold">L</span>
                    </div>
                    <h1 className="text-4xl heading text-slate-800 tracking-tight text-center">LUDO PURE</h1>
                </div>

                <div className="flex flex-col gap-4 mt-4">
                    <input 
                        type="text" 
                        placeholder="Enter your name..." 
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-4 text-lg font-bold text-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
                        maxLength={12}
                    />

                    <button
                        onClick={() => onSelectMode('local', name || 'Player')}
                        className="w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2 uppercase tracking-wide bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20 active:scale-95"
                    >
                        LOCAL GAME
                    </button>
                    
                    <button
                        onClick={() => onSelectMode('online', name || 'Player')}
                        disabled={!name}
                        className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2 uppercase tracking-wide
                            ${name ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20 active:scale-95' 
                            : 'bg-slate-200 text-slate-400 border-2 border-slate-200 cursor-not-allowed shadow-none'}
                        `}
                    >
                        ONLINE ROOMS
                    </button>
                </div>
            </div>
        </div>
    );
}