export default () => ({
  database: {
    type: process.env.DB_TYPE || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'codelive',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  },
  judge0: {
    apiUrl: process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com',
    apiKey: process.env.JUDGE0_API_KEY || '',
  },
});
