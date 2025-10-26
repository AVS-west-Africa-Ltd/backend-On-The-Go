const { 
    Post,
    Profile,
    sequelize,
    Amenity,
    Comment,
    User,
    Reaction,
    Friend
 } = require("../models");
 const { Op, fn, col, where } = require("sequelize");



exports.createPost = async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const {
        body,
        postType = "normal",
        reviewTarget = null,
        amenities = null,
      } = req.body;

      const userId = req.user;
      const profileId = req.profile.id;

      let media = [];
      if (req.files && Array.isArray(req.files)) {
        media = req.files.map((file) => file.location || file.path);
      }

      let parsedAmenities = {};

      
      if (postType === "review" && reviewTarget) {
        const profile = await Profile.findOne({
          where: { id: reviewTarget, profileType: "business" },
          transaction: t,
        });

        if (!profile) {
          await t.rollback();
          return res.status(400).json({
            message: "Sorry, only a business profile can be reviewed.",
          });
        }

        
        parsedAmenities =
          typeof amenities === "object" && !Array.isArray(amenities)
            ? amenities
            : JSON.parse(amenities || "{}");

        
        for (const key of Object.keys(parsedAmenities)) {
          const ratingValue = parsedAmenities[key];

          await Amenity.increment(
            { rating: ratingValue },
            {
              where: { businessId: reviewTarget, name: key },
              transaction: t,
            }
          );
        }
      }

      const post = await Post.create(
        {
          userId,
          profileId,
          body,
          postType,
          reviewTarget: postType === "review" ? reviewTarget : null,
          media,
          rating: postType === "review" ? parsedAmenities : {},
        },
        { transaction: t }
      );

      await t.commit();
      return res.status(201).json({ post, message: "Post created successfully!" });
    } catch (error) {
      await t.rollback();
      console.error("Error creating post:", error);
      return res.status(400).json({ message: "Sorry, something went wrong!" });
    }
};

exports.fetchPosts = async (req, res) => {
  try {
    const { offset = 0, search = "" } = req.query;

    const whereClause = {};

    
    if (search) {
      whereClause[Op.or] = [
        { body: { [Op.like]: `%${search}%` } },
      ];
    }

    const posts = await Post.findAll({
      where: whereClause,
      include: [
        {
          model: Profile,
          as: "author",
          where: search
            ? {
                userName: { [Op.like]: `%${search}%` },
              }
            : undefined,
          required: false,
        },
        {
          model: Profile,
          as: "business",
        },
      ],
      limit: 20,
      offset: parseInt(offset, 10),
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ posts, message: "Posts fetched successfully" });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(400).json({ message: "Failed to fetch posts" });
  }
};

exports.searchProfiles = async (req, res) => {
  try {
    const { 
      search = "", 
      type = "", 
      offset= 0 , 
      location="", 
      amenity="", 
      businessType 
    } = req.query;

    const query = {};
    const radius = 10000;

    if (search && search.trim() !== "") {
      query.userName= { [Op.like]: `%${search.trim()}%` };
    }
    if(type && type.trim() !== ""){
      query.profileType= { [Op.eq]: type.trim() } ;
    }

    if (businessType && businessType.trim() !== "") {
      query.businessType = { [Op.like]: `%${businessType.trim()}%` };
    }

    if (location && location.includes(",")) {
      const [lat, lng] = location.split(",").map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        query[Op.and] = where(
          fn(
            "ST_Distance_Sphere",
            col("geoLocation"),
            fn("ST_GeomFromText", `POINT(${lng} ${lat})`)
          ),
          { [Op.lte]: radius }
        );
      }
    }

    const profiles = await Profile.findAll({
      where: query,
      include: [
        {
          model: Amenity,
          as: "amenities",
          required: amenity && amenity.trim() !== "" ? true : false,
          where: amenity && amenity.trim() !== ""
            ? {
                name: {
                  [Op.eq]: `%${amenity.trim()}%`,
                },
              }
            : undefined,
        },
      ],
      limit: 20,
      offset: Number(offset) || 0,
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({profiles, message:"Fetched profiles"});
  } catch (error) {
    console.error(error);
    res.status(400).json({
      message: "Sorry something went wrong while searching profiles",
    });
  }
};

exports.viewProfiles = async (req, res) => {
  try {
   

    if (search && search.trim() !== "") {
      query.userName= { [Op.like]: `%${search.trim()}%` };
    }
    if(type && type.trim() !== ""){
      query.profileType= { [Op.eq]: type.trim() } ;
    }

    const profiles = await Profile.findAll({
      where: query,
      include: [
        {
          model: Amenity,
          as: "amenities",
        },
      ],
      limit: 20,
      offset: Number(offset) || 0,
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({profiles, message:"Fetched profiles"});
  } catch (error) {
    console.error(error);
    res.status(400).json({
      message: "Sorry something went wrong while searching profiles",
    });
  }
}

exports.makeComment = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { postId, body, parentId = null } = req.body;

    const comment = await Comment.create({ 
      postId,
      body,
      userId: req.user, 
      profileId: req.profile.id, 
      parentId
    });
    
    await Post.increment(
        {comments: 1},
        { where: { id: postId }, transaction: t }
    );
    await t.commit();
    return res.status(201).json({ comment, message: "Comment created successfully"});
  } catch (error) {
    await t.rollback();
    console.error("Create comment error:", error);
    res.status(500).json({ message: "Sorry failed to create comment" });
  }
};

exports.toggleReaction = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { targetId, targetType, type } = req.body;
    const validTargets = { comment: Comment, post: Post };
    const validReactions = ['like', 'dislike', 'love'];

    
    if (!targetId || !targetType || !type) {
      await t.rollback();
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!validTargets[targetType]) {
      await t.rollback();
      return res.status(400).json({ message: "Invalid target type" });
    }

    if (!validReactions.includes(type)) {
      await t.rollback();
      return res.status(400).json({ message: "Invalid reaction type" });
    }

    
    const existingReaction = await Reaction.findOne({
      where: {
        userId: req.user,
        targetId,
        targetType,
      },
      transaction: t,
    });

    if (existingReaction) {
      
      await existingReaction.destroy({ transaction: t });
      await validTargets[targetType].decrement(
        { likes: 1 },
        { where: { id: targetId }, transaction: t }
      );

      await t.commit();
      return res.status(200).json({ 
        message: "Reaction removed successfully" 
      });
    }
    await validTargets[targetType].increment(
      { likes: 1 },
      { where: { id: targetId }, transaction: t }
    );

    const reaction = await Reaction.create(
      {
        userId: req.user,
        profileId: req.profile.id,
        type,
        targetId,
        targetType,
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(200).json({
      message: "Reaction created successfully",
      reaction,
    });
  } catch (error) {
    console.log(error);
    await t.rollback();
    return res.status(400).json({
      message: "Sorry something went wrong! toggling reaction",
    });
  }
};

exports.followProfile = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { friendId } = req.body;

    if (friendId === req.profile.id) {
      await t.rollback();
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const existing = await Friend.findOne({
      where: {
        userId: req.user,
        ownerId: req.profile.id,
        friendId,
      },
      transaction: t,
    });

    if (existing) {
      await t.rollback();
      return res.status(400).json({ message: "Already following this profile" });
    }

    
    const friend = await Friend.create(
      {
        userId: req.user,
        ownerId: req.profile.id,
        friendId,
      },
      { transaction: t }
    );

    
    await Profile.increment('following', {
      by: 1,
      where: { id: req.profile.id },
      transaction: t,
    });

    await Profile.increment('followers', {
      by: 1,
      where: { id: friendId },
      transaction: t,
    });

    await t.commit();

    return res.status(201).json({
      message: "Followed successfully",
      friend,
    });
  } catch (error) {
    console.log(error);
    await t.rollback();
    return res.status(400).json({
      message: "Sorry something went wrong while following profile",
    });
  }
};
