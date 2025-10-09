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
 const { Op } = require("sequelize");


// CREATE a new post
exports.createPost = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { body, postType = "normal", reviewTarget = null, amenities = null } = req.body;

    let media = [];
    if(req.files){
        media = req.files.map(file => file.location || file.path);
    }

    let parsedAmenities; 

    if(reviewTarget || postType == "review"){
        const profile = await Profile.findOne({id: reviewTarget, profileType: "business"});
        if(!profile) {
          await t.rollback();
          return res.status().json({ mesaage: "Sorry only a business can be reviewed" });
        }
        if(amenities){
          parsedAmenities = typeof amenities === "object" && !Array.isArray(amenities)
            ? amenities
            : JSON.parse( amenities || "{}");
          Object.keys(parsedAmenities).forEach(async (key) => {
            await Amenity.increment(
              {  rating: parsedAmenities[key] },
              { where: { businessId: reviewTarget, name: key}, transaction: t }
            );
          });
        }
    }
    
    const post = await Post.create({
        userId: req.user,
        profileId: req.profile.id,
        body,
        postType,
        reviewTarget: postType == "review" ? reviewTarget : null,
        media,
        rating: postType == "review" ? parsedAmenities : {},
    }, { transaction: t });

    await t.commit();

    res.status(201).json({ post, message: "Post created successfully" });

  } catch (error) {
    await t.rollback();
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Sorry something went wrong!" });
  }
};

exports.fetchPosts = async (req, res) => {
  try {
    const { offset = 0 } = req.query;
    const posts = await Post.findAll({
      include: [
        { model: User, as: "user", attributes: ["id", "email", "firstName", "lastName"] },
        { model: Profile, as: "profile" },
        {model: Profile, as: "business"},
      ],
      limit: 20,
      offset,
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ posts, message: "Post fetched" });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ success: false, message: "Failed to fetch posts" });
  }
};

exports.searchProfiles = async (req, res) => {
  try {
    const { search = "", type = "", offset= 0 } = req.query;

    const query = {};

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
};

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
    return res.status(500).json({
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
