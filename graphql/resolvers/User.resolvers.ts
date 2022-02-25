import { Message, Prisma, User, Village } from "@prisma/client";
import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";
import { ErrorObj } from "../../api/types/ErrorObj";
import { verifyToken } from "../../lib/firebaseAdmin";
import { UserInputError } from "apollo-server-express";
import { TContext, UserIncludeRelations } from "../gql_types";

export const resolvers = {
  Query: {
    getMe: (
      parent: any,
      args: any,
      context: TContext,
      info: any
    ): User & { messages: Message[]; villages: Village[] } => {
      return context.currentUser;
    },

    getUsers: async (
      parent: any,
      args: any,
      context: TContext,
      info: any
    ): Promise<UserIncludeRelations[] | null> => {
      const users: UserIncludeRelations[] | null = await context.prisma.user
        .findMany({
          include: { messages: true, villages: true },
        })
        .catch((e) => {
          throw new Error("Internal Server Error");
        });

      return users;
    },

    getUserDetail: async (
      parent: any,
      { id }: { id: User["id"] },
      context: TContext,
      info: any
    ): Promise<UserIncludeRelations | null> => {
      const user: UserIncludeRelations | null = await context.prisma.user
        .findUnique({
          where: { id },
          include: { messages: true, villages: true },
        })
        .catch((e) => {
          console.error(e);
          throw new Error("Internal Server Error");
        });

      // throw an error if user is null
      if (!user) {
        throw new UserInputError("bad parameter request");
      }

      return user;
    },
  },

  Mutation: {
    createUser: async (
      parent: any,
      args: any,
      context: TContext,
      info: any
    ): Promise<UserIncludeRelations | null> => {
      // get firebase user from firebase
      const firebaseUser: DecodedIdToken | ErrorObj = await verifyToken(
        args.firebaseToken
      );
      // throw an error if firebaseUser has an errorCode property
      if ("errorCode" in firebaseUser)
        throw new UserInputError(firebaseUser.errorMessage);

      // create a user by firebase account
      const createdUser: UserIncludeRelations | null = await context.prisma.user
        .create({
          data: {
            firebaseId: firebaseUser.uid,
            username: firebaseUser.name,
          },
          include: {
            messages: true,
            villages: true,
          },
        })
        .catch((e) => {
          console.error(e);
          throw new Error("Internal Server Error");
        });

      return createdUser;
    },
    editUser: async (
      parent: any,
      { id, ...args }: { id: User["id"]; args: Prisma.UserUpdateInput },
      context: TContext,
      info: any
    ): Promise<UserIncludeRelations | void> => {
      // if the user who sent request is admin it would confirm params.userId
      if (!context.currentUser.isAdmin && context.currentUser.id !== id) {
        throw new Error("Not allowed to edit the user data");
      }

      // edit the user
      const editedUser: UserIncludeRelations | void = await context.prisma.user
        .update({
          where: { id },
          data: args,
          include: { messages: true, villages: true },
        })
        .catch((e) => {
          console.error(e);
          throw new Error("Internal Server Error");
        });

      return editedUser;
    },
    // deleteUser: async(
    //   parent: any,
    //   { id}: { id: User["id"] },
    //   context: TContext,
    //   info: any
    // ): Promise<User> =>{
    //   // if the user who sent request is admin it would confirm params.userId
    //   if (!context.currentUser.isAdmin && context.currentUser.id !== id) {
    //     throw new Error("Not allowed to edit the user data");
    //   }

    //   // edit the user
    //   const deletedUser: User = await context.prisma.user.delete({
    //     where: { id },
    //     include:{ messages:true, villages:true}
    //   });

    //   return deletedUser;
    // }
  },
};
