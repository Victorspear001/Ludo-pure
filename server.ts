import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createClient } from '@libsql/client';

const PORT = process.env.PORT || 3000;

interface Player {
    id: string;
    name: string;
    slot: number | null;
}

interface Room {
    id: string;
    players: Player[];
    hostId: string;
    gameState: any | null; 
}

const rooms: Record<string, Room> = {};

let db: any = null;
const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;
if (tursoUrl && tursoToken) {
    db = createClient({
        url: tursoUrl,
        authToken: tursoToken,
    });
}

async function initDb() {
    if (!db) return;
    await db.execute(`
        CREATE TABLE IF NOT EXISTS rooms (
            id TEXT PRIMARY KEY,
            hostId TEXT,
            gameState TEXT
        )
    `);
    await db.execute(`
        CREATE TABLE IF NOT EXISTS players (
            id TEXT PRIMARY KEY,
            roomId TEXT,
            name TEXT,
            slot INTEGER,
            FOREIGN KEY(roomId) REFERENCES rooms(id) ON DELETE CASCADE
        )
    `);
}

async function getRoom(roomId: string): Promise<Room | null> {
    if (!db) return rooms[roomId] || null;
    const rs = await db.execute({ sql: "SELECT * FROM rooms WHERE id = ?", args: [roomId] });
    if (rs.rows.length === 0) return null;
    const roomRow = rs.rows[0];
    
    const ps = await db.execute({ sql: "SELECT * FROM players WHERE roomId = ?", args: [roomId] });
    return {
        id: roomRow.id as string,
        hostId: roomRow.hostId as string,
        gameState: roomRow.gameState ? JSON.parse(roomRow.gameState as string) : null,
        players: ps.rows.map((p: any) => ({
            id: p.id as string,
            name: p.name as string,
            slot: p.slot as number | null
        }))
    };
}

async function createOrUpdateRoom(room: Room) {
    if (!db) {
        rooms[room.id] = room;
        return;
    }
    await db.execute({ 
        sql: "INSERT OR REPLACE INTO rooms (id, hostId, gameState) VALUES (?, ?, ?)", 
        args: [room.id, room.hostId, room.gameState ? JSON.stringify(room.gameState) : null] 
    });
    
    await db.execute({ sql: "DELETE FROM players WHERE roomId = ?", args: [room.id] });
    
    for (const p of room.players) {
        await db.execute({
            sql: "INSERT INTO players (id, roomId, name, slot) VALUES (?, ?, ?, ?)",
            args: [p.id, room.id, p.name, p.slot]
        });
    }
}

async function deleteRoom(roomId: string) {
    if (!db) {
        delete rooms[roomId];
        return;
    }
    await db.execute({ sql: "DELETE FROM rooms WHERE id = ?", args: [roomId] });
}

async function startServer() {
    await initDb();
    const app = express();
    const server = createServer(app);
    const io = new Server(server, { cors: { origin: '*' } });

    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok' });
    });

    io.on('connection', (socket) => {
        socket.on('join_room', async ({ roomId, name }) => {
            let room = await getRoom(roomId);
            if (!room) { // Should not happen with new getRoom, but just in case
                room = { id: roomId, players: [], hostId: socket.id, gameState: null };
                rooms[roomId] = room;
            }
            
            // Assign slot
            const takenSlots = room.players.map(p => p.slot);
            let slot = null;
            for(let i=0; i<4; i++) {
                if(!takenSlots.includes(i)) {
                    slot = i;
                    break;
                }
            }

            const player = { id: socket.id, name, slot };
            room.players.push(player);
            rooms[roomId] = room;
            
            saveRoomToDb(room); // fire and forget
            socket.join(roomId);

            io.to(roomId).emit('room_update', room);
            if (room.gameState) {
                socket.emit('game_state_update', room.gameState);
            }
        });

        socket.on('start_game', (roomId) => {
            const room = rooms[roomId];
            if (room && room.hostId === socket.id) {
                io.to(roomId).emit('game_started');
            }
        });

        socket.on('game_action', ({ roomId, action, payload }) => {
            socket.to(roomId).emit('game_action', { action, payload });
        });

        socket.on('broadcast_state', ({ roomId, state }) => {
            const room = rooms[roomId];
            if (room && room.hostId === socket.id) {
                room.gameState = state;
                updateGameStateInDb(roomId, state); // async, just gameState
                io.to(roomId).emit('game_state_update', state);
            }
        });

        socket.on('disconnect', () => {
            for (const roomId in rooms) {
                const room = rooms[roomId];
                const playerIndex = room.players.findIndex(p => p.id === socket.id);
                if (playerIndex !== -1) {
                    room.players.splice(playerIndex, 1);
                    if (room.players.length === 0) {
                        delete rooms[roomId];
                        deleteRoomFromDb(roomId);
                    } else {
                        if (room.hostId === socket.id) {
                            room.hostId = room.players[0].id;
                        }
                        saveRoomToDb(room); // async
                        io.to(roomId).emit('room_update', room);
                    }
                    break;
                }
            }
        });
    });

    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: 'spa',
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    server.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
}

startServer();
