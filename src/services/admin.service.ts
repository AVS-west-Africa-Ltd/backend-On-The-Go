import { Admin } from "../models/Admin";
import { AdminAttributes, AdminRole, AdminPermission } from "../models/types/admin.types";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwtUtil";
import { Profile } from "../models/Profile";

export class AdminService {
    static async login(payload: any) {
        const { email, password } = payload;

        const admin = await Admin.findOne({ where: { email } });
        if (!admin) {
            throw new Error("Invalid email or password");
        }

        const isPasswordValid = bcrypt.compareSync(password, admin.password);
        if (!isPasswordValid) {
            throw new Error("Invalid email or password");
        }

        const token = generateToken({
            admin: {
                id: admin.id,
                profileId: admin.profileId,
                branchId: admin.branchId,
                role: admin.role,
                permissions: admin.permissions || [],
                name: admin.name,
                email: admin.email
            },
            profile: { id: admin.profileId, type: null },
            branch: admin.branchId,
            user: admin.userId
        } as any);

        const adminPlain = admin.get({ plain: true }) as any;
        delete adminPlain.password;

        return { admin: adminPlain, token };
    }

    static async createAdmin(payload: any, profileId: number) {
        const { name, email, password, role, branchId, permissions } = payload;

        const isExist = await Admin.findOne({ where: { email } });
        if (isExist) {
            throw new Error("Admin email already exists!");
        }

        const profileExists = await Profile.findOne({ where: { id: profileId } });
        if (!profileExists) {
            throw new Error("Profile not found!");
        }

        const hashedPassword = bcrypt.hashSync(password, 10);

        const admin = await Admin.create({
            name,
            email,
            password: hashedPassword,
            role,
            userId: profileExists.userId,
            profileId,
            branchId,
            permissions: permissions || []
        });

        const adminPlain = admin.get({ plain: true }) as any;
        delete adminPlain.password;
        return adminPlain;
    }

    static async getAdmins(profileId: number, branchId?: number) {
        const where: any = { profileId };
        if (branchId) {
            where.branchId = branchId;
        }

        const admins = await Admin.findAll({
            where,
            attributes: { exclude: ["password"] }
        });
        return admins;
    }

    static async getAdminById(id: number, profileId: number) {
        const admin = await Admin.findOne({
            where: { id, profileId },
            attributes: { exclude: ["password"] }
        });

        if (!admin) {
            throw new Error("Admin not found!");
        }

        return admin;
    }

    static async updateAdmin(id: number, profileId: number, data: Partial<AdminAttributes>) {
        const admin = await Admin.findOne({ where: { id, profileId } });
        if (!admin) {
            throw new Error("Admin not found!");
        }

        // Avoid updating sensitive fields here if needed, or handle them specifically
        const { password, ...updateData } = data;

        if (password) {
            (updateData as any).password = bcrypt.hashSync(password, 10);
        }

        await admin.update(updateData);

        const updatedAdmin = admin.get({ plain: true }) as any;
        delete updatedAdmin.password;
        return updatedAdmin;
    }

    static async deleteAdmin(id: number, profileId: number) {
        const admin = await Admin.findOne({ where: { id, profileId } });
        if (!admin) {
            throw new Error("Admin not found!");
        }

        if (admin.role === AdminRole.SUPER_ADMIN) {
            throw new Error("Cannot delete a Super Admin!");
        }

        await admin.destroy();
        return true;
    }

    static async updateRole(id: number, profileId: number, role: AdminRole) {
        const admin = await Admin.findOne({ where: { id, profileId } });
        if (!admin) {
            throw new Error("Admin not found!");
        }

        await admin.update({ role });
        return admin;
    }

    static async updatePermissions(id: number, profileId: number, permissions: AdminPermission[]) {
        const admin = await Admin.findOne({ where: { id, profileId } });
        if (!admin) {
            throw new Error("Admin not found!");
        }

        await admin.update({ permissions });
        return admin;
    }

    static async getAllPermissions() {
        return Object.values(AdminPermission);
    }

    static async getAllRoles() {
        return Object.values(AdminRole);
    }
}
