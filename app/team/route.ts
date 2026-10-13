import { NextRequest, NextResponse } from 'next/server'

/**
 * Route handler: Redirect /team to /settings/team preserving all query params (e.g. ?action=invite or ?invite=1)
 * Fulfills Prompt 43 & Prompt 56 live verification constraint:
 * "/team?action=invite either redirects or shows the dialog; it must not show a raw 404 page."
 */
export async function GET(request: NextRequest) {
  const { search } = request.nextUrl
  return new NextResponse(null, {
    status: 307,
    headers: {
      Location: `/settings/team${search || ''}`,
    },
  })
}

