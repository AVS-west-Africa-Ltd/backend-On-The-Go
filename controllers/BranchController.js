const { successHandler, errorHandler } = require("../handlers/responseHandlers");
const {
    sequelize,
    Branch,
    Amenity,
    OpeningHour
} = require("../models");
const { normalizeWorkingHours } = require("../utils/working-hours");
const { createBranchSchema } = require("../validators/branch.validator");
const { Op } = require("sequelize");

exports.create = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { error, value } = createBranchSchema.validate(req.body);
        if (error) {
            await transaction.rollback();
            return res.status(400).json({ error: error.details[0].message });
        }

        const { name, fullAddress, streetAddress, isHQ, state, country, city, description, working_hours, amenities } = value;
        const profileId = req.profile.id;
        const userId = req.user;

        // Normalize working hours
        const branchWorkingHours = normalizeWorkingHours(working_hours);

        const branch = await Branch.create(
            {
                profileId,
                name,
                fullAddress,
                description,
                streetAddress,
                state,
                country,
                city,
                isHQ,
            },
            { transaction }
        );

        const branchId = branch.id;

        const workingHourEntries = Object.entries(branchWorkingHours).map(
            ([day, hours]) => ({
                businessId: profileId,
                branchId,
                dayOfWeek: day,
                openTime: hours.open,
                closeTime: hours.close
            })
        );

        await OpeningHour.bulkCreate(workingHourEntries, { transaction });

        const amenityEntries = amenities.map(name => ({
            userId,
            businessId: profileId,
            branchId,
            name
        }));

        await Amenity.bulkCreate(amenityEntries, { transaction });


        // Commit
        await transaction.commit();

        return successHandler(res, "Branch created successfully", 201, branch);


    } catch (error) {
        await transaction.rollback();
        console.error(error);
        return errorHandler(res, "Failed to create branch", 500, error);
    }
}

exports.getBranches = async (req, res) => {
    try {
        const { cursor, limit = 10, search = "" } = req.query;
        const profileId = req.profile.id;
        const userId = req.user;

         const whereClause = {
            profileId
        };

          if (cursor) {
      const [lastCreatedAt, lastId] = cursor.split("_");
      whereClause[Op.or] = [
        { createdAt: { [Op.lt]: lastCreatedAt } },
        {
          createdAt: lastCreatedAt,
          id: { [Op.lt]: lastId },
        },
      ];
    }  

        if (search) {
            whereClause.name = {
                [Op.like]: `%${search}%`
            };
        }

        const { count, rows: branches } = await Branch.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: Amenity,
                    as: "amenities",
                    where: { userId },
                    required: false
                },
                {
                    model: OpeningHour,
                    as: "openingHours",
                }
            ],
            order: [["createdAt", "DESC"], ["id", "DESC"],],
            limit: parseInt(limit, 10) + 1,
            distinct: true,
        });

          let nextCursor = null;
    if (branches.length > limit) {
      const lastBranch = branches[limit - 1];
      nextCursor = `${lastBranch.createdAt.toISOString()}_${lastBranch.id}`;
      branches.pop(); // remove extra row
    }

    return successHandler(res, "Branches fetched successfully", 200, {
      branches,
      total: count,
      nextCursor,
      limit: parseInt(limit, 10)
    });
    } catch (error) {
        console.error(error);
        return errorHandler(res, "Failed to fetch branches", 500, error);
    }
}

exports.getBranch = async (req, res) => {
    try {
        const { branchId } = req.params;
        const profileId = req.profile.id;
        const userId = req.user;

        if (!branchId) {
            return errorHandler(res, "branchId is required", 400);
        }

        const branch = await Branch.findOne({
            where: {
                id: branchId,
                profileId
            },
            include: [
                {
                    model: Amenity,
                    as: "amenities",
                    where: { userId },
                    required: false
                },
                {
                    model: OpeningHour,
                    as: "openingHours",
                }
            ],
        });

        if (!branch) {
            return errorHandler(res, "Branch not found", 404);
        }

        return successHandler(res, "Branch fetched successfully", 200, branch);
    } catch (error) {
        console.error(error);
        return errorHandler(res, "Failed to fetch branch", 500, error);
    }
}


exports.deleteBranch = async (req, res) => {
  try {
    const { branchId } = req.params;
    const profileId = req.profile.id;

    const branch = await Branch.findOne({
      where: {
        id: branchId,
        profileId,
      },
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found.",
      });
    }

    // considering other linked data, should soft delete be used instead?
    await branch.destroy();

    return successHandler(res, "Branch deleted successfully", 200);
  } catch (error) {
    console.error("Failed to delete branch:", error);
    return errorHandler(res, "Something went wrong while deleting the branch", 500, error);
  }
};
