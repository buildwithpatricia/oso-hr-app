module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here-change-in-production',
  dbPath: process.env.DB_PATH || './database.sqlite',
  nodeEnv: process.env.NODE_ENV || 'development',
  osoApiKey: process.env.OSO_AUTH_API_KEY
};
