import { useState, useEffect, useCallback } from 'react';
import { GameState, PlayerConfig, Token } from '../lib/types';
import { START_OFFSETS, SAFE_POSITIONS } from '../lib/constants';

function getValidTokens(tokens: Token[], turn: number, dice: number): number[] {
    return tokens
        .filter(t => t.playerId === turn)
        .filter(t => {
            if (t.progress === -1) return dice === 6;
            return t.progress + dice <= 56;
        })
        .map(t => t.id);
}

function computeAiMove(state: GameState): number {
    const { validTokens, tokens, turn, dice } = state;
    if (validTokens.length === 1) return validTokens[0];

    let bestScore = -Infinity;
    let bestId = validTokens[0] || -1;

    validTokens.forEach(tid => {
        const t = tokens.find(tok => tok.id === tid)!;
        let score = 0;
        const newProg = t.progress === -1 ? 0 : t.progress + dice!;
        
        if (t.progress === -1) score += 10;
        if (newProg === 56) score += 50;

        if (newProg >= 0 && newProg <= 50) {
            const abs = (newProg + START_OFFSETS[turn]) % 52;
            if (SAFE_POSITIONS.includes(abs)) score += 5;
            
            const canCapture = tokens.some(other => 
                other.playerId !== turn && 
                other.progress >= 0 && 
                other.progress <= 50 && 
                ((other.progress + START_OFFSETS[other.playerId]) % 52) === abs
            );
            if (canCapture && !SAFE_POSITIONS.includes(abs)) score += 100;
        }

        score += newProg * 0.1;

        if (score > bestScore) {
            bestScore = score;
            bestId = tid;
        }
    });
    return bestId;
}

export function useLudoGame(initialPlayers: PlayerConfig[]) {
    const [state, setState] = useState<GameState>({
        players: initialPlayers,
        tokens: Array.from({ length: 16 }).map((_, i) => ({
            id: i,
            playerId: Math.floor(i / 4),
            progress: -1
        })),
        turn: initialPlayers.findIndex(p => p.type !== 'none') >= 0 ? initialPlayers.findIndex(p => p.type !== 'none') : 0,
        dice: null,
        isRolling: false,
        hasRolled: false,
        validTokens: [],
        winner: null,
        movingToken: null
    });

    const passTurn = useCallback(() => {
        setState(s => {
            let nextTurn = s.turn;
            let i = 1;
            while(i <= 4) {
                nextTurn = (s.turn + i) % 4;
                if (s.players[nextTurn].type !== 'none') break;
                i++;
            }
            return { ...s, hasRolled: false, dice: null, validTokens: [], turn: nextTurn };
        });
    }, []);

    const rollDice = useCallback(() => {
        if (state.hasRolled || state.isRolling || state.winner !== null) return;
        
        setState(s => ({ ...s, isRolling: true, dice: null }));
        
        setTimeout(() => {
            const v = Math.floor(Math.random() * 6) + 1;
            setState(s => {
                const validTokens = getValidTokens(s.tokens, s.turn, v);
                return { ...s, dice: v, isRolling: false, hasRolled: true, validTokens };
            });
        }, 600);
    }, [state.hasRolled, state.isRolling, state.winner]);

    const moveToken = useCallback((tokenId: number) => {
        setState(s => {
            const token = s.tokens.find(t => t.id === tokenId);
            if (!token || !s.validTokens.includes(tokenId)) return s;

            const stepsToMove = token.progress === -1 ? 1 : s.dice!;

            return { 
                ...s, 
                hasRolled: false, 
                validTokens: [], 
                movingToken: { id: tokenId, steps: stepsToMove }
            };
        });
    }, []);

    // Animation Tick
    useEffect(() => {
        if (!state.movingToken) return;
        const { id, steps } = state.movingToken;

        const timer = setTimeout(() => {
            setState(s => {
                if (!s.movingToken) return s;
                let newTokens = [...s.tokens];
                const tIdx = newTokens.findIndex(t => t.id === id);
                const token = newTokens[tIdx];

                const newlyProgressed = token.progress === -1 ? 0 : token.progress + 1;
                newTokens[tIdx] = { ...token, progress: newlyProgressed };

                if (steps > 1) {
                    return { ...s, tokens: newTokens, movingToken: { id, steps: steps - 1 } };
                } else {
                    let captured = false;
                    let reachedHome = newlyProgressed === 56;

                    if (newlyProgressed >= 0 && newlyProgressed <= 50) {
                        const absPos = (newlyProgressed + START_OFFSETS[s.turn]) % 52;
                        if (!SAFE_POSITIONS.includes(absPos)) {
                            newTokens = newTokens.map(other => {
                                if (other.playerId !== s.turn && other.progress >= 0 && other.progress <= 50) {
                                    const otherAbs = (other.progress + START_OFFSETS[other.playerId]) % 52;
                                    if (otherAbs === absPos) {
                                        captured = true;
                                        return { ...other, progress: -1 };
                                    }
                                }
                                return other;
                            });
                        }
                    }

                    let nextTurn = s.turn;
                    if (s.dice !== 6 && !captured && !reachedHome) {
                        let i = 1;
                        while(i <= 4) {
                            nextTurn = (s.turn + i) % 4;
                            if (s.players[nextTurn].type !== 'none') break;
                            i++;
                        }
                    }

                    const win = [0, 1, 2, 3].find(pid => 
                        newTokens.filter(t => t.playerId === pid && t.progress === 56).length === 4
                    );

                    return { 
                        ...s, 
                        tokens: newTokens, 
                        dice: null, 
                        turn: win !== undefined ? s.turn : nextTurn, 
                        winner: win !== undefined ? win : null,
                        movingToken: null 
                    };
                }
            });
        }, 200);

        return () => clearTimeout(timer);
    }, [state.movingToken]);

    // AI and Auto-pass Logic
    useEffect(() => {
        if (state.winner !== null || state.movingToken !== null) return;
        const currentPlayer = state.players[state.turn];

        if (currentPlayer.type === 'ai') {
            if (!state.hasRolled && !state.isRolling) {
                const timer = setTimeout(() => rollDice(), 800);
                return () => clearTimeout(timer);
            }
        }
    }, [state.turn, state.hasRolled, state.isRolling, state.players, state.winner, state.movingToken, rollDice]);

    useEffect(() => {
        if (state.winner !== null || state.movingToken !== null) return;
        const currentPlayer = state.players[state.turn];

        if (state.hasRolled && !state.isRolling) {
            if (state.validTokens.length === 0) {
                const timer = setTimeout(() => passTurn(), 1000);
                return () => clearTimeout(timer);
            } else if (currentPlayer.type === 'ai') {
                const timer = setTimeout(() => {
                    const bestTokenId = computeAiMove(state);
                    if (bestTokenId !== -1) {
                        moveToken(bestTokenId);
                    }
                }, 1200);
                return () => clearTimeout(timer);
            }
        }
    }, [state.hasRolled, state.isRolling, state.validTokens, state.turn, state.players, state.winner, state.movingToken, moveToken, passTurn]);

    return { state, rollDice, moveToken };
}
