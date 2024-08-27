import {createClient} from 'redis';

class RedisConnection {
    static instance = null;

    constructor() {
        if (RedisConnection.instance) {
            throw new Error('Use RedisClient.getInstance() instead of creating a new instance.');
        }

        this.client = null;
    }

    async create() {
        if (!this.client) {
            this.client = createClient({
                host: process.env.REDIS_HOST,
                port: process.env.REDIS_PORT
            });

            this.client.on('error', (err) => {
                console.error('Redis error:', err);
            });

            await this.client.connect();
            console.log('Redis Connection Created');
        }
    }

    static async getInstance() {
        if (!RedisConnection.instance) {
            RedisConnection.instance = new RedisConnection();
            await RedisConnection.instance.create();
        }

        return RedisConnection.instance.client;
    }
}

export default RedisConnection;

