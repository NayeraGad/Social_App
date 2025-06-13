import { postsModel, roleTypes, commentsModel } from "../../DB/models/index.js";
import { asyncHandler, cloudinary } from "../../utilities/index.js";

// ************************createComment**************************
export const createComment = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;

  // Check post
  const post = await postsModel.findOne({
    _id: postId,
    isDeleted: { $exists: false },
    isArchived: { $exists: false },
  });

  if (!post) return next(new Error("post not found", { cause: 404 }));

  // Add attachments to cloudinary if found
  if (req?.files?.length) {
    const images = [];

    for (const file of req.files) {
      const { secure_url, public_id } = await cloudinary.uploader.upload(
        file.path,
        { folder: "social_app/comments" }
      );

      images.push({ secure_url, public_id });
    }
    req.body.attachments = images;
  }

  // Create comment
  const comment = await commentsModel.create({
    ...req.body,
    postId,
    userId: req.user._id,
  });

  return res.status(201).json({ message: "done", comment });
});

// ************************updateComment**************************
export const updateComment = asyncHandler(async (req, res, next) => {
  const { postId, commentId } = req.params;

  let comment = await commentsModel
    .findOne({
      _id: commentId,
      isDeleted: { $exists: false },
      postId,
      userId: req.user._id,
    })
    .populate([{ path: "postId"}]);

  if (!comment || comment?.postId?.isDeleted || comment?.postId?.isArchived) {
    return next(new Error("Comment or post not found", { cause: 404 }));
  }

  if (req?.files?.length) {
    const images = [];

    if (comment.attachments.length !== 0) {
      for (const file of comment.attachments) {
        images.push(file.public_id);
      }

      await cloudinary.api.delete_resources(images);
    }

    const newImages = [];

    for (const file of req.files) {
      const { secure_url, public_id } = await cloudinary.uploader.upload(
        file.path,
        { folder: "social_app/comments" }
      );

      newImages.push({ secure_url, public_id });
    }
    req.body.attachments = newImages;
  }

  comment = await commentsModel.findByIdAndUpdate(commentId, req.body, {
    new: true,
  });

  return res.status(201).json({ message: "done", comment });
});

// ************************freezeComment**************************
export const freezeComment = asyncHandler(async (req, res, next) => {
  const { postId, commentId } = req.params;

  const comment = await commentsModel
    .findOne({
      _id: commentId,
      isDeleted: { $exists: false },
      postId,
    })
    .populate([{ path: "postId" }]);

  if (
    !comment ||
    (req.user.role != roleTypes.admin &&
      req.user._id.toString() != comment.userId.toString() &&
      req.user._id.toString() != comment.postId.userId.toString())
  ) {
    return next(
      new Error("Comment not found or not authorized", {
        cause: 400,
      })
    );
  }

  await commentsModel.findByIdAndUpdate(commentId, {
    isDeleted: true,
    deletedBy: req.user._id,
  });

  return res.status(201).json({ message: "done" });
});

// ************************restoreComment**************************
export const restoreComment = asyncHandler(async (req, res, next) => {
  const { postId, commentId } = req.params;

  const comment = await commentsModel
    .findOne({
      _id: commentId,
      isDeleted: { $exists: true },
      postId,
      deletedBy: req.user.id,
    })
    .populate([{ path: "postId" }]);

  if (!comment || comment?.postId?.isDeleted) {
    return next(
      new Error("Comment or post not found or not authorized", { cause: 400 })
    );
  }

  await commentsModel.findByIdAndUpdate(commentId, {
    $unset: {
      isDeleted: 0,
      deletedBy: 0,
    },
  });

  return res.status(201).json({ message: "done" });
});

// ************************reactOnComment**************************
export const reactOnComment = asyncHandler(async (req, res, next) => {
  const { postId, commentId } = req.params;

  const comment = await commentsModel
    .findOne({
      _id: commentId,
      isDeleted: { $exists: false },
      postId,
    })
    .populate([{ path: "postId" }]);

  if (!comment || comment?.postId?.isDeleted || comment?.postId?.isArchived) {
    return next(
      new Error("Comment or post not found or not authorized", { cause: 400 })
    );
  }

  const updateOperation = comment.likes.includes(req.user._id)
    ? {
        $pull: { likes: req.user._id },
      }
    : {
        $addToSet: { likes: req.user._id },
      };

  await commentsModel.findByIdAndUpdate(commentId, updateOperation, {
    new: true,
  });

  return res.status(200).json({ message: "done", comment });
});
