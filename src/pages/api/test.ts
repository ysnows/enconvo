import { AuthenticatedRequest, withAuth } from "@/utils/auth";
import { createSuperClient } from "@/utils/supabase/server";
import { NextApiResponse } from "next";
import { Redis } from "@upstash/redis";


async function handler(req: AuthenticatedRequest, res: NextApiResponse) {


    const supabase = await createSuperClient();
    console.time("test")

    const { data, error } = await supabase
        .from("subscription")
        .select("*")
        .eq("email", req.user.email);

    console.timeEnd("test")

    res.status(200).json({ user: req.user, data, error })
}


export default withAuth(handler)