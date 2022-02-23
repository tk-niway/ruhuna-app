import { Request } from "express";
import { loadFilesSync } from "@graphql-tools/load-files";
import { mergeResolvers, mergeTypeDefs } from "@graphql-tools/merge";
import { ApolloServer } from "apollo-server-express";
import { ExpressContext } from "apollo-server-express";
import { prismaClient } from "../lib/prismaClient";
import { join } from "path";
import { authentication } from "./middlewares/authentication";
import { User } from "@prisma/client";

// merge types
const typesArray: any[] = loadFilesSync(
  join(__dirname, "/schemas/**/*.graphql")
);

// merge resolvers
const resolversArray: any[] = loadFilesSync(
  join(__dirname, "/resolvers/**/*.resolvers.*")
);

export const apolloServer: ApolloServer<ExpressContext> = new ApolloServer({
  typeDefs: mergeTypeDefs(typesArray),
  resolvers: mergeResolvers(resolversArray),
  context: async ({ req }: { req: Request }) => {
    const currentUser: User = await authentication(req);
    return {
      prismaClient,
      currentUser,
    };
  },
});