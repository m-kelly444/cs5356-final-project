// app/api/predict/route.ts
export const runtime = 'nodejs'; // 🔒 Force Node.js runtime

import { getPredictionsForCommonSectors } from '@/lib/ml/prediction';

export async function GET() {
  try {
    const data = await getPredictionsForCommonSectors();
    return Response.json({ success: true, data });
  } catch (error) {
    return Response.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
