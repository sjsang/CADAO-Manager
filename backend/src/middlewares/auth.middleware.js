const { verifyToken } = require("../utils/jwt.js");
const db = require("../config/db");

const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader)
        return res.sendStatus(401);

    const token = authHeader.split(" ")[1];

    try {
        const decoded = verifyToken(token);

        const result = await db.query(
            `SELECT * FROM user_tokens
             WHERE token = $1
             AND expires_at > NOW()`,
            [token]
        );

        if (result.rowCount === 0)
            return res.sendStatus(401);

        req.user = decoded;

        next();

    } catch (error) {
        return res.sendStatus(403);
    }
};

module.exports = {
    authenticate
}