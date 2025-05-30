import { Request, Response } from "express";
import { saveClimbingMovement, saveOngoingMovement } from "./movement.service";
import ongoingMovementModel from "./ongoingMovement.model";
import climbingMovementModel from "./climbingMovement.model";
import { InstantMovement } from "../instantMovement/instantMovement.model";


export const postOngoingMovement = async (req: Request, res: Response) => {
  try {
    const { date, distance } = req.body;
    const userId = (req as any).user?._id;

    if (!userId || !date || typeof distance !== "number") {
      return res.status(400).json({ message: "Invalid input." });
    }

    const data = await saveOngoingMovement({ userId, date, distance });
    return res.status(200).json({ message: "Ongoing movement saved", data });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err });
  }
};

export const postClimbingMovement = async (req: Request, res: Response) => {
  try {
    const { date, distance } = req.body;
    const userId = (req as any).user?._id;

    if (!userId || !date || typeof distance !== "number") {
      return res.status(400).json({ message: "Invalid input." });
    }

    const data = await saveClimbingMovement({ userId, date, distance });
    return res.status(200).json({ message: "Climbing movement saved", data });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err });
  }
};



export const getAllMovements = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { date } = req.query;

    const filter = {
      userId,
      ...(date ? { date: date as string } : {}),
    };

    const [ongoingMovements, climbingMovements, instantMovements] = await Promise.all([
      ongoingMovementModel.find(filter),
      climbingMovementModel.find(filter),
      InstantMovement.find(filter),
    ]);

    const trackingRunningMovements = instantMovements.filter(m => m.type === "run");
    const trackingClimbs = instantMovements.filter(m => m.type === "climb");

    return res.status(200).json({
      ongoingMovements,
      climbingMovements,
      trackingRunningMovements,
      trackingClimbs,
    });
  } catch (error) {
    console.error("Error fetching movement data:", error);
    return res.status(500).json({ message: "Failed to fetch movement data" });
  }
};
