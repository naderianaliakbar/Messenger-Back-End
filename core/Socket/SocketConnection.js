import {Server}              from 'socket.io';
import ConversationsHandler  from "./Handlers/ConversationsHandler.js";
import socketIOJWT           from 'socketio-jwt';
import RedisConnection       from "../RedisConnection.js";
import MessagesListener      from "./listeners/MessagesListener.js";
import ConversationsListener from "./listeners/ConversationsListener.js";

// Get Redis Client
const redisClient = await RedisConnection.getInstance();

class SocketConnection {
    static io;
    static options = {
        transports: ['websocket']
    };

    static async createServer(httpServer) {
        this.io = new Server(httpServer, this.options);

        // add jwt auth
        this.io.use(socketIOJWT.authorize({
            secret   : process.env.TOKEN_SECRET,
            handshake: true
        }));

        // register handlers
        const onConnection = async (socket) => {

            // set socket nikname to user _id
            socket.nikname = socket.decoded_token.data._id;

            // save user socket in redis
            await redisClient.rPush(`SocketClient:${socket.nikname}:sockets`, socket.id);

            // register socket disconnect event
            socket.on('disconnect', async () => {
                // delete user active socket from redis
                await redisClient.lRem(`SocketClient:${socket.nikname}:sockets`, 0, socket.id);
            });

            ConversationsHandler(this.io, socket);
        };

        // register messages subscribers
        MessagesListener(this.io);
        ConversationsListener(this.io);

        // set onConnection event
        this.io.on('connection', onConnection);

        console.log('Socket Connection created');
    }
}

export default SocketConnection;