import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'innoventix-crm-app',
      environment: process.env.NODE_ENV || 'development',
    },
    { status: 200 }
  )
}
