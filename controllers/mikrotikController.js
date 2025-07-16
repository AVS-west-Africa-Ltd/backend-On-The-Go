const Mikrotik = require("../models/Mikrotik");
const TicketProfile = require("../models/TicketProfile")
const RouterConnect = require("../services/MikrotikService");


const addRouter  = async(req, res)=>{
    const { host, user, password } = req.body; 
    const userID = req.userId;    
    try { 
        const { router, api } = await RouterConnect.connector({ host, user, password });
        const systemInfo = await router.menu('/system/identity').getOnly();  
        await api.close();          
        const mikrotik = await Mikrotik.create({ host, username: user, password, userId: userID, metadata: systemInfo });
        
        res.status(200).json({mikrotik, message: "Mikrotik router added"});
    } catch (error) {
        console.log(error);
        res.status(400).json({ messsage: "Failed to connect to router." });
    }
}


const syncProfiles = async(req, res)=>{
    const userID = req.userId;
    const { routerId } = req.body
    try {
        const mikrotik = await Mikrotik.findOne({ 
            where: { id: routerId }
        });
        if(!mikrotik){
            res.status(400).json({ messsage: "Failed to sync ticket profiles, router not found." });
        }
        const { router, api } = await RouterConnect.connector({ host: mikrotik.host, user: mikrotik.username, password: mikrotik.password });
        const profiles = await router.menu('/tool/user-manager/profile').getAll();
        await api.close();
        profiles.forEach(async( profile ) => {
            const ticketProfile = await TicketProfile.findOne({ where: { name: profile.name, mikrotikId: routerId, userId: userID } });
            if (!ticketProfile) {
                await TicketProfile.create({ name: profile.name, price: 0, mikrotikId: routerId, userId: userID });
            }          
        });
        res.status(200).json({ profiles, message: "Ticket profile have been sync" });
    } catch (error) {
        console.log(error);
        res.status(400).json({ messsage: "Failed to sync ticket profiles." });
    }
}


const addTicketPrice = async(req, res)=>{
    const { profileId, amount } = req.body;
    const userID = req.userId;
    try {
        const profile = await TicketProfile.findOne({ where: { id: profileId, userId: userID }});
        await profile.update({ price: amount });
        res.status(200).json({ message: "Profile price changed"});
    } catch (error) {
        res.status(400).json({ messsage: "Failed to change profile price." });
    }
}


const changeTicketStatus = async(req, res)=>{
    const { profileId, status } = req.body;
    const userID = req.userId;
    try {
        const profile = TicketProfile.findOne({ where: { id: profileId, userId: userID }});
        await profile.update({ isActive: status });
        res.status(200).json({ message: "Profile price changed"});
    } catch (error) {
        res.status(400).json({ messsage: "Failed to change profile price." });
    }
}


const fetchTicketProfile = async (req, res)=>{
    const { routerId } = req.query;
    const userID = req.userId;
    try {
        const profiles = await TicketProfile.findAll({
            where: { mikrotikId: routerId, userId: userID }
        });
        res.status(200).json({ profiles, message: "Profile fetched." });
    } catch (error) {
        console.log(error)
        res.status(400).json({ messsage: "Failed to fetch ticket profile." });
    }
}


module.exports = { addRouter, syncProfiles, addTicketPrice, changeTicketStatus, fetchTicketProfile }

