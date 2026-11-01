"use server";

import { hash, compare } from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/session";
import type { FormState } from "@/types/auth";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

const SERVER_ERROR = "Something went wrong. Please check your connection and try again.";

export async function register(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { name, email, password } = parsed.data;
  let userId: string;

  try {
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "An account with this email already exists." };
    }

    const user = await db.user.create({
      data: { name, email, passwordHash: await hash(password, 12) },
    });
    userId = user.id;
  } catch (err) {
    console.error("Register error:", err);
    return { error: SERVER_ERROR };
  }

  await createSession(userId);
  redirect("/dashboard");
}

export async function login(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { email, password } = parsed.data;
  let userId: string;

  try {
    const user = await db.user.findUnique({ where: { email } });
    const valid = user ? await compare(password, user.passwordHash) : false;

    if (!user || !valid) {
      return { error: "Invalid email or password." };
    }
    userId = user.id;
  } catch (err) {
    console.error("Login error:", err);
    return { error: SERVER_ERROR };
  }

  await createSession(userId);
  redirect("/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}