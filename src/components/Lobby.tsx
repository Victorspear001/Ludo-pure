import { useState } from 'react';
import { PlayerConfig, PlayerType } from '../lib/types';
import { PLAYER_COLORS } from '../lib/constants';
import { Bot, User, X, RotateCcw } from 'lucide-react';

export function Lobby({ onStartGame, onExit }: { onStartGame: (players: PlayerConfig[]) => void, onExit: () => void }) {
    const [players, setPlayers] = useState<PlayerConfig[]>([
        { id: 0, type: 'human' },
        { id: 1, type: 'ai' },
        { id: 2, type: 'none' },
        { id: 3, type: 'none' }
    ]);

    const togglePlayerType = (id: number) => {
        setPlayers(prev => prev.map(p => {
            if (p.id !== id) return p;
            const nextType: Record<PlayerType, PlayerType> = {
                'human': 'ai',
                'ai': 'none',
                'none': 'human'
            };
            return { ...p, type: nextType[p.type] };
        }));
    };

    const activeCount = players.filter(p => p.type !== 'none').length;
    const canStart = activeCount >= 2;

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 text-slate-800">
            <div className="max-w-md w-full bg-white rounded-[40px] p-8 shadow-2xl border border-slate-100 flex flex-col gap-6">
                <button onClick={onExit} className="self-start p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors -mb-4"><RotateCcw className="w-5 h-5" /></button>
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-amber-400 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6 mb-4">
                        <span className="text-4xl text-white font-bold">L</span>
                    </div>
                    <h1 className="text-4xl heading text-slate-800 tracking-tight text-center">LUDO PURE</h1>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-2">Select Players</p>
                </div>

                <div className="space-y-4 my-2">
                    {players.map((p) => (
                        <div 
                            key={p.id}
                            className="bg-slate-50 rounded-3xl p-4 flex items-center justify-between border-4 border-slate-100 transition-colors hover:border-slate-200"
                        >
                            <div className="flex items-center gap-4">
                                <div 
                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-inner border border-white/20"
                                    style={{ backgroundColor: p.type !== 'none' ? PLAYER_COLORS[p.id] : '#cbd5e1' }}
                                >
                                    P{p.id + 1}
                                </div>
                                <div className="text-lg font-bold text-slate-700">
                                    {p.id === 0 ? 'Red' : p.id === 1 ? 'Green' : p.id === 2 ? 'Yellow' : 'Blue'}
                                </div>
                            </div>
                            
                            <button
                                onClick={() => togglePlayerType(p.id)}
                                className={`
                                    flex items-center gap-2 px-4 py-3 rounded-2xl font-bold transition-all w-32 justify-center shadow-sm
                                    ${p.type === 'human' ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200' : 
                                      p.type === 'ai' ? 'bg-amber-400 hover:bg-amber-500 text-white shadow-amber-200' : 
                                      'bg-slate-200 hover:bg-slate-300 text-slate-500'}
                                `}
                            >
                                {p.type === 'human' && <><User className="w-4 h-4" /> HUMAN</>}
                                {p.type === 'ai' && <><Bot className="w-4 h-4" /> AI BOT</>}
                                {p.type === 'none' && <><X className="w-4 h-4" /> EMPTY</>}
                            </button>
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => onStartGame(players)}
                    disabled={!canStart}
                    className={`
                        w-full py-5 rounded-2xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2 uppercase tracking-wide
                        ${canStart 
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20 active:scale-95' 
                            : 'bg-slate-200 text-slate-400 border-2 border-slate-200 cursor-not-allowed shadow-none'}
                    `}
                >
                    {canStart ? 'START GAME' : 'Needs 2+ Players'}
                </button>
            </div>
        </div>
    );
}
