import Post from "../models/PostModel.js";

export const upvotePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    // Check if user already upvoted
    if (post.upvotes.includes(userId)) {
      return res.status(400).json({ success: false, message: "You have already upvoted this post" });
    }

    // Add the user to the upvotes array
    post.upvotes.push(userId);
    await post.save();

    return res.json({ success: true, upvotes: post.upvotes.length });
  } catch (error) {
    console.error("Upvote error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};