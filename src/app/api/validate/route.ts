import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
const schema=z.object({url:z.string().url().max(2048)});
export async function POST(req:NextRequest){
  try{
    const parsed=schema.safeParse(await req.json());
    if(!parsed.success)return NextResponse.json({valid:false,error:"A valid URL is required."},{status:400});
    const u=new URL(parsed.data.url);
    const valid=u.protocol==="https:"&&["instagram.com","www.instagram.com"].includes(u.hostname)&&/^\/(p|reel|reels|tv)\/[A-Za-z0-9_-]+\/?$/.test(u.pathname);
    return NextResponse.json({valid,previewAvailable:false,reason:valid?"The URL format is valid, but Instagram media preview and downloads are unavailable until an authorized provider is configured.":"Enter a complete Instagram post or Reel URL, including its media code."});
  }catch{return NextResponse.json({valid:false,error:"Invalid request."},{status:400});}
}
