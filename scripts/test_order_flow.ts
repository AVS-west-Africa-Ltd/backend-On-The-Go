import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.API_URL || 'http://localhost:5006/api/v1';

// --- CONFIGURATION ---
const BUSINESS_ID = 1;
const BRANCH_IDS = [1, 2, 3, 4, 5];
// ---------------------

const generateUserEmail = (index: number) => `user_dev_${index}@example.com`;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function registerUser(email: string) {
    try {
        await axios.post(`${BASE_URL}/auth/register`, {
            firstName: "Test",
            lastName: "User",
            email: email,
            password: "password123",
            phone_number: `080${Math.floor(Math.random() * 100000000)}`
        });
    } catch (error: any) {
        if (error.response?.data?.message?.includes('already exists')) return;
        console.error(`      ❌ Register failed for ${email}:`, error.response?.data?.message || error.message);
    }
}

async function getAuthToken(email: string, retryCount = 0): Promise<string> {
    if (retryCount > 3) {
        throw new Error(`Exceeded retries for ${email}`);
    }
    try {
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: email,
            password: "password123"
        });

        return loginRes.data.data.token;
    } catch (error: any) {
        if (error.response?.status === 400 || error.response?.data?.message?.includes('does not exist')) {
            await registerUser(email);
            return getAuthToken(email, retryCount + 1);
        }
        throw error;
    }
}

async function getProductsForBranch(token: string, branchId: number) {
    const authHeaders = { Authorization: `Bearer ${token}` };
    try {
        const res = await axios.get(`${BASE_URL}/app/branch/filter`, {
            params: { branchId },
            headers: authHeaders
        });
        const data = res.data.data;
        const allProducts = [...(data.wifi || []), ...(data.products || [])];
        return allProducts;
    } catch (error: any) {
        console.error(`      ❌ Failed to get products for branch ${branchId}:`, error.response?.data?.message || error.message);
        return [];
    }
}

async function createOrder(token: string, branchId: number, productIds: number[]) {
    const authHeaders = { Authorization: `Bearer ${token}` };
    const orderPayload = {
        businessId: BUSINESS_ID,
        branchId: branchId,
        items: productIds.map(id => ({ productId: id, quantity: 1 }))
    };

    try {
        const res = await axios.post(`${BASE_URL}/orders`, orderPayload, { headers: authHeaders });
        return res.data.data;
    } catch (error: any) {
        console.error(`      ❌ Create Order fail for branch ${branchId}:`, error.response?.data?.message || error.message);
        return null;
    }
}

async function initiateCheckout(token: string, orderId: string) {
    const authHeaders = { Authorization: `Bearer ${token}` };
    try {
        const res = await axios.post(`${BASE_URL}/orders/checkout`, { orderId }, { headers: authHeaders });
        return res.data.data;
    } catch (error: any) {
        console.error(`      ❌ Checkout fail for ${orderId}:`, error.response?.data?.message || error.message);
        return null;
    }
}

async function runScenario(branchId: number, customerCount: number, label: string, startUserIndex: number) {
    console.log(`\n--- ${label}: Branch ID: ${branchId} (${customerCount} customers) ---`);

    // Use the first user in the batch to discover products for this branch
    const firstEmail = generateUserEmail(startUserIndex);
    const discoverToken = await getAuthToken(firstEmail);
    const products = await getProductsForBranch(discoverToken, branchId);

    if (products.length === 0) {
        console.log(`   ⚠️ No products found for branch ${branchId}. skipping.`);
        return;
    }

    // Group products by amenity category and pick one from each
    const categoryMap = new Map<string, any>();
    products.forEach((p: any) => {
        const catName = p.branch_amenity?.name || "Uncategorized";
        if (!categoryMap.has(catName)) {
            categoryMap.set(catName, p.id);
        }
    });
    const diverseProductIds = Array.from(categoryMap.values());
    console.log(`   📦 Selected ${diverseProductIds.length} unique products from categories: ${Array.from(categoryMap.keys()).join(', ')}`);

    for (let i = 0; i < customerCount; i++) {
        const userIndex = startUserIndex + i;
        const email = generateUserEmail(userIndex);
        console.log(`📦 Customer ${i + 1} (${email}):`);

        try {
            const token = await getAuthToken(email);
            // Place one order containing all diverse products
            const order = await createOrder(token, branchId, diverseProductIds);
            if (order) {
                console.log(`   ✅ Customer ${i + 1} (${email}): Order ${order.id} created (${diverseProductIds.length} items).`);
                const checkout = await initiateCheckout(token, order.id);
                if (checkout) console.log(`      🔗 Checkout Complete: ${checkout.paymentUrl}`);
            }
            // Add delay to avoid rate limiting
            await sleep(1000);
        } catch (e: any) {
            console.error(`   ❌ Simulation step failed for ${email}:`, e.message);
        }
    }
}

async function main() {
    console.log(`🚀 Starting Full Order Simulation against: ${BASE_URL}\n`);

    try {
        // Step 1: 5 different customers order from the same branch (Branch 5)
        console.log("=== STEP 1: 3 Customers -> 1 Branch (ID: 3) ===");
        await runScenario(3, 3, "Step 1", 0);

        // Step 2: 3 different branches each have 3 different customers
        console.log("\n=== STEP 2: 3 Branches -> 3 Customers Each ===");
        let currentBatchStartIndex = 10;
        for (const branchId of BRANCH_IDS) {
            await runScenario(branchId, 3, `Step 2 - Branch ${branchId}`, currentBatchStartIndex);
            currentBatchStartIndex += 3;
        }

        console.log(`\n🎉 Simulation Complete!`);
        process.exit(0);
    } catch (error: any) {
        console.error("\n💥 Simulation Crashed:", error.message);
        process.exit(1);
    }
}

main();
