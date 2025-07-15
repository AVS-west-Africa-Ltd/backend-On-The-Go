const Mikrotik = require("../models/Mikrotik");
const RouterConnect = require("../services/MikrotikService");


const addRouter  = async(req, res)=>{
    const {host, user, password, businessId } = req.body;
    const { router, api } = RouterConnect.connector({ host, user, password });  
    try { 
        const systemInfo = await router.menu('/system/identity').getOnly();                
        const mikrotik = await Mikrotik.create({ host, user, password, businessId, metadata: systemInfo });
        await api.close();
        res.status().json({mikrotik, message: "Mikrotik router added"});
    } catch (error) {
        await api.close();
        res.status(400).json({ messsage: "Failed to connect to router." });
    }
}

const syncProfiles = async(req, res)=>{
    const { router, api } = RouterConnect.connector({ host, user, password });  
    try {
        const profiles = await router.menu('/tool/user-manager/user/profile').getAll();

    } catch (error) {
        
    }
}


const addTicketPrice = async(req, res)=>{
    try {
        
    } catch (error) {
        
    }
}

const fetchTicketProfile = async (req, res)=>{
    try {
        
    } catch (error) {
        
    }
}

