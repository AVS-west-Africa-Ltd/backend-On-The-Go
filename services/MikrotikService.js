const RouterOSClient = require('sy5-routeros-client').RouterOSClient;

const connector = async ( credentials )=>{

    const api = new RouterOSClient({
        host: credentials.host,
        user: credentials.user,
        password: credentials.password
    });
    try {
        const router = await api.connect();
        return { router, api} ;
    } catch (error) {
        console.log(error);
        throw new Error("Failed to connect to router");
        
    }
    
}

module.exports = { connector };