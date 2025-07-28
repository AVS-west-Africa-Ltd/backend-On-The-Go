const { NetworkRouter, TicketProfile } = require('../models');
const RouterConnect = require("../services/MikrotikService");


const addRouter  = async(req, res)=>{
    const { host, user, password } = req.body; 
    const userID = req.userId;    
    try { 

        let networkRouter = await NetworkRouter.findOne({ 
            where: { userId: userID }
        });

        if(networkRouter){
            res.status(200).json({ messsage: "You have added router already" });
        }
        
        const { router, api } = await RouterConnect.connector({ host, user, password });
        const systemInfo = await router.menu('/system/resource').getOnly();
        await api.close();   
        networkRouter = await NetworkRouter.create({ host, username: user, password, userId: userID, metadata: systemInfo });
        
        res.status(200).json({networkRouter, message: "Network router added"});
    } catch (error) {
        console.log(error);
        res.status(400).json({ messsage: "Failed to connect to router." });
    }
}

const fetchRouter = async (req, res)=>{
    const userID = req.userId;
    try {
        const router = await NetworkRouter.findAll({
            where: { userId: userID }
        });
        res.status(200).json({ router, message: "Router info fetched." });
    } catch (error) {
        console.log(error)
        res.status(400).json({ messsage: "Failed to fetch router info." });
    }
}

const editRouter = async(req, res)=>{
    const userID = req.userId;
    try {
        const { routerId, host, user, password } = req.body;
        const networkRouter = await NetworkRouter.findOne({ where: { id: routerId, userId: userID }});
        if(!networkRouter){
            res.status(200).json({ messsage: "Network router not found" });
        }
        await networkRouter.update({ 
            username: user,
            host,
            password
        });
        res.status(200).json({ message: "Network router Info updated."});
    } catch (error) {
        console.log(error);
        res.status(400).json({ messsage: "Failed to update network router info." });
    }
}

const checkRouterConnection = async(req, res)=>{
   const userID = req.userId;
    try {
        const networkRouter = await NetworkRouter.findOne({ 
            where: { userId: userID }
        });
        if(!networkRouter){
            res.status(400).json({ messsage: "Failed to check connection, router not found." });
        }
        const { router, api } = await RouterConnect.connector({ host: networkRouter.host, user: networkRouter.username, password: networkRouter.password });
        const systemInfo = await router.menu('/system/resource').getOnly();  
        await api.close();   
        res.status(200).json({ systemInfo, message: "Connection was established to router."});
    } catch (error) {
        console.log(error);
        res.status(400).json({ messsage: "Failed to update network router info." });
    } 
}

const syncProfiles = async(req, res)=>{
    const userID = req.userId;
    try {
        const networkRouter = await NetworkRouter.findOne({ 
            where: { userId: userID }
        });
        if(!networkRouter){
            res.status(400).json({ messsage: "Failed to sync ticket profiles, router not found." });
        }
        const { router, api } = await RouterConnect.connector({ host: networkRouter.host, user: networkRouter.username, password: networkRouter.password });
        const profiles = await router.menu('/tool/user-manager/profile').getAll();
        await api.close();
        profiles.forEach(async( profile ) => {
            const ticketProfile = await TicketProfile.findOne({ where: { name: profile.name, routerId: networkRouter.id, userId: userID} });
            if (!ticketProfile) {
                await TicketProfile.create({ name: profile.name, price: 0, routerId: networkRouter.id, userId: userID,  owner: profile.owner });
            }          
        });
        res.status(200).json({ profiles, message: "Ticket profile have been sync" });
    } catch (error) {
        console.log(error);
        res.status(400).json({ messsage: "Failed to sync ticket profiles." });
    }
}

const editTicketProfile = async(req, res)=>{
    const userID = req.userId;
    try {
        const { profileId, title, description, bandwidth, status, amount } = req.body;
        const profile = await TicketProfile.findOne({ where: { id: profileId, userId: userID }});
        await profile.update({ 
            title: title,
            description: description,
            bandwidth: bandwidth,
            price: amount,
            isActive: status
        });
        res.status(200).json({ message: "Profile Info updated"});
    } catch (error) {
        console.log(error);
        res.status(400).json({ messsage: "Failed to update profile info." });
    }
}

const addTicketPrice = async(req, res)=>{
    const userID = req.userId;
    try {
        const { profileId, amount } = req.body;
        const profile = await TicketProfile.findOne({ where: { id: profileId, userId: userID }});
        if(!profile){
            res.status(400).json({ messsage: "Failed profile not found" });
        }
        await profile.update({ price: amount });
        res.status(200).json({ message: "Profile price changed"});
    } catch (error) {
        console.log(error);
        res.status(400).json({ messsage: "Failed to change profile price." });
    }
}

const changeTicketStatus = async(req, res)=>{
    const { profileId, status } = req.body;
    const userID = req.userId;
    try {
        const profile = await TicketProfile.findOne({ where: { id: profileId, userId: userID }});
        if (!profile) {
            res.status(400).json({ message: "Failed profile not found"});
        }
        console.log(profile);
        profile.isActive = status;
        await profile.save();
        res.status(200).json({ message: "Profile status changed"});
    } catch (error) {
        console.log(error);
        res.status(400).json({ messsage: "Failed to change profile status." });
    }
}

const fetchTicketProfile = async (req, res)=>{
    const userID = req.userId;
    try {
        const profiles = await TicketProfile.findAll({
            where: { userId: userID }
        });
        res.status(200).json({ profiles, message: "Profile fetched." });
    } catch (error) {
        console.log(error)
        res.status(400).json({ messsage: "Failed to fetch ticket profile." });
    }
}

module.exports = { addRouter, syncProfiles, addTicketPrice, changeTicketStatus, fetchTicketProfile, fetchRouter, editTicketProfile, editRouter, checkRouterConnection }

