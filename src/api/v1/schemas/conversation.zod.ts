import { z } from "zod";
import { zId } from "@zodyac/zod-mongoose";

// Accept either explicit userA/userB or participants array of exactly 2
export const CreatePairBodySchema = z.union([
  z
    .object({ userA: zId(), userB: zId() })
    .strict()
    .refine((d) => d.userA !== d.userB, {
      path: ["userB"],
      message: "userA and userB must be different",
    }),
  z
    .object({
      participants: z
        .array(zId())
        .length(2)
        .refine((arr) => new Set(arr.map(String)).size === 2, {
          path: ["participants"],
          message: "Participants must be two distinct users",
        }),
    })
    .strict(),
]);



export const CreateGroupBodySchema = z
  .object({
    name: z.string().min(1, "Group name is required"),
    participants: z.array(zId()).min(2, "At least 2 participants required"),
    admins: z.array(zId()).optional(),
    avatarUrl: z.url().optional(),
    // Some clients (e.g. form submissions) may send createdBy as an array.
    // Gracefully unwrap single-element arrays before validating as ObjectId.
    createdBy: z.preprocess((val) => (Array.isArray(val) ? val[0] : val), zId()),
  })
  .strict()
  .superRefine((data, ctx) => {
    // participants must be unique
    const pSet = new Set(data.participants.map(String))
    if (pSet.size !== data.participants.length) {
      ctx.addIssue({ code: "custom", path: ["participants"], message: "Participants must be unique" })
    }
    if (data.admins && data.admins.some((a) => !data.participants.includes(a))) {
      ctx.addIssue({
        code: "custom",
        message: "All admins must be included in participants",
        path: ["admins"],
      });
    }
    // admins must be unique
    if (data.admins) {
      const aSet = new Set(data.admins.map(String))
      if (aSet.size !== data.admins.length) {
        ctx.addIssue({ code: "custom", path: ["admins"], message: "Admins must be unique" })
      }
    }
  });

export const GetUserConversationsParamsSchema = z.object({ userId: zId() }).strict();
