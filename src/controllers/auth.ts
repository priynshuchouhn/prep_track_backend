import { Request, Response } from "express";

export const login = async (req:Request,res:Response) => {
    return res.json({message: "User logged in successfully", data: [], success: true});
}
export const register = async (req:Request,res:Response) => {
    return res.json({message: "User Registered successfully", data: [], success: true});
}