import bcrypt from 'bcryptjs';
import db from '../models';
import { AdminRole } from '../models/types/admin.types';

const seedPlatformAdmin = async () => {
    try {
        console.log("Starting platform admin seed...");

        const email = 'platform-owner@onthego.com';
        const password = 'password123';
        const hashedPassword = bcrypt.hashSync(password, 10);

        // Alter table to allow nulls for branchId and businessId if they are not already
        console.log("Ensuring database schema supports platform admins...");
        await db.sequelize.query("ALTER TABLE admins MODIFY branchId INT NULL;");
        await db.sequelize.query("ALTER TABLE admins MODIFY businessId INT NULL;");

        // Check if admin already exists
        const existingAdmin = await db.Admin.findOne({ where: { email } });
        if (existingAdmin) {
            console.log(`Admin with email ${email} already exists.`);
            process.exit(0);
        }

        const admin = await db.Admin.create({
            name: 'Platform Owner',
            email,
            password: hashedPassword,
            role: AdminRole.SYSTEM_OWNER,
            businessId: null,
            branchId: null,
            permissions: [],
            createdAt: new Date(),
            updatedAt: new Date()
        });

        console.log("Platform admin created successfully!");
        console.log("Email:", admin.email);
        console.log("Password:", password);
        console.log("Role:", admin.role);

        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
};

seedPlatformAdmin();
