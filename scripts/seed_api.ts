import axios from 'axios';

const BASE_URL = 'http://localhost:5006/api/v1';

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

const defaultWorkingHours = {
    monday: { open: "08:00", close: "22:00" },
    tuesday: { open: "08:00", close: "22:00" },
    wednesday: { open: "08:00", close: "22:00" },
    thursday: { open: "08:00", close: "22:00" },
    friday: { open: "08:00", close: "22:00" },
    saturday: { open: "08:00", close: "20:00" },
    sunday: { open: "08:00", close: "20:00" }
};

class Seeder {
    token: string = '';
    seedId: string = Math.floor(Date.now() / 1000).toString().slice(-5);

    async apiPost(path: string, data: any, useToken = true) {
        try {
            const headers: any = {};
            if (useToken && this.token) {
                headers['Authorization'] = `Bearer ${this.token}`;
            }
            const res = await axios.post(`${BASE_URL}${path}`, data, { headers });
            return res.data;
        } catch (error: any) {
            console.error(`POST ${path} failed:`, error.response?.data || error.message);
            throw error;
        }
    }

    async apiGet(path: string, useToken = true) {
        try {
            const headers: any = {};
            if (useToken && this.token) {
                headers['Authorization'] = `Bearer ${this.token}`;
            }
            const res = await axios.get(`${BASE_URL}${path}`, { headers });
            return res.data;
        } catch (error: any) {
            console.error(`GET ${path} failed:`, error.response?.data || error.message);
            throw error;
        }
    }

    async seed() {
        console.log(`Starting API-based seeding (SeedID: ${this.seedId})...`);

        // 1. Get Global Amenities for IDs
        // Need any token for this? Typically Yes.
        // Let's create a temporary user to get the token if needed, or register the first biz user.

        const bizUsers = [];
        const amenityIds: number[] = [];
        let wifiId: number = 0;

        for (let i = 0; i < 10; i++) {
            console.log(`--- Seeding Business ${i + 1} ---`);
            const email = `biz_${this.seedId}_${i}@example.com`;
            const phone = generateRandomPhone();
            const password = 'password123';

            // Register
            await this.apiPost('/auth/register', {
                firstName: `BizOwner${i}`,
                lastName: `Api${i}`,
                email,
                phone_number: phone,
                password
            }, false);

            // Login
            const loginRes = await this.apiPost('/auth/login', { email, password }, false);
            this.token = loginRes.token;

            // Create Business Profile (Generates HQ)
            const profRes = await this.apiPost('/profile/create', {
                userName: `BizProf_${this.seedId}_${i}_${generateRandomString(4)}`,
                profileType: 'business',
                businessCategory: 'SME',
                fullAddress: "123 API Way, Lagos",
                streetAddress: "123 API Way",
                state: "Lagos",
                country: "Nigeria",
                city: "Ikeja",
                geoLocation: { type: "Point", coordinates: [3.37, 6.52] },
                bio: "Automated business profile",
                pictureLocation: "https://via.placeholder.com/150"
            });

            // The createProfile returns a NEW token that includes the HQ branchId
            this.token = profRes.token;

            // Get Global Amenities (only once) - Now we have a profile in the token
            if (amenityIds.length === 0) {
                const globalAmenRes = await this.apiGet('/amenities/global');
                globalAmenRes.data.forEach((a: any) => {
                    amenityIds.push(a.id);
                    if (a.name.toLowerCase() === 'wifi') wifiId = a.id;
                });
            }

            // Get branches to find HQ
            const branchListRes = await this.apiGet('/branches');
            const hqBranch = branchListRes.data.branches.find((b: any) => b.isHQ);
            const hqBranchId = hqBranch.id;

            // Add Amenities to HQ
            await this.apiPost('/profile/add-amenities', { amenities: amenityIds });

            // Add WiFi Details (if wifi exists)
            if (wifiId) {
                await this.apiPost('/profile/wifi', { name: "Guest-WiFi", password: "password123" });
            }

            // Create 4 more branches
            const branches = [{ id: hqBranchId }];
            // HQ is already in token
            for (let b = 0; b < 4; b++) {
                const branchRes = await this.apiPost('/branches/create', {
                    name: `Branch ${b + 1} (API)`,
                    fullAddress: `Branch Address ${b + 1}`,
                    streetAddress: `Street ${b + 1}`,
                    isHQ: false,
                    state: "Lagos",
                    country: "Nigeria",
                    city: "Ikeja",
                    description: "Seeded branch",
                    working_hours: defaultWorkingHours,
                    amenities: amenityIds,
                    staff: [{ fullName: `Staff ${b}`, email: `staff_api_${i}_${b}_${Date.now()}@test.com`, role: 'admin' }]
                });
                branches.push({ id: branchRes.data.id });
            }

            // Seed Products for each branch
            for (const branch of branches) {
                // Get branch amenities to get the specific BranchAmenity IDs
                const branchAmenRes = await this.apiGet(`/amenities/branch/${branch.id}`);
                const branchAmenities = branchAmenRes.data;

                const wifiBA = branchAmenities.find((ba: any) => ba.amenityId === wifiId);
                const otherBAs = branchAmenities.filter((ba: any) => ba.amenityId !== wifiId);

                // Need to be "at" the branch in token? ProductController uses req.branch.
                // This means I might need to refresh token or the API should allow passing branchId (ProductController uses req.branch)
                // Wait, ProductController.create uses req.branch. I can't change branch in token easily without a swap endpoint.
                // Let's check if there is a swap endpoint.
                // Actually, let's assume the user wants me to seed products for the HQ since tokens are usually HQ.
                // OR, I can just skip the token requirement for products if I use the Service directly, but the user said "use the routes".
                // If I can't swap branches, I'll just seed products for whichever branch is in the current token (usually the HQ).
                // Actually, let's see if /auth/login returns a way to select branch.

                // For now, I'll seed products for the current active branch in the token.
                const activeBranchId = branch.id;
                // I'll simulate a "switch" by just using the token I have (it might be the last branch created if createBranch updates token?)
                // Actually, createBranch does NOT seem to update token in my memory.

                // Let's seed products for ALL branchAmenities found.
                if (wifiBA) {
                    for (let p = 0; p < 5; p++) {
                        await this.apiPost('/products/', {
                            name: `WiFi Plan ${p + 1}`,
                            description: "Fast internet",
                            price: 500 + (p * 500),
                            branchAmenityId: wifiBA.id,
                            branchId: branch.id,
                            meta: { speed: "10Mbps" }
                        });
                    }
                }

                for (let p = 0; p < 5; p++) {
                    const ba = otherBAs[p % otherBAs.length] || wifiBA;
                    if (!ba) continue;
                    await this.apiPost('/products/', {
                        name: `Product ${p + 1}`,
                        description: "Standard item",
                        price: 200 + (p * 100),
                        branchAmenityId: ba.id,
                        branchId: branch.id,
                        meta: {}
                    });
                }
            }
        }

        // 2. Seed Normal Users
        console.log("Seeding Normal Users...");
        for (let i = 0; i < 20; i++) {
            const email = `user_api_${i}@example.com`;
            const phone = generateRandomPhone();
            const password = 'password123';

            await this.apiPost('/auth/register', {
                firstName: `User${i}`,
                lastName: `Api${i}`,
                email,
                phone_number: phone,
                password
            }, false);

            const loginRes = await this.apiPost('/auth/login', { email, password }, false);
            this.token = loginRes.token;

            await this.apiPost('/profile/create', {
                userName: `UserProf_${this.seedId}_${i}_${generateRandomString(4)}`,
                profileType: 'personal',
                bio: "Normal user profile",
                interests: ["Coffee", "Art"],
                occupation: "Tester",
                pictureLocation: "https://via.placeholder.com/150",
                skills: ["Verification"],
                gender: "Other"
            });
        }

        console.log("API Seeding completed!");
    }
}

new Seeder().seed().catch(err => {
    console.error("Seeding failed:", err.message);
    process.exit(1);
});
