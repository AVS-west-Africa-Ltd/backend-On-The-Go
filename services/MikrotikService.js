const RouterOSClient = require('sy5-routeros-client').RouterOSClient;
const { NetworkRouter } = require('../models');
const {  RandomCharacters } = require('../helpers');

exports.connector = async ( credentials )=>{

    const api = new RouterOSClient({
        host: credentials.host,
        user: credentials.user,
        password: credentials.password
    });
    try {
        const router = await api.connect();
        return { router, api };
    } catch (error) {
        console.log(error);
        api.close();
        throw new Error("Failed to connect to router.");
    }
    
}

exports.generateTicket = async ( ticketProfile )=>{
    let client;
    try {
        
        const networkRouter = await NetworkRouter.findOne({ where: { id: ticketProfile.routerId } });

        if(!networkRouter) throw new Error("Failed to fetch network router.");

        const credentials = { host:networkRouter.host, user: networkRouter.username, password: networkRouter.password };

        client =  new RouterOSClient( credentials );

        const router = await client.connect();

        const ticket = await router.menu('/tool/user-manager/user').add({
            username: RandomCharacters(6),
            password:  RandomCharacters(6),
            customer: ticketProfile.owner,
        });

        //const profile = await router.menu().write(`/tool user-manager user create-and-activate-profile ${ticket.username} customer=operator  profile=5DAYS`);

        client.close();
        return { ticket };

    } catch (error) {
        console.log(error);
        if(client) await client.close();
        throw new Error("Failed to generate ticket.");
    }

    
}