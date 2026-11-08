import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
const schema=z.object({url:z.string().url().max(2048)});
export async function POST(req:NextRequest){try{const parsed=schema.safeParse(await req.json());if(!parsed.success)return NextResponse.json({valid:false,error:"A valid URL is required."},{status:400});const u=new URL(parsed.data.url);const valid=["instagram.com","www.instagram.com"].includes(u.hostname)&&/^\/(p|reel|reels|tv)\//.test(u.pathname)&&u.protocol==="https:";return NextResponse.json({valid,supported:valid,reason:valid?"URL format accepted; provider support must be configured separately.":"Unsupported URL."});}catch{return NextResponse.json({valid:false,error:"Invalid request."},{status:400});}}
