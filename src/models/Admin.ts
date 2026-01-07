import {
    Model,
    DataTypes,
    Sequelize,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
    ModelStatic,
    NonAttribute,
} from "sequelize";
import { AdminAttributes, AdminRole, AdminPermission } from "./types/admin.types";
import { Profile } from "./Profile";
import { Branch } from "./Branch";

export class Admin extends Model<
    InferAttributes<Admin>,
    InferCreationAttributes<Admin>
> implements AdminAttributes {
    declare id: CreationOptional<number>;
    declare profileId: number;
    declare branchId: number;
    declare role: AdminRole;
    declare name: string;
    declare email: string;
    declare password: string;
    declare permissions: CreationOptional<AdminPermission[]>;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    declare profile?: NonAttribute<Profile>;
    declare branch?: NonAttribute<Branch>;

    static associate(models: Record<string, ModelStatic<Model>>) {
        if (models.Profile) {
            Admin.belongsTo(models.Profile, {
                foreignKey: "profileId",
                as: "profile",
                onDelete: "CASCADE",
            });
        }

        if (models.Branch) {
            Admin.belongsTo(models.Branch, {
                foreignKey: "branchId",
                as: "branch",
                onDelete: "CASCADE",
            });
        }
    }

    static initModel(sequelize: Sequelize): ModelStatic<Admin> {
        Admin.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                },
                profileId: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    references: { model: "profiles", key: "id" },
                },
                branchId: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    references: { model: "branches", key: "id" },
                },
                role: {
                    type: DataTypes.ENUM(...Object.values(AdminRole)),
                    allowNull: false,
                },
                name: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                email: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    unique: true,
                    validate: { isEmail: true },
                },
                password: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                permissions: {
                    type: DataTypes.JSON,
                    allowNull: false,
                    defaultValue: [],
                },
                createdAt: {
                    type: DataTypes.DATE,
                    allowNull: false,
                },
                updatedAt: {
                    type: DataTypes.DATE,
                    allowNull: false,
                },
            },
            {
                sequelize,
                tableName: "admins",
                timestamps: true,
                indexes: [
                    { fields: ["email"], unique: true },
                    { fields: ["profileId"] },
                    { fields: ["branchId"] },
                ],
            }
        );

        return Admin;
    }
}

export default (sequelize: Sequelize) => Admin.initModel(sequelize);
