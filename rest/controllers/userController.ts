import { Request, Response } from "express";
import { verifyToken } from "../../lib/firebaseAdmin";
import { Prisma, User } from "@prisma/client";
import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";
import { prismaClient } from "../../lib/prismaClient";
import { generateErrorObj } from "../../lib/generateErrorObj";
import { ErrorObj } from "../../types/error.types";
import { CustomRequest } from "../../types/rest.types";

/**
 * Get user profile detail
 * @param req
 * @param res
 */
async function getUserDetail(req: Request, res: Response): Promise<void> {
  // get user id from params
  const id: string = req.params.userId;

  // get model of the user by user id
  const user: User | null = await prismaClient.user.findUnique({
    where: { id },
  });

  // throw an error if user is null
  if (!user) {
    res.status(404).json({
      user: null,
      errorObj: generateErrorObj(404, "The User is not Found"),
    });
    return;
  }

  // response the user
  res.status(200).json({ user });

  return;
}

/**
 * Get all users
 * @param req
 * @param res
 */
async function getUsers(req: Request, res: Response): Promise<void> {
  // get all users
  const users: User[] = await prismaClient.user.findMany();

  // response all user data
  res.status(200).json({ users: users });

  return;
}

/**
 * Create user with firebase token
 * @param req
 * @param res
 */
async function createUser(req: Request, res: Response): Promise<void> {
  // get firebase token from body
  const firebaseToken: string = req.body.firebaseToken;

  try {
    // get firebase user from firebase
    const currentUser: DecodedIdToken | ErrorObj = await verifyToken(
      firebaseToken
    );

    // throw an error if currentUser has an errorCode property
    if ("errorCode" in currentUser) {
      // if the token were not authorized, it response error
      res.status(currentUser.errorCode).json({
        user: null,
        errorObj: currentUser,
      });
      return;
    }

    if ("uid" in currentUser) {
      // create user
      const createdUser: User = await prismaClient.user.create({
        data: {
          firebaseId: currentUser.uid,
          username: currentUser.name,
        },
      });

      // response created user data
      res.status(200).json({ user: createdUser });

      return;
    }
  } catch (e) {
    console.error(e);

    res
      .status(404)
      .json({ errorObj: generateErrorObj(404, "Couldn't create a user") });
  }
}

/**
 * edit a user with currentUser.id who sent request
 * @param req
 * @param res
 */
async function editUser(req: CustomRequest, res: Response): Promise<void> {
  try {
    let id: string | undefined = req.currentUser?.id;

    // if the user who sent request is admin it would confirm params.userId
    if (req.currentUser?.isAdmin) {
      id = req.params.userId || req.currentUser?.id;
    }

    const data: Prisma.UserUpdateInput = req.body;

    const editedUser: User = await prismaClient.user.update({
      where: { id },
      data,
    });

    res.status(200).json({ user: editedUser });

    return;
  } catch (e) {
    console.error(e);
    res.status(404).json({
      user: null,
      errorObj: generateErrorObj(404, "The User is not Found"),
    });
  }
}

/**
 * delete a user with currentUser.id who sent request
 * @param req
 * @param res
 */
async function deleteUser(req: CustomRequest, res: Response): Promise<void> {
  try {
    let id: string | undefined = req.currentUser?.id;

    // if the user who sent request is admin it would confirm params.userId
    if (req.currentUser?.isAdmin) {
      id = req.params.userId || req.currentUser?.id;
    }

    const deletedUser: User = await prismaClient.user.delete({
      where: { id },
    });

    res.status(200).json({ user: deletedUser });

    return;
  } catch (e) {
    console.error(e);
    res.status(404).json({
      user: null,
      errorObj: generateErrorObj(404, "the user is not found"),
    });
  }
}

const userController: {
  getUsers: any;
  getUserDetail: any;
  createUser: any;
  editUser: any;
  deleteUser: any;
} = {
  getUsers,
  getUserDetail,
  createUser,
  editUser,
  deleteUser,
};

export default userController;