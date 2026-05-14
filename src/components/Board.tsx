import { motion } from 'motion/react';
import { BASE_POSITIONS, HOME_PATHS, HOME_POSITIONS, MAIN_PATH, PLAYER_COLORS, SAFE_POSITIONS, START_OFFSETS } from '../lib/constants';
import { Token } from '../lib/types';
import { useMemo } from 'react';

function getAbsolutePosition(token: Token): { r: number, c: number } {
    if (token.progress === -1) {
        const baseCoords = BASE_POSITIONS[token.playerId];
        return { r: baseCoords[token.id % 4][0], c: baseCoords[token.id % 4][1] };
    }
    if (token.progress === 56) {
        const h = HOME_POSITIONS[token.playerId];
        return { r: h[0], c: h[1] };
    }
    if (token.progress >= 51 && token.progress <= 55) {
        const hpath = HOME_PATHS[token.playerId][token.progress - 51];
        return { r: hpath[0], c: hpath[1] };
    }
    const pathPos = (token.progress + START_OFFSETS[token.playerId]) % 52;
    const p = MAIN_PATH[pathPos];
    return { r: p[0], c: p[1] };
}

export function Board({ 
    tokens, 
    validTokens, 
    onTokenClick,
    turn,
    focusedTokenId
}: { 
    tokens: Token[], 
    validTokens: number[], 
    onTokenClick: (id: number) => void,
    turn: number,
    focusedTokenId?: number | null
}) {
    // Generate static board elements
    const boardCells = useMemo(() => {
        const cells = [];
        
        // Draw path cells
        MAIN_PATH.forEach((pos, i) => {
            const isSafe = SAFE_POSITIONS.includes(i);
            let fillColor = 'white';
            
            // Color start positions
            if (i === 0) fillColor = `${PLAYER_COLORS[0]}40`; // 40 is opacity in hex ~25%
            else if (i === 13) fillColor = `${PLAYER_COLORS[1]}40`;
            else if (i === 26) fillColor = `${PLAYER_COLORS[2]}40`;
            else if (i === 39) fillColor = `${PLAYER_COLORS[3]}40`;
            
            cells.push(
                <g key={`main-${i}`}>
                    <rect x={pos[1]} y={pos[0]} width={1} height={1} fill={fillColor} stroke="#cbd5e1" strokeWidth={0.05} />
                    {isSafe && (
                        <polygon 
                            points={`${pos[1]+0.5},${pos[0]+0.15} ${pos[1]+0.6},${pos[0]+0.4} ${pos[1]+0.85},${pos[0]+0.4} ${pos[1]+0.65},${pos[0]+0.6} ${pos[1]+0.75},${pos[0]+0.85} ${pos[1]+0.5},${pos[0]+0.7} ${pos[1]+0.25},${pos[0]+0.85} ${pos[1]+0.35},${pos[0]+0.6} ${pos[1]+0.15},${pos[0]+0.4} ${pos[1]+0.4},${pos[0]+0.4}`}
                            fill="#94a3b8" 
                            opacity="0.5"
                        />
                    )}
                </g>
            );
        });

        // Draw home paths
        HOME_PATHS.forEach((path, playerIndex) => {
            path.forEach((pos, i) => {
                cells.push(
                    <rect key={`home-${playerIndex}-${i}`} x={pos[1]} y={pos[0]} width={1} height={1} fill={`${PLAYER_COLORS[playerIndex]}40`} stroke="#cbd5e1" strokeWidth={0.05} />
                );
            });
        });

        return cells;
    }, []);

    // Calculate grouping and offsets for tokens to prevent them from completely covering each other
    const tokenPositions = useMemo(() => {
        const positions: Record<number, { r: number, c: number, dx: number, dy: number }> = {};
        const gridMap: Record<string, number[]> = {};

        tokens.forEach(t => {
            const { r, c } = getAbsolutePosition(t);
            const key = `${r},${c}`;
            if (!gridMap[key]) gridMap[key] = [];
            gridMap[key].push(t.id);
        });

        Object.keys(gridMap).forEach(key => {
            const ids = gridMap[key];
            const [rStr, cStr] = key.split(',');
            const r = parseInt(rStr), c = parseInt(cStr);
            
            if (ids.length === 1) {
                positions[ids[0]] = { r, c, dx: 0, dy: 0 };
            } else if (ids.length === 2) {
                positions[ids[0]] = { r, c, dx: -0.15, dy: -0.15 };
                positions[ids[1]] = { r, c, dx: 0.15, dy: 0.15 };
            } else if (ids.length === 3) {
                positions[ids[0]] = { r, c, dx: -0.15, dy: -0.15 };
                positions[ids[1]] = { r, c, dx: 0.15, dy: -0.15 };
                positions[ids[2]] = { r, c, dx: 0, dy: 0.15 };
            } else {
                // 4 or more
                positions[ids[0]] = { r, c, dx: -0.15, dy: -0.15 };
                positions[ids[1]] = { r, c, dx: 0.15, dy: -0.15 };
                positions[ids[2]] = { r, c, dx: -0.15, dy: 0.15 };
                positions[ids[3]] = { r, c, dx: 0.15, dy: 0.15 };
                // If somehow more than 4, they'll overlap on the 4th, which is fine
                for(let i = 4; i < ids.length; i++) {
                     positions[ids[i]] = { r, c, dx: 0, dy: 0 };
                }
            }
        });

        return positions;
    }, [tokens]);

    return (
        <div className="w-full max-w-2xl aspect-square bg-white border-[12px] border-[#334155] rounded-3xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1)] relative select-none overflow-hidden">
            <svg viewBox="0 0 15 15" className="w-full h-full">
                {/* Bases */}
                <rect x="0" y="0" width="6" height="6" fill={PLAYER_COLORS[0]} />
                <rect x="1" y="1" width="4" height="4" fill="white" rx="0.5" />
                
                <rect x="9" y="0" width="6" height="6" fill={PLAYER_COLORS[1]} />
                <rect x="10" y="1" width="4" height="4" fill="white" rx="0.5" />
                
                <rect x="9" y="9" width="6" height="6" fill={PLAYER_COLORS[2]} />
                <rect x="10" y="10" width="4" height="4" fill="white" rx="0.5" />
                
                <rect x="0" y="9" width="6" height="6" fill={PLAYER_COLORS[3]} />
                <rect x="1" y="10" width="4" height="4" fill="white" rx="0.5" />

                {/* Base Circles (Empty slots) */}
                {BASE_POSITIONS.map((base, playerIdx) => 
                    base.map((pos, i) => (
                        <circle key={`empty-${playerIdx}-${i}`} cx={pos[1] + 0.5} cy={pos[0] + 0.5} r={0.35} fill={`${PLAYER_COLORS[playerIdx]}40`} />
                    ))
                )}

                {/* Center Home */}
                <polygon points="6,6 9,6 7.5,7.5" fill={PLAYER_COLORS[1]} />
                <polygon points="9,6 9,9 7.5,7.5" fill={PLAYER_COLORS[2]} />
                <polygon points="6,9 9,9 7.5,7.5" fill={PLAYER_COLORS[3]} />
                <polygon points="6,6 6,9 7.5,7.5" fill={PLAYER_COLORS[0]} />

                {/* Path Cells */}
                {boardCells}

                {/* Animated Tokens */}
                {tokens.map(token => {
                    const pos = tokenPositions[token.id];
                    const isValid = validTokens.includes(token.id);
                    const isTurn = turn === token.playerId;
                    const isFocused = focusedTokenId === token.id;

                    return (
                        <motion.g
                            key={token.id}
                            initial={false}
                            animate={{ x: pos.c, y: pos.r }}
                            transition={{ type: 'spring', stiffness: 120, damping: 15 }}
                            onClick={() => {
                                if (isValid) onTokenClick(token.id);
                            }}
                            className={isValid ? "cursor-pointer" : ""}
                        >
                            <circle 
                                cx={0.5 + pos.dx} 
                                cy={0.5 + pos.dy} 
                                r={0.35} 
                                fill={PLAYER_COLORS[token.playerId]} 
                                stroke={isTurn ? "white" : "rgba(255,255,255,0.5)"} 
                                strokeWidth={isTurn ? 0.08 : 0.04} 
                                className="drop-shadow-md"
                            />
                            {/* Inner detail */}
                            <circle 
                                cx={0.5 + pos.dx} 
                                cy={0.5 + pos.dy} 
                                r={0.15} 
                                fill="white" 
                                opacity="0.3"
                            />
                            
                            {/* Valid move highlight */}
                            {isValid && (
                                <motion.circle
                                    cx={0.5 + pos.dx} 
                                    cy={0.5 + pos.dy} 
                                    fill="transparent"
                                    stroke={isFocused ? "#3b82f6" : "#fbbf24"}
                                    strokeWidth={isFocused ? 0.12 : 0.08}
                                    initial={{ r: 0.4 }}
                                    animate={{ r: isFocused ? [0.4, 0.6, 0.4] : [0.4, 0.5, 0.4] }}
                                    transition={{ repeat: Infinity, duration: isFocused ? 0.8 : 1 }}
                                />
                            )}
                        </motion.g>
                    );
                })}
            </svg>
        </div>
    );
}
