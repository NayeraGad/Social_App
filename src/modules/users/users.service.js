import { profileViewModel, usersModel } from "../../DB/models/index.js";
import {
  asyncHandler,
  cloudinary,
  Compare,
  Decrypt,
  Encrypt,
  eventEmitter,
  Hash,
} from "../../utilities/index.js";

// ************************updateProfile**************************
export const updateProfile = asyncHandler(async (req, res, next) => {
  if (req.body.phone) {
    req.body.phone = await Encrypt({ key: req.body.phone });
  }

  if (req?.file) {
    // Delete previous saved image
    await cloudinary.uploader.destroy(req.user.image.public_id);

    // Save new image
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      {
        folder: "social_app/users",
      }
    );

    req.body.image = { secure_url, public_id };
  }

  const user = await usersModel.findByIdAndUpdate(req.user._id, req.body, {
    new: true,
  });

  return res.status(200).json({ message: "done", user });
});

// ************************updatePassword**************************
export const updatePassword = asyncHandler(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  if (!(await Compare({ key: oldPassword, hashed: req.user.password }))) {
    return next(new Error("Incorrect password", { cause: 400 }));
  }

  const password = await Hash({ key: newPassword });

  await usersModel.findByIdAndUpdate(req.user._id, {
    password,
    changePasswordAt: Date.now(),
  });

  return res.status(200).json({ message: "done" });
});

// ************************getProfile**************************
export const getProfile = asyncHandler(async (req, res, next) => {
  const user = await usersModel
    .findById(req.user._id)
    .populate([{ path: "friends" }]);

  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }

  return res.status(200).json({ message: "done", user });
});

// ************************viewProfile**************************
export const viewProfile = asyncHandler(async (req, res, next) => {
  const { id: viewerId } = req.user;
  const { id: viewedProfileId } = req.params;

  if (viewerId === viewedProfileId) {
    req.user.phone = await Decrypt({ key: req.user.phone });
    return res.status(200).json({
      message: "done",
      user: {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        gender: req.user.gender,
        image: req.user.image.secure_url,
      },
    });
  }

  const user = await usersModel.findById(viewedProfileId);

  if (!user) return next(new Error("User not found", { cause: 404 }));

  if (user.blockedUsers.includes(viewerId)) {
    // If user is blocked by the other user
    return next(new Error("cannot view this profile", { cause: 403 }));
  }

  let profile = await profileViewModel.findOne({ viewerId, viewedProfileId });

  if (!profile) {
    profile = await profileViewModel.create({
      viewerId,
      viewedProfileId,
      totalViews: 1,
      viewedAt: [Date.now()],
    });
  } else {
    if (profile.viewedAt.length >= 5) {
      profile.viewedAt.shift(); // Remove the oldest entry
    }

    profile.totalViews += 1; // Add new view
    profile.viewedAt.push(Date.now()); // Add new view date

    if (profile.totalViews > 5) {
      eventEmitter.emit("viewProfile", {
        viewer: req.user.name,
        viewedProfileId,
        viewsArray: profile.viewedAt,
      });
    }
  }

  await profile.save();

  return res.status(200).json({
    message: "done",
    warning: `profile view has been recorded`,
    user: {
      name: user.name,
      email: user.email,
      gender: user.gender,
      image: user.image.secure_url,
    },
  });
});

// ************************blockUser**************************
export const blockUser = asyncHandler(async (req, res, next) => {
  const { email, blockedUsers } = req.user;
  const { email: blockedEmail } = req.body;

  if (email === blockedEmail) {
    return next(new Error("You cannot block yourself", { cause: 400 }));
  }

  const { _id: blockedId } = await usersModel.findOne({ email: blockedEmail });

  if (blockedUsers.includes(blockedId)) {
    return next(new Error("Email blocked already", { cause: 409 }));
  }

  blockedUsers.push(blockedId);
  req.user.save();

  return res.status(200).json({ message: "done", user: req.user });
});

// ************************unblockUser**************************
export const unblockUser = asyncHandler(async (req, res, next) => {
  const { blockedUsers } = req.user;
  const { email: blockedEmail } = req.body;

  const { _id: blockedId } = await usersModel.findOne({ email: blockedEmail });

  if (!blockedUsers.includes(blockedId)) {
    return next(new Error("Email not blocked", { cause: 400 }));
  }

  blockedUsers.splice(blockedUsers.indexOf(blockedId), 1);
  req.user.save();

  return res.status(200).json({ message: "done" });
});

// ************************updateEmailRequest**************************
export const updateEmailRequest = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (await usersModel.findOne({ email })) {
    return next(new Error("Email already exists", { cause: 409 }));
  }

  await usersModel.findByIdAndUpdate(
    req.user._id,
    {
      tempEmail: email,
    },
    { new: true }
  );

  // Send otp
  eventEmitter.emit("confirmEmail", { email: req.user.email });
  eventEmitter.emit("confirmNewEmail", { email, _id: req.user._id });

  return res.status(200).json({ message: "done" });
});

// ************************updateEmail**************************
export const updateEmail = asyncHandler(async (req, res, next) => {
  const { oldCode, newCode } = req.body;
  const { _id, tempEmail, otpEmail, otpNewEmail } = req.user;

  const user = await usersModel.findOne({
    _id,
    isDeleted: false,
  });

  if (!(await Compare({ key: oldCode, hashed: otpEmail }))) {
    return next(new Error("Invalid old code", { cause: 400 }));
  }

  if (!(await Compare({ key: newCode, hashed: otpNewEmail }))) {
    return next(new Error("Invalid new code", { cause: 400 }));
  }

  await usersModel.findByIdAndUpdate(_id, {
    email: tempEmail,
    changePasswordAt: Date.now(),
    $unset: {
      tempEmail: 0,
      otpEmail: 0,
      otpNewEmail: 0,
    },
  });

  return res.status(200).json({ message: "done", user });
});

// ************************toggleFriend**************************
export const toggleFriend = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const user = await usersModel.findOneAndUpdate(
    {
      _id: id,
      isDeleted: false,
      blockedUsers: { $nin: [req.user._id] },
    },
    { $addToSet: { friends: req.user._id } }
  );

  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }

  const updateOperation = req.user.friends.includes(id)
    ? {
        $pull: { friends: user._id },
      }
    : {
        $addToSet: { friends: user._id },
      };

  const userFriends = await usersModel
    .findByIdAndUpdate(req.user._id, updateOperation, { new: true })
    .select("friends");

  return res.status(201).json({ message: "done", userFriends });
});
