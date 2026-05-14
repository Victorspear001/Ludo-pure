export type PlayerType = 'human' | 'ai' | 'none';

export interface PlayerConfig {
    id: number;
    type: PlayerType;
}

export interface Token {
    id: number;
    playerId: number;
    progress: number; // -1 = base, 0-50 = main path, 51-55 = home path, 56 = home
}

export interface GameState {
    players: PlayerConfig[];
    tokens: Token[];
    turn: number;
    dice: number | null;
    isRolling: boolean;
    hasRolled: boolean;
    validTokens: number[];
    winner: number | null;
    movingToken: { id: number; steps: number } | null;
}
