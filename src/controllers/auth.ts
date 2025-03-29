import { Request, Response } from "express";
import jwt from 'jsonwebtoken';
import { createHashedPassword, verifyPassword } from "../utils/password";
import { prisma } from "../utils/prisma";

export const register = async (req: Request, res: Response) => {
    const { name, email, password, image } = req.body;
    if (!name || !email || !password || !image) {
        return res.status(400).json({ success: false, data: [], message: 'Required field missing' })
    }
    try {
        const hashedPassword = await createHashedPassword(password)
        if (typeof hashedPassword != 'string') {
            throw new Error(`Password hashing failed: ${hashedPassword}`);
        }
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                image,
                password: hashedPassword,
                role: "STUDENT",
            },
            omit: {
                password: true
            }
        });
        return res.status(200).json({ success: true, data: newUser, message: 'User Successfully Registered!' })
    } catch (error) {
        return res.status(500).json({ success: false, data: error, message: 'Internal Server Error' })
    }

}

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        if(!email || !password) return res.status(400).json({ success: false, data: [], message: 'Required Fields Missing' });

        const user = await prisma.user.findUnique({
            where: { email: email },
            include: {leaderboard: true, streak:true}
          }); 
        if (user) {
            const hashedPassword = user.password as string
            const isMatch = await verifyPassword(password, hashedPassword)
            if (isMatch) {
                const token = jwt.sign(
                    { userId: user.id, email: user.email, userTypeId: user.role },
                    process.env.JWT_SECRET!,
                    { expiresIn: '30d' }
                );
                const {password, ...userObj} = user
                Object.assign(userObj, { token: token })
                res.status(200).json({ success: true, data: userObj, message: 'User Successfully Login!' })
            }
            else {
                return res.status(404).json({ success: false, data: [], message: 'Invalid Login Credentials!' })
            }
        } else {
            return res.status(404).json({ success: false, data: [], message: 'User not found' })
        }
    } catch (error) {
        return res.status(500).json({ success: false, data: error, message: 'Internal Server Error' })
    }
}


