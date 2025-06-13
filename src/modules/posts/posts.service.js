import { commentsModel, postsModel, roleTypes, usersModel } from "../../DB/models/index.js";
import { asyncHandler, cloudinary } from "../../utilities/index.js";

// ************************createPost**************************
export const createPost = asyncHandler(async (req, res, next) => {
  if (req?.files?.length) {
    const images = [];

    for (const file of req.files) {
      const { secure_url, public_id } = await cloudinary.uploader.upload(
        file.path,
        { folder: "social_app/posts" }
      );

      images.push({ secure_url, public_id });
    }
    req.body.attachments = images;
  }

  const post = await postsModel.create({ ...req.body, userId: req.user._id });

  return res.status(201).json({ message: "done", post });
});

// ************************updatePost**************************
export const updatePost = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  let post = await postsModel.findOne({
    _id: id,
    isDeleted: { $exists: false },
    userId: req.user._id,
  });

  if (!post) {
    return next(new Error("Post not found", { cause: 404 }));
  }

  if (req?.files?.length) {
    if (post.attachments.length !== 0) {
      const images = [];

      for (const file of post.attachments) {
        images.push(file.public_id);
      }

      await cloudinary.api.delete_resources(images);
    }

    const newImages = [];

    for (const file of req.files) {
      const { secure_url, public_id } = await cloudinary.uploader.upload(
        file.path,
        { folder: "social_app/posts" }
      );

      newImages.push({ secure_url, public_id });
    }
    req.body.attachments = newImages;
  }

  post = await postsModel.findByIdAndUpdate(id, req.body, { new: true });

  return res.status(201).json({ message: "done", post });
});

// ************************freezePost**************************
export const freezePost = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const condition =
    req.user.role === roleTypes.admin ? {} : { userId: req.user._id };

  const post = await postsModel.findOneAndUpdate(
    {
      _id: id,
      isDeleted: { $exists: false },
      ...condition,
    },
    { isDeleted: true, deletedBy: req.user._id }
  );

  if (!post) {
    return next(new Error("Post not found or not authorized", { cause: 404 }));
  }

  return res.status(200).json({ message: "done" });
});

// ************************restorePost**************************
export const restorePost = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const post = await postsModel.findOneAndUpdate(
    {
      _id: id,
      isDeleted: { $exists: true },
      deletedBy: req.user._id,
    },
    {
      $unset: {
        isDeleted: 0,
        deletedBy: 0,
      },
    }
  );

  if (!post) {
    return next(new Error("Post not found or not authorized", { cause: 404 }));
  }

  await commentsModel.updateMany(
    { postId: id },
    {
      $unset: {
        isDeleted: 0,
        deletedBy: 0,
      },
    }
  );

  return res.status(200).json({ message: "done" });
});

// ************************undoPost**************************
export const undoPost = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  let post = await postsModel.findOne({
    _id: id,
    isDeleted: { $exists: false },
    userId: req.user._id,
  });

  if (!post) {
    return next(new Error("Post not found or not authorized", { cause: 404 }));
  }

  if (Date.now() - post.createdAt > 2 * 60 * 1000) {
    return next(new Error("cannot undo post after 2 minutes", { cause: 400 }));
  }

  if (post.attachments.length) {
    const images = [];

    for (const file of post.attachments) {
      images.push(file.public_id);
    }

    await cloudinary.api.delete_resources(images);
  }

  await postsModel.findByIdAndDelete(id);

  return res.status(200).json({ message: "done" });
});

// ************************reactOnPost**************************
export const reactOnPost = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const post = await postsModel.findOne({
    _id: id,
    isDeleted: { $exists: false },
    likes: { $in: [req.user._id] },
  });

  let updatedPost;

  if (post) {
    updatedPost = await postsModel.findOneAndUpdate(
      {
        _id: id,
        isDeleted: { $exists: false },
      },
      {
        $pull: { likes: req.user._id },
      },
      { new: true }
    );
  } else {
    updatedPost = await postsModel.findOneAndUpdate(
      {
        _id: id,
        isDeleted: { $exists: false },
      },
      {
        $addToSet: { likes: req.user._id },
      },
      { new: true }
    );
  }

  if (!updatedPost) {
    return next(new Error("Post not found", { cause: 404 }));
  }

  return res.status(200).json({ message: "done", updatedPost });
});

// ************************archivePost**************************
export const archivePost = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const post = await postsModel.findOne({
    _id: id,
    userId: req.user._id,
    isDeleted: { $exists: false },
    isArchived: { $exists: false },
  });

  if (!post) {
    return next(new Error("Post not found or not authorized", { cause: 404 }));
  }

  if (Date.now() - post.createdAt.getTime() < 24 * 60 * 60 * 1000) {
    return next(
      new Error("cannot archive post before 24 hours have passed", {
        cause: 404,
      })
    );
  }

  await postsModel.findByIdAndUpdate(id, { isArchived: true }, { new: true });

  return res.status(200).json({ message: "done", result: "archived" });
});

// ************************unarchivePost**************************
export const unarchivePost = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const post = await postsModel.findOne({
    _id: id,
    userId: req.user._id,
    isDeleted: { $exists: false },
    isArchived: { $exists: true },
  });

  if (!post) {
    return next(new Error("Post not found or not authorized", { cause: 404 }));
  }

  await postsModel.findByIdAndUpdate(id, { $unset: { isArchived: 0 } });

  return res.status(200).json({ message: "done", result: "not archived" });
});

// ************************getUserPosts**************************
export const getUserPosts = asyncHandler(async (req, res, next) => {
  const posts = await postsModel
    .find({
      userId: req.user._id,
      isDeleted: { $exists: false },
      isArchived: { $exists: false },
    })
    .populate([
      { path: "comments", select: "-_id -postId content attachments" },
    ]);

  if (posts.length === 0) {
    return next(new Error("No post added yet", { cause: 404 }));
  }

  return res.status(200).json({ message: "done", posts });
});

// ************************getFriendsPosts**************************
export const getFriendsPosts = asyncHandler(async (req, res, next) => {
  const posts = await postsModel
    .find({
      userId: { $in: req.user.friends },
      isDeleted: { $exists: false },
      isArchived: { $exists: false },
    })
    .populate([
      { path: "userId", select: "name email -_id" },
      { path: "comments", select: "-_id -postId content attachments" },
    ]);

  if (posts.length === 0) {
    return next(new Error("No posts found", { cause: 404 }));
  }

  return res.status(200).json({ message: "done", posts });
});

// ************************getSpecificUsersPosts**************************
export const getSpecificUsersPosts = asyncHandler(async (req, res, next) => {
  let { userIds } = req.query;

  userIds = Array.isArray(userIds) ? userIds : [userIds];

  const blockedUsers = await usersModel
    .find({
      _id: { $in: userIds },
      blockedUsers: req.user._id,
    })
    .select("_id");

  const blockedUserIds = blockedUsers.map((user) => user._id.toString());

  const allowedUsers = userIds.filter((id) => !blockedUserIds.includes(id));

  const posts = await postsModel
    .find({
      userId: { $in: allowedUsers },
      isDeleted: { $exists: false },
      isArchived: { $exists: false },
    })
    .populate([
      { path: "userId", select: "name email -_id" },
      { path: "comments", select: "-_id -postId content attachments" },
    ]);

  if (posts.length === 0) {
    return next(new Error("No posts found", { cause: 404 }));
  }

  return res.status(200).json({ message: "done", posts });
});
