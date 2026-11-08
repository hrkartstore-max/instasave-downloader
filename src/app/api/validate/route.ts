import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
const schema=z.object({url:z.string().url().max(2048)});
export async function POST(req:NextRequest){
  try{
    const parsed=schema.safeParse(await req.json());
    if(!parsed.success)return NextResponse.json({valid:false,error:"A valid URL is required."},{status:400});
    const u=new URL(parsed.data.url);
    const path=u.pathname;
    const valid=u.protocol==="https:"&&["instagram.com","www.instagram.com"].includes(u.hostname)&&/^\/(p|reel|reels|tv)\/[A-Za-z0-9_-]+\/?$/.test(path);
    const mediaType=!valid?"unsupported":/^\/(reel|reels)\//.test(path)?"reel":/^\/tv\//.test(path)?"video":"post";
    return NextResponse.json({
      valid,
      mediaType,
      supportedFormats:valid?["image","video","carousel"]:[],
      previewAvailable:false,
      reason:valid
        ?"The URL format is valid. Reels, posts, videos and carousel items can be handled once an authorized media provider is configured. Carousel detection requires provider metadata."
        :"Enter a complete Instagram Reel, post or video URL, including its media code."
    });
  }catch{return NextResponse.json({valid:false,error:"Invalid request."},{status:400});}
}
