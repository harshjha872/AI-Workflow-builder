import Redis from 'ioredis';

export const connection = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    maxRetriesPerRequest: null,
});

connection.on('error', (err: Error) => {
    console.error('Redis connection error:', err);
});