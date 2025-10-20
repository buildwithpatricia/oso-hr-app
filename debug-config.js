const config = require('./config');

console.log('Config loaded:');
console.log('osoApiKey:', config.osoApiKey);
console.log('typeof osoApiKey:', typeof config.osoApiKey);
console.log('osoApiKey length:', config.osoApiKey ? config.osoApiKey.length : 'undefined');
console.log('Environment OSO_AUTH_API_KEY:', process.env.OSO_AUTH_API_KEY);
