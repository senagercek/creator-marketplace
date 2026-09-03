import { appRouter } from "../src/server/trpc/root";
import { db } from "../src/server/db";
import { type User } from "../src/server/db/schema";

export const mockAdmin: User = {
  id: "usr_admin",
  email: "admin@marketplace.com",
  name: "Sarah Jenkins (Admin)",
  role: "admin",
  createdAt: new Date(),
};

export const mockCreator1: User = {
  id: "usr_creator_1",
  email: "alex@creator.com",
  name: "Alex Rivers",
  role: "creator",
  createdAt: new Date(),
};

export const mockCreator2: User = {
  id: "usr_creator_2",
  email: "jordan@creator.com",
  name: "Jordan Lee",
  role: "creator",
  createdAt: new Date(),
};

export function createCallerForUser(user: User | null) {
  return appRouter.createCaller({
    db,
    user,
    headers: new Headers(),
  });
}
