import bcrypt from 'bcryptjs';
import db from '../models';
import { ProfileService } from '../services/profile.service';
import { BranchService } from '../services/branches.service';
import { ProductService } from '../services/product.service';
import { AmenityCategory } from '../models/types/amenity.types';
import { ProfileType, BusinessCategory } from '../models/types/profile.types';
import { BranchStaffRole } from '../models/types/branchStaff.types';
import { Status } from '../models/types/amenity.types';
import { ICreateProfilePayload } from '../interfaces/profile.interface';
import { ICreateBranchPayload, IBranchStaff } from '../interfaces/branches.interface';
import { ICreateProductPayload } from '../interfaces/product.interface';
import { registerStaffListeners } from '../subscribers/staff.subscriber';

// Set environment to development if not specified
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
registerStaffListeners();

const generateRandomString = (length: number) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

const generateRandomPhone = () => {
    return '080' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
};

// Default working hours
const defaultWorkingHours: any = {
    "0": { open: "08:00", close: "20:00" },
    "1": { open: "08:00", close: "22:00" },
    "2": { open: "08:00", close: "22:00" },
    "3": { open: "08:00", close: "22:00" },
    "4": { open: "08:00", close: "22:00" },
    "5": { open: "08:00", close: "22:00" },
    "6": { open: "08:00", close: "20:00" }
};

const seedDevelopment = async () => {
    try {
        console.log("Starting development seed (Service Layer)...");

        // 1. Fetch Amenity IDs
        const wifiAmenity = await db.Amenity.findOne({ where: { name: AmenityCategory.WIFI } });
        if (!wifiAmenity) throw new Error("Wifi Amenity not found.");

        const allAmenities = await db.Amenity.findAll();
        const otherAmenities = allAmenities.filter((a: any) => a.name !== AmenityCategory.WIFI);
        const amenityIds = allAmenities.map((a: any) => a.id); // All IDs for branches
        const wifiId = wifiAmenity.id;
        const otherId = otherAmenities.length > 0 ? otherAmenities[0].id : wifiId;

        // 2. Seed Business Users & Profiles
        console.log("Seeding Business Users...");

        for (let i = 0; i < 10; i++) {
            const email = `biz_dev_${i}@example.com`;
            const phone = generateRandomPhone();

            // Create User Directly to bypass Email
            console.log(`Creating Business User ${i + 1}...`);
            const hashedPassword = bcrypt.hashSync('password123', 10);

            const user = await db.User.create({
                firstName: `BizOwner${i}`,
                lastName: `Dev${i}`,
                email,
                password: hashedPassword,
                phone_number: phone,
                isVerified: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            // Create Profile (Type Business) -> Creates HQ
            const profilePayload: ICreateProfilePayload = {
                userName: `BizProfile_${i}_${generateRandomString(5)}`,
                profileType: ProfileType.BUSINESS,
                businessCategory: BusinessCategory.SME,
                fullAddress: "123 HQ Street, Lagos",
                streetAddress: "123 HQ Street",
                state: "Lagos",
                country: "Nigeria",
                city: "Ikeja",
                geoLocation: {
                    type: "Point",
                    coordinates: [3.3792, 6.5244] // approx Lagos
                },
                bio: "A seeded business profile",
                pictureLocation: "https://via.placeholder.com/150"
            };

            const { profile } = await ProfileService.createProfile(profilePayload, user!.id);

            // Find HQ Branch
            const hqBranch = await db.Branch.findOne({
                where: { profileId: profile.id, isHQ: true }
            });

            if (!hqBranch) throw new Error(`HQ Branch not created for profile ${profile.id}`);

            // Add Amenities to HQ Branch (ProfileService.addAmenities expects array of strings (names? or ids?)
            // Checking ProfileService.addAmenities:
            // "const rows = parsedAmenities.map((name: string) => ({... name }))"
            // It maps them to 'name' column in Amenity? No, Amenity model uses ID.
            // Wait, ProfileService.addAmenities :
            // map((name: string) => ({... name: name})) -> bulkCreate Amenity? NO.
            // ProfileService code:
            // await Amenity.bulkCreate(rows) ...
            // This attempts to create NEW Amenities, not link existing ones via BranchAmenity?
            // Let's re-read ProfileService.addAmenities carefully.
            /*
            static async addAmenities(amenities: any, userId: number, profileId: number, branchId: number) {
                ...
                const rows = parsedAmenities.map((name: string) => ({
                    userId,
                    businessId: profileId,
                    branchId,
                    name
                }));
                await Amenity.bulkCreate(rows...);
            }
            */
            // ERROR IN SERVICE? Amenity model has 'name' as ENUM. 
            // If it bulkCreates into Amenity table, it's duplicating amenities? 
            // OR maybe it's misnamed and it creates BranchAmenity?
            // "await Amenity.bulkCreate" -> creates in 'amenities' table.
            // But 'amenities' table usually has unique name.
            // AND the row object has 'branchId', 'businessId'. 
            // Does Amenity model have branchId? NO.
            // Amenity model: id, name, meta.
            // BranchAmenity model: businessId, branchId, amenityId.
            // ProfileService.addAmenities IMPL looks SUSPICIOUS or I skimmed it wrong.

            // RE-READING ProfileService.ts (from step 63):
            /*
            lines 241-253:
            const rows = parsedAmenities.map((name: string) => ({
                userId,
                businessId: profileId,
                branchId,
                name
            }));
            await Amenity.bulkCreate(rows, ...);
            */
            // It imports Amenity from "../models/Amenity".
            // It calls bulkyCreate on Amenity.
            // The object keys are userId, businessId, branchId, name.
            // Amenity model (step 29) does NOT have userId, businessId, branchId.
            // THIS SERVICE METHOD LOOKS BROKEN or I am misinterpreting "Amenity". 
            // (Maybe it imports BranchAmenity as Amenity? No, line 12: import { Amenity } from "../models/Amenity";)

            // However, BranchService uses `BranchAmenity.bulkCreate`.
            // I should assume BranchService is correct and use that methodology for non-HQ branches.
            // For HQ branch, if `ProfileService.addAmenities` is suspect, I will use `BranchAmenity.bulkCreate` directly (simulating what SHOULD happen or using BranchService update method if exists).
            // Actually, `BranchService` has no specific `addAmenities` method exposed, it does it in create.

            // I'll manually seed BranchAmenities for the HQ branch directly using DB model, to be safe.
            // Using IDs I fetched.

            const hqAmenityEntries = [wifiAmenity, ...otherAmenities].map(a => ({
                businessId: profile.id,
                branchId: hqBranch.id,
                amenityId: a.id,
                status: Status.ACTIVE,
                totalRating: 0,
                ratingCount: 0
            }));
            await db.BranchAmenity.bulkCreate(hqAmenityEntries);

            // 3. Create Additional Branches
            const branches = [hqBranch]; // Start with HQ

            for (let b = 0; b < 4; b++) { // 4 more to make 5
                const staff: IBranchStaff[] = [
                    { firstName: `Staff_${b}_${i}`, lastName: `Dev_${b}_${i}`, email: `staff_${b}_${i}_${Date.now()}@test.com`, role: BranchStaffRole.ADMIN }
                ];

                const branchPayload: ICreateBranchPayload = {
                    name: `Branch ${b + 1}`, // Service appends city/state
                    fullAddress: `Address ${b + 1}`,
                    streetAddress: `Street ${b + 1}`,
                    isHQ: false,
                    state: "Lagos",
                    country: "Nigeria",
                    city: "Ikeja",
                    description: "Another branch",
                    working_hours: defaultWorkingHours,
                    amenities: [wifiId, ...otherAmenities.map((a: any) => a.id)], // Add all amenities
                    staff: staff
                };

                const userBasic = { profileId: profile.id, userId: user!.id, email: user!.email, firstName: user!.firstName, lastName: user!.lastName };
                const newBranch = await BranchService.createBranch(branchPayload, userBasic as any);
                branches.push(newBranch);
            }

            // 4. Seed Products for ALL branches
            for (const branch of branches) {
                // Get BranchAmenities for this branch
                const branchAmenities = await db.BranchAmenity.findAll({
                    where: { branchId: branch.id }
                });

                const wifiBA = branchAmenities.find((ba: any) => ba.amenityId === wifiId);
                const otherBAs = branchAmenities.filter((ba: any) => ba.amenityId !== wifiId);

                if (wifiBA) {
                    // 10 Wifi Plans
                    for (let wp = 0; wp < 10; wp++) {
                        const productPayload: ICreateProductPayload = {
                            name: `Wifi Plan ${wp + 1}`,
                            description: "High speed internet",
                            price: 1000 + (wp * 500),
                            businessId: profile.id,
                            userId: user!.id,
                            branchId: branch.id,
                            branchAmenityId: wifiBA.id, // ID of the BranchAmenity row
                            files: [],
                            meta: { speed: "10mbps" }
                        };
                        await ProductService.createProduct(productPayload);
                    }
                }

                if (otherBAs.length > 0) {
                    // 20 Other Products distributed among available amenities
                    for (let p = 0; p < 20; p++) {
                        // Round-robin distribution
                        const targetBA = otherBAs[p % otherBAs.length];

                        const productPayload: ICreateProductPayload = {
                            name: `Product ${p + 1}_${generateRandomString(6)}`, // Adding amenityId to name for visibility
                            description: "Yummy item",
                            price: 500 + (p * 200),
                            businessId: profile.id,
                            userId: user!.id,
                            branchId: branch.id,
                            branchAmenityId: targetBA.id,
                            files: [],
                            meta: {}
                        };
                        await ProductService.createProduct(productPayload);
                    }
                }
            }
        }

        // 5. Seed Normal Users
        console.log("Seeding Normal Users...");
        for (let i = 0; i < 40; i++) {
            const email = `user_dev_${i}@example.com`;
            const phone = generateRandomPhone();

            const hashedPassword = bcrypt.hashSync('password123', 10);
            const user = await db.User.create({
                firstName: `User${i}`,
                lastName: `Dev${i}`,
                email,
                password: hashedPassword,
                phone_number: phone,
                isVerified: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            const profilePayload: ICreateProfilePayload = {
                userName: `UserProfile_${i}_${generateRandomString(5)}`,
                profileType: ProfileType.PERSONAL,
                bio: "Just a normal user",
                interests: ["Reading", "Coffee"],
                occupation: "Developer",
                pictureLocation: "https://via.placeholder.com/150",
                skills: ["Coding"],
                gender: "Male",
            } as any; // Cast to any to handle loose typing if interface mismatches strictly

            await ProfileService.createProfile(profilePayload, user!.id);
        }

        console.log("Development seed (Service Layer) completed successfully!");
        process.exit(0);

    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
};

seedDevelopment();
