import { useState } from 'react';
import { Menu } from './components/Menu';
import { Lobby } from './components/Lobby';
import { LudoGame } from './components/LudoGame';
import { PlayerConfig } from './lib/types';
import { OnlineRoom } from './components/OnlineRoom';
import { useLudoGame } from './hooks/useLudoGame';

function LocalGame({ onExit }: { onExit: () => void }) {
  const [players, setPlayers] = useState<PlayerConfig[] | null>(null);
  
  if (!players) {
    return <Lobby onStartGame={setPlayers} onExit={onExit} />;
  }

  return <GameRunner players={players} onExit={() => setPlayers(null)} />;
}

function GameRunner({ players, onExit }: { players: PlayerConfig[], onExit: () => void }) {
  const { state, rollDice, moveToken } = useLudoGame(players);
  return <LudoGame state={state} rollDice={rollDice} moveToken={moveToken} onExit={onExit} />;
}

export default function App() {
  const [mode, setMode] = useState<'local' | 'online' | null>(null);
  const [name, setName] = useState('');

  if (!mode) return <Menu onSelectMode={(m, n) => { setMode(m); setName(n); }} />;
  if (mode === 'local') return <LocalGame onExit={() => setMode(null)} />;
  if (mode === 'online') return <OnlineRoom name={name} onExit={() => setMode(null)} />;

  return null;
}

