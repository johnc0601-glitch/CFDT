import {NextResponse} from 'next/server'
export async function GET(){return NextResponse.json({openai:Boolean(process.env.OPENAI_API_KEY),supabase:Boolean(process.env.SUPABASE_URL&&process.env.SUPABASE_SERVICE_ROLE_KEY),sanity:Boolean(process.env.SANITY_PROJECT_ID&&process.env.SANITY_DATASET&&process.env.SANITY_API_TOKEN),model:process.env.OPENAI_EXTRACTION_MODEL||'gpt-5-mini'})}
