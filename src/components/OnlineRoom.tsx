import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState, PlayerConfig } from '../lib/types';
import { useLudoGame } from '../hooks/useLudoGame';
import { LudoGame } from './LudoGame';
import { Bot, RotateCcw, User, UserPlus } from 'lucide-react';
import { PLAYER_COLORS } from '../lib/constants';

interface RoomData {
    id: string;
    players: { id: string, name: string, slot: number | null }[];
    hostId: string;
    isStarted: boolean;
}

export function OnlineRoom({ 
    name, 
    onExit 
}: { 
    name: string, 
    onExit: () => void 
}) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [room, setRoom] = useState<RoomData | null>(null);
    const [roomIdInput, setRoomIdInput] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    
    // Remote state
    const [remoteGameState, setRemoteGameState] = useState<GameState | null>(null);

    // Host state
    const [hostPlayersConfig, setHostPlayersConfig] = useState<PlayerConfig[]>([
        { id: 0, type: 'human' },
        { id: 1, type: 'human' },
        { id: 2, type: 'human' },
        { id: 3, type: 'human' }
    ]);
    const { state: hostGameState, rollDice: hostRoll, moveToken: hostMove } = useLudoGame(hostPlayersConfig);

    useEffect(() => {
        const s = io(import.meta.env.VITE_APP_URL || '/', { autoConnect: true });
        
        s.on('connect', () => setIsConnected(true));
        
        s.on('room_update', (data: RoomData) => {
            setRoom(data);
        });

        s.on('game_state_update', (state: GameState) => {
            setRemoteGameState(state);
        });

        s.on('game_action', ({ action, payload }) => {
            // Received from non-hosts
            if (action === 'roll') hostRoll();
            if (action === 'move') hostMove(payload);
        });

        setSocket(s);
        return () => { s.disconnect(); };
    }, [hostRoll, hostMove]);

    // Host logic to broadcast state
    useEffect(() => {
        if (room && socket && room.hostId === socket.id && remoteGameState !== null) {
            socket.emit('broadcast_state', { roomId: room.id, state: hostGameState });
        }
    }, [hostGameState, room, socket, remoteGameState]);

    const joinRoom = (id: string = Math.random().toString(36).substring(2, 6).toUpperCase()) => {
        if (!socket) return;
        socket.emit('join_room', { roomId: id, name });
    };

    const startGame = () => {
        if (!socket || !room) return;
        
        // Match player slots to config
        setRemoteGameState(hostGameState); // Signal game start
        socket.emit('broadcast_state', { roomId: room.id, state: hostGameState });
    };

    if (!room) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 text-slate-800">
                <div className="max-w-md w-full bg-white rounded-[40px] p-8 shadow-2xl border border-slate-100 flex flex-col gap-6">
                    <button onClick={onExit} className="self-start p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><RotateCcw className="w-5 h-5" /></button>
                    <div className="text-center mb-4">
                        <h1 className="text-3xl heading text-slate-800 tracking-tight">MULTIPLAYER</h1>
                    </div>

                    <button
                        onClick={() => joinRoom()}
                        className="w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2 uppercase tracking-wide bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20 active:scale-95"
                    >
                        <UserPlus className="w-5 h-5"/> CREATE ROOM
                    </button>

                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-slate-200"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-400 text-sm font-bold uppercase">OR</span>
                        <div className="flex-grow border-t border-slate-200"></div>
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="ROOM CODE"
                            value={roomIdInput}
                            onChange={e => setRoomIdInput(e.target.value.toUpperCase())}
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-lg font-bold text-slate-700 focus:outline-none focus:border-indigo-500 transition-colors uppercase text-center"
                            maxLength={4}
                        />
                        <button
                            onClick={() => joinRoom(roomIdInput)}
                            disabled={roomIdInput.length < 4}
                            className="bg-indigo-600 text-white rounded-2xl px-6 font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            JOIN
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const isHost = socket?.id === room.hostId;
    const activeState = (isHost && remoteGameState !== null) ? hostGameState : remoteGameState;

    if (activeState) {
        const mySlot = room.players.find(p => p.id === socket?.id)?.slot ?? 0;
        
        // Create custom wrapped rollDice and moveToken
        const proxyRoll = () => {
            if (isHost) hostRoll();
            else socket?.emit('game_action', { roomId: room.id, action: 'roll' });
        };
        const proxyMove = (tid: number) => {
            if (isHost) hostMove(tid);
            else socket?.emit('game_action', { roomId: room.id, action: 'move', payload: tid });
        };

        return <LudoGame 
            state={activeState} 
            rollDice={proxyRoll} 
            moveToken={proxyMove} 
            onExit={onExit} 
            isLocalPlayer={(s) => isHost ? (s === mySlot || hostPlayersConfig[s].type === 'ai') : s === mySlot}
        />;
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 text-slate-800">
            <div className="max-w-md w-full bg-white rounded-[40px] p-8 shadow-2xl border border-slate-100 flex flex-col gap-6">
                <div className="flex justify-between items-center bg-slate-100 py-3 px-6 rounded-2xl">
                    <span className="font-bold text-slate-500 uppercase">Room Code</span>
                    <span className="text-xl heading text-indigo-600 tracking-wider">{room.id}</span>
                </div>

                <div className="space-y-3">
                    {[0, 1, 2, 3].map(slot => {
                        const p = room.players.find(p => p.slot === slot);
                        return (
                            <div key={slot} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
                                <div className="w-10 h-10 rounded-xl shadow-inner border border-white/20 flex items-center justify-center text-white font-bold" style={{ backgroundColor: PLAYER_COLORS[slot] }}>P{slot+1}</div>
                                {p ? (
                                    <span className="font-bold text-lg text-slate-700">{p.name} {p.id === room.hostId ? '(Host)' : ''} {p.id === socket?.id ? '(You)' : ''}</span>
                                ) : (
                                    <span className="font-bold text-slate-400 italic">Waiting...</span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {isHost && (
                    <button
                        onClick={startGame}
                        className="w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-lg uppercase tracking-wide bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20 active:scale-95"
                    >
                        START GAME
                    </button>
                )}
                {!isHost && (
                    <div className="text-center font-bold text-slate-400 animate-pulse py-4">Waiting for host to start...</div>
                )}
            </div>
        </div>
    );
}