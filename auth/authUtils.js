import jwt from "jsonwebtoken"

export const generateAndSendToken = (user, res) => {
	try {

		const {password , ...payload} = user;

		const token = jwt.sign( payload , process.env.SECRET_KEY , { expiresIn: "1h" } )

		res.cookie("token", token, {
			httpOnly: true,
			// secure: process.env.NODE_ENV === "production",
			secure : true,
			sameSite: "strict",
			maxAge: 60 * 60 * 1000,
		})

		return { message: "Token generated & stored in cookie", token }
	} catch (err) {
		console.error("[Error] in sendToken:", err.message)
		return {error : err.message}
	}
}