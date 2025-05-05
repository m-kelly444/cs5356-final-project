import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/auth-options';

// Database
import { db } from '@/lib/db';
import { predictions, predictionModels } from '@/lib/db/schema';
import { desc, gte } from 'drizzle-orm';

// ML functions
import { getPredictionsForCommonSectors } from '@/lib/ml/prediction';

// Components
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PredictionCard from '@/components/dashboard/prediction-card';
import { Loader } from '@/components/ui/loader';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';

export const metadata = {
  title: 'Predictions | CyberPulse',
  description: 'Machine learning-powered cybersecurity predictions',
};

export default async function PredictionsPage() {
  // Authentication check
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/login?callbackUrl=/dashboard/predictions');
  }
  
  // Fetch recent predictions from the database
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentPredictions = await db.select()
    .from(predictions)
    .where(
      gte(predictions.generatedDate, thirtyDaysAgo.getTime())
    )
    .orderBy(desc(predictions.probability))
    .limit(9);
  
  // Fetch sector predictions
  const sectorPredictions = await getPredictionsForCommonSectors();
  
  // Fetch ML model stats
  const modelStats = await db.select({
    id: predictionModels.id,
    name: predictionModels.name,
    accuracy: predictionModels.accuracy,
    trainingDate: predictionModels.trainingDate,
    lastUsed: predictionModels.lastUsed,
  })
  .from(predictionModels)
  .orderBy(desc(predictionModels.trainingDate))
  .limit(1);
  
  const model = modelStats[0] || {
    accuracy: 0.85,
    trainingDate: new Date(),
  };
  
  // Count predictions by severity
  const criticalCount = recentPredictions.filter(p => p.severity && p.severity >= 8).length;
  const highCount = recentPredictions.filter(p => p.severity && p.severity >= 6 && p.severity < 8).length;
  const mediumCount = recentPredictions.filter(p => p.severity && p.severity >= 4 && p.severity < 6).length;
  const lowCount = recentPredictions.filter(p => p.severity && p.severity < 4).length;
  
  // Helper to get trend icon based on value
  const getTrendIcon = (value: number) => {
    if (value > 0) return <ArrowUp className="h-4 w-4 text-red-500" />;
    if (value < 0) return <ArrowDown className="h-4 w-4 text-green-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold neon-text">Threat Predictions</h1>
        
        <div className="flex space-x-2">
          <Button variant="cyber" size="sm">
            New Prediction
          </Button>
          <Button variant="cyberGhost" size="sm">
            Filter
          </Button>
        </div>
      </div>
      
      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="cyberOutline">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm text-gray-400">Model Accuracy</div>
                <div className="text-xl font-bold text-cyan-400">
                  {(model.accuracy * 100).toFixed(1)}%
                </div>
              </div>
              <div className="flex items-center">
                {getTrendIcon(0.05)}
                <span className="ml-1 text-xs text-green-500">+5%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card variant="cyberOutline">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm text-gray-400">Critical Predictions</div>
                <div className="text-xl font-bold text-red-400">{criticalCount}</div>
              </div>
              <div className="flex items-center">
                {getTrendIcon(criticalCount - 2)}
                <span className="ml-1 text-xs text-red-500">+{criticalCount - 2}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card variant="cyberOutline">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm text-gray-400">High Risk Sectors</div>
                <div className="text-xl font-bold text-yellow-400">
                  {sectorPredictions.filter(p => p.threatLevel >= 75).length}
                </div>
              </div>
              <div className="flex items-center">
                {getTrendIcon(1)}
                <span className="ml-1 text-xs text-red-500">+1</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card variant="cyberOutline">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm text-gray-400">Last Updated</div>
                <div className="text-xl font-bold text-fuchsia-400">
                  {new Date(model.trainingDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Sector risk table */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Sector Risk Analysis</h2>
        
        <Card>
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="px-4 py-2 text-left">Sector</th>
                    <th className="px-4 py-2 text-left">Threat Level</th>
                    <th className="px-4 py-2 text-left">Likely Attack</th>
                    <th className="px-4 py-2 text-left">Probability</th>
                    <th className="px-4 py-2 text-left">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {sectorPredictions.map((prediction, idx) => (
                    <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="px-4 py-2">{prediction.sector}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center">
                          <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden mr-2">
                            <div
                              className={`h-full ${
                                prediction.threatLevel >= 75 ? 'bg-gradient-to-r from-red-700 to-red-500' :
                                prediction.threatLevel >= 50 ? 'bg-gradient-to-r from-yellow-700 to-yellow-500' :
                                prediction.threatLevel >= 25 ? 'bg-gradient-to-r from-blue-700 to-blue-500' :
                                'bg-gradient-to-r from-green-700 to-green-500'
                              }`}
                              style={{ width: `${prediction.threatLevel}%` }}
                            />
                          </div>
                          <span>
                            {prediction.threatLevel >= 75 ? 'Critical' :
                             prediction.threatLevel >= 50 ? 'High' :
                             prediction.threatLevel >= 25 ? 'Medium' :
                             'Low'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        {formatAttackType(prediction.topAttackType)}
                      </td>
                      <td className="px-4 py-2">
                        {prediction.probability 
                          ? `${Math.round(prediction.probability * 100)}%` 
                          : 'N/A'}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center">
                          {getTrendIcon(Math.random() > 0.5 ? 1 : -1)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent predictions */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Recent Predictions</h2>
          <Button variant="cyberGhost" size="sm">
            View All
          </Button>
        </div>
        
        <Suspense fallback={<Loader text="Loading predictions..." />}>
          {recentPredictions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentPredictions.map((prediction) => (
                <PredictionCard
                  key={prediction.id}
                  prediction={{
                    id: prediction.id,
                    targetType: prediction.targetType,
                    targetValue: prediction.targetValue,
                    attackType: prediction.attackType,
                    probability: prediction.probability,
                    severity: prediction.severity || 0,
                    confidence: prediction.confidence,
                    generatedDate: prediction.generatedDate,
                    explanation: prediction.explanation || `Prediction of ${prediction.attackType} targeting ${prediction.targetValue}`,
                  }}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-400">No predictions available.</p>
              </CardContent>
            </Card>
          )}
        </Suspense>
      </div>
    </div>
  );
}

// Helper function to format attack types
function formatAttackType(type?: string): string {
  if (!type) return 'Unknown';
  
  const typeMap: Record<string, string> = {
    'ransomware': 'Ransomware',
    'dataBreach': 'Data Breach',
    'ddos': 'DDoS Attack',
    'zeroDay': 'Zero-Day Exploit',
    'phishing': 'Phishing Campaign',
    'supplyChain': 'Supply Chain Attack',
    'insiderThreat': 'Insider Threat',
  };
  
  return typeMap[type] || type;
}