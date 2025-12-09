"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = __importDefault(require("../models/"));
const amenity_types_1 = require("../models/types/amenity.types");
const seedAmenities = async () => {
    try {
        const amenities = Object.values(amenity_types_1.AmenityCategory).map((name) => ({
            name,
            meta: {},
        }));
        await models_1.default.Amenity.bulkCreate(amenities, {
            updateOnDuplicate: ["name", "meta"],
        });
        console.log("Amenities seeded or updated!");
    }
    catch (err) {
        console.error("Error seeding amenities:", err);
    }
};
seedAmenities();
