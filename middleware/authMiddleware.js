import jwt from "jsonwebtoken";
import runCors from "../lib/cors";

export const authMiddleware = (handler) => {
  return async (req, res) => {
    try {
      console.log(
        `[auth] ${req.method} ${req.url} origin=${req.headers.origin || ""}`
      );
    } catch (e) {
    }

    if (runCors(req, res)) return;

    try {
      const { authorization } = req.headers;
      if (!authorization) {
        return res.status(401).json({ error: "Authorization token required" });
      }

      const token = authorization.replace("Bearer ", "");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = decoded;
      return handler(req, res);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ error: "Token expired", code: "TOKEN_EXPIRED" });
      }
      return res.status(401).json({ error: "Invalid token" });
    }
  };
};
