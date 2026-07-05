import jwt from "jsonwebtoken"

export const generateAndSendToken = (user, res) => {
	try {

		const userObj = user._doc || (typeof user.toObject === 'function' ? user.toObject() : user);
		const { password, ...payload } = userObj;

		const token = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: "1h" })

		// =========== working code ===========
		// res.cookie("token", token, {
		// 	httpOnly: true,
		// 	// secure: process.env.NODE_ENV === "production",
		// 	secure: true,
		// 	sameSite: "strict",
		// 	maxAge: 60 * 60 * 1000,
		// })

		res.cookie("token", token, {
			httpOnly: true,
			// secure: process.env.NODE_ENV === "production",
			secure: true,
			sameSite: "none",
			maxAge: 60 * 60 * 1000,
		})

		const userRole = user?.role
		res.cookie("role", userRole, {
			httpOnly: true,
			// secure: process.env.NODE_ENV === "production",
			secure: true,
			sameSite: "none",
			maxAge: 60 * 60 * 1000,
		})


		return { message: "Token generated & stored in cookie", token }
	} catch (err) {
		console.error("[Error] in sendToken:", err.message)
		return { error: err.message }
	}
}