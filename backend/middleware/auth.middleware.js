// middlewares/verifyToken.js
import jwt from "jsonwebtoken";
import User from "../model/user.model.js";

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Khong co token hoac token khong hop le" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.id) {
      return res.status(401).json({ message: "Token khong hop le" });
    }

    const user = await User.findById(decoded.id).select("_id name email role");
    if (!user) {
      return res.status(401).json({ message: "Tai khoan khong ton tai" });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: "Token het han hoac khong hop le" });
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Ban khong co quyen admin!" });
  }
};

export const isAdminOrStaff = (req, res, next) => {
  if (req.user && ["admin", "manager"].includes(req.user.role)) {
    return next();
  }

  return res.status(403).json({ message: "Ban khong co quyen truy cap!" });
};
