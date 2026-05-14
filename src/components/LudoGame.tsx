import { useEffect, useState } from 'react';
import { Trophy, Dices, RotateCcw } from 'lucide-react';
import { GameState } from '../lib/types';
import { Board } from './Board';
import { PLAYER_COLORS } from '../lib/constants';

export function LudoGame({ 
    state,
    rollDice,
    moveToken,
    onExit,
    isLocalPlayer = () => true
}: { 
    state: GameState,
    rollDice: () => void,
    moveToken: (id: number) => void,
    onExit: () => void,
    isLocalPlayer?: (slot: number) => boolean
}) {
    const currentPlayer = state.players[state.turn];
    const isHumanValidTurn = currentPlayer.type === 'human' && !state.isRolling && isLocalPlayer(state.turn);
    
    const [focusedTokenIndex, setFocusedTokenIndex] = useState(0);

    useEffect(() => {
        setFocusedTokenIndex(0);
    }, [state.validTokens, state.turn]);

    const focusedTokenId = state.validTokens[focusedTokenIndex] ?? null;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === ' ' || e.code === 'Space') {
                e.preventDefault(); 
                if (isHumanValidTurn && !state.hasRolled && state.winner === null) {
                    rollDice();
                }
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                if (isHumanValidTurn && state.hasRolled && state.validTokens.length > 0) {
                    setFocusedTokenIndex(prev => (prev + 1) % state.validTokens.length);
                }
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                if (isHumanValidTurn && state.hasRolled && state.validTokens.length > 0) {
                    setFocusedTokenIndex(prev => (prev - 1 + state.validTokens.length) % state.validTokens.length);
                }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (isHumanValidTurn && state.hasRolled && state.validTokens.length > 0 && focusedTokenId !== null) {
                    moveToken(focusedTokenId);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isHumanValidTurn, state.hasRolled, state.winner, rollDice, state.validTokens, focusedTokenId, moveToken]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 sm:p-8 text-slate-800 select-none">
            <header className="w-full max-w-5xl flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6">
                        <span className="text-2xl text-white font-bold">L</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl heading text-slate-800 tracking-tight">LUDO PURE</h1>
                </div>

                <button 
                    onClick={onExit}
                    className="bg-white text-slate-700 p-3 sm:px-6 sm:py-3 rounded-2xl font-bold shadow-sm border-2 border-slate-200 hover:bg-slate-50 flex items-center gap-2 transition-colors active:scale-95"
                >
                    <RotateCcw className="w-5 h-5" />
                    <span className="hidden sm:inline">LEAVE GAME</span>
                </button>
            </header>

            <main className="flex-1 w-full max-w-6xl flex flex-col-reverse xl:grid xl:grid-cols-12 gap-8 items-center xl:items-start justify-center">
                <aside className="xl:col-span-3 flex flex-col gap-6 w-full max-w-sm">
                    <div className="p-8 bg-white rounded-[40px] shadow-2xl border border-slate-100 flex flex-col items-center gap-6">
                        <div className="text-center">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Current Turn</p>
                            {state.winner !== null ? (
                                <p className="heading text-yellow-500 text-2xl flex items-center gap-2 justify-center">
                                    <Trophy className="w-6 h-6" /> P{state.winner + 1} WINS!
                                </p>
                            ) : (
                                <p 
                                    className="heading text-2xl uppercase tracking-wider" 
                                    style={{ color: PLAYER_COLORS[state.turn] }}
                                >
                                    P{state.turn + 1} {currentPlayer.type === 'ai' ? 'BOT' : 'ROLL'}
                                </p>
                            )}
                        </div>

                        {state.winner === null ? (
                            <div className="relative group">
                                <button
                                    onClick={rollDice}
                                    disabled={!isHumanValidTurn || state.hasRolled}
                                    className={`
                                        w-32 h-32 rounded-3xl border-4 flex items-center justify-center relative shadow-inner transition-all
                                        ${isHumanValidTurn && !state.hasRolled 
                                            ? 'bg-slate-50 border-slate-100 cursor-pointer hover:bg-slate-100 active:scale-95' 
                                            : 'bg-slate-50 border-slate-100 cursor-not-allowed opacity-70'}
                                    `}
                                >
                                    {state.isRolling ? (
                                        <Dices className="w-16 h-16 text-slate-400 animate-spin" />
                                    ) : state.dice ? (
                                        <div className="w-20 h-20 bg-white rounded-xl shadow-md border-2 border-slate-200 grid grid-cols-3 grid-rows-3 p-2 gap-1">
                                            {[...Array(9)].map((_, i) => {
                                                const showDot = (
                                                    (state.dice === 1 && i === 4) ||
                                                    (state.dice === 2 && (i === 0 || i === 8)) ||
                                                    (state.dice === 3 && (i === 0 || i === 4 || i === 8)) ||
                                                    (state.dice === 4 && (i === 0 || i === 2 || i === 6 || i === 8)) ||
                                                    (state.dice === 5 && (i === 0 || i === 2 || i === 4 || i === 6 || i === 8)) ||
                                                    (state.dice === 6 && (i === 0 || i === 2 || i === 3 || i === 5 || i === 6 || i === 8))
                                                );
                                                return (
                                                    <div key={i} className="flex items-center justify-center">
                                                        {showDot && <div className="w-4 h-4 bg-slate-800 rounded-full shadow-sm" />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="w-4 h-4 bg-slate-800 rounded-full"></div>
                                            <div className="w-4 h-4 bg-slate-800 rounded-full"></div>
                                            <div className="w-4 h-4 bg-slate-800 rounded-full"></div>
                                            <div className="w-4 h-4 bg-slate-800 rounded-full"></div>
                                        </div>
                                    )}
                                    
                                    {isHumanValidTurn && !state.hasRolled && !state.dice && (
                                        <div className="absolute -bottom-4 bg-amber-400 text-white heading px-4 py-2 rounded-xl text-lg shadow-lg group-hover:scale-105 transition-transform whitespace-nowrap">
                                            TAP OR SPACE TO ROLL
                                        </div>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <button 
                                onClick={onExit}
                                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 active:scale-95"
                            >
                                PLAY AGAIN
                            </button>
                        )}

                        {state.hasRolled && isHumanValidTurn && state.validTokens.length > 0 && (
                            <p className="mt-2 text-sm text-slate-500 font-bold animate-pulse text-center">
                                Select a piece to move
                            </p>
                        )}
                        {state.hasRolled && state.validTokens.length === 0 && state.winner === null && (
                            <p className="mt-2 text-sm text-slate-500 font-bold text-center">
                                No valid moves
                            </p>
                        )}
                    </div>
                </aside>

                <div className="xl:col-span-6 flex justify-center w-full max-w-2xl px-2">
                    <Board 
                        tokens={state.tokens} 
                        validTokens={state.validTokens}
                        onTokenClick={moveToken}
                        turn={state.turn}
                        focusedTokenId={focusedTokenId}
                    />
                </div>

                <aside className="xl:col-span-3 w-full">
                    {/* Empty placeholder for balance, or could add features later */}
                </aside>
            </main>
        </div>
    );
}
