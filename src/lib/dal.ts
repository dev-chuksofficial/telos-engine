import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";

export async function getCurrentUser() {
  const id = await getSessionUserId();
  if (!id) return null;

  return db.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true },
  });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

// Fast check: reads the id from the signed session cookie, no database request.
export async function requireUserId() {
  const id = await getSessionUserId();
  if (!id) redirect("/login");
  return id;
}