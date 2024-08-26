import {Server}             from 'socket.io';
import ConversationsHandler from "../SocketHandlers/ConversationsHandler.js";
import socketIOJWT          from 'socketio-jwt';

class SocketConnection {
    static io;
    static Clients = {};
    static options = {
        transports: ['websocket']
    };

    static createServer(httpServer) {
        this.io = new Server(httpServer, this.options);

        // add jwt auth
        this.io.use(
            socketIOJWT.authorize({
                secret   : process.env.TOKEN_SECRET,
                handshake: true
            })
        );

        // register handlers
        const onConnection = (socket) => {

            // set socket nikname to user _id
            socket.nikname = socket.decoded_token.data._id;

            // get access to user
            if (this.Clients[socket.nikname]) {
                this.Clients[socket.nikname].sockets.push(socket.id);
            } else {
                // new user connected
                this.Clients[socket.nikname] = {
                    sockets: [socket.id]
                };
            }

            // register socket disconnect event
            socket.on('disconnect', () => {
                // check if user has active session
                if (this.Clients[socket.nikname]) {
                    // remove this socket from user sockets
                    this.Clients[socket.nikname].sockets.splice(
                        this.Clients[socket.nikname].sockets.indexOf(socket.id),
                        1
                    );
                    // if user has no active socket remove from clients
                    if (this.Clients[socket.nikname].sockets.length < 1) {
                        delete this.Clients[socket.nikname];
                    }
                }
            });

            ConversationsHandler(this.io, socket);
        };

        // set onConnection event
        this.io.on('connection', onConnection);

        console.log('Socket Connection created');
    }
}

export default SocketConnection;