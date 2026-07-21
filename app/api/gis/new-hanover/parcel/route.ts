import {NextRequest, NextResponse} from 'next/server'
import {resolveNewHanoverParcels} from '@/lib/gis/newHanover'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const parcelIds = request.nextUrl.searchParams.getAll('pid')
    .flatMap((value) => value.split(/[,;\n]+/))
    .map((value) => value.trim()).filter(Boolean)

  if (!parcelIds.length) {
    return NextResponse.json({error: 'Add at least one pid query parameter.'}, {status: 400})
  }
  if (parcelIds.length > 25) {
    return NextResponse.json({error: 'Use no more than 25 parcel IDs in one lookup.'}, {status: 400})
  }

  const context = await resolveNewHanoverParcels(parcelIds)
  return NextResponse.json(context, {
    status: context.status === 'unavailable' ? 404 : 200,
    headers: {'Cache-Control': 'no-store'},
  })
}
