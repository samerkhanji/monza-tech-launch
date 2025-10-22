import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Server, Shield, Database, Zap } from 'lucide-react';

export function ProductionDeploymentGuide() {
  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🚀 Production Deployment Guide</h1>
        <p className="text-gray-600">Step-by-step guide to deploy your Monza TECH system to production</p>
      </div>

      {/* Pre-deployment Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>Pre-deployment Checklist</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-green-600">✅ Completed</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>✓ Fixed click-blocking modal portals</li>
                <li>✓ Implemented MockAuth system</li>
                <li>✓ Restored all 50+ pages</li>
                <li>✓ Z-index hierarchy established</li>
                <li>✓ Overlay neutralizer active</li>
                <li>✓ Mobile responsive design</li>
                <li>✓ Error boundaries implemented</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-orange-600">🔄 Remaining Tasks</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>○ Set up real Supabase authentication</li>
                <li>○ Configure environment variables</li>
                <li>○ Set up production database</li>
                <li>○ Configure HTTPS/SSL certificates</li>
                <li>○ Set up automated backups</li>
                <li>○ Performance optimization</li>
                <li>○ Security audit</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authentication Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span>Authentication Setup</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">1. Replace MockAuthProvider</h4>
              <p className="text-sm text-gray-600 mb-3">
                Switch from MockAuthProvider to RealAuthProvider in your main App component:
              </p>
              <div className="bg-gray-800 text-green-400 p-3 rounded font-mono text-sm">
                <div>// In src/App-restored-complete.tsx</div>
                <div>import {'{ RealAuthProvider }'} from '@/contexts/RealAuthContext';</div>
                <div></div>
                <div>// Replace MockAuthProvider with:</div>
                <div>&lt;RealAuthProvider&gt;</div>
                <div>  {`{children}`}</div>
                <div>&lt;/RealAuthProvider&gt;</div>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">2. Configure Supabase</h4>
              <p className="text-sm text-gray-600 mb-3">
                Set up your Supabase project with proper RLS policies:
              </p>
              <ul className="text-sm space-y-1">
                <li>• Create production Supabase project</li>
                <li>• Set up user_profiles table</li>
                <li>• Configure Row Level Security (RLS)</li>
                <li>• Add email templates for auth</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Environment Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Server className="h-5 w-5 text-purple-600" />
            <span>Environment Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Production Environment Variables</h4>
              <div className="bg-gray-800 text-green-400 p-3 rounded font-mono text-sm">
                <div># .env.production</div>
                <div>VITE_SUPABASE_URL=your_production_supabase_url</div>
                <div>VITE_SUPABASE_ANON_KEY=your_production_anon_key</div>
                <div>VITE_APP_ENV=production</div>
                <div>VITE_APP_URL=https://your-domain.com</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deployment Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-orange-600" />
            <span>Deployment Options</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-blue-600 mb-2">Vercel (Recommended)</h4>
              <p className="text-sm text-gray-600 mb-3">Easy deployment with automatic HTTPS</p>
              <Badge variant="secondary">Free Tier Available</Badge>
              <div className="mt-3 text-xs space-y-1">
                <div>• Connect GitHub repository</div>
                <div>• Automatic deployments</div>
                <div>• Global CDN</div>
                <div>• Custom domains</div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-green-600 mb-2">Netlify</h4>
              <p className="text-sm text-gray-600 mb-3">Great for static sites with forms</p>
              <Badge variant="secondary">Free Tier Available</Badge>
              <div className="mt-3 text-xs space-y-1">
                <div>• Git-based deployment</div>
                <div>• Form handling</div>
                <div>• Serverless functions</div>
                <div>• A/B testing</div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-purple-600 mb-2">AWS/Azure</h4>
              <p className="text-sm text-gray-600 mb-3">Enterprise-grade infrastructure</p>
              <Badge variant="outline">Enterprise</Badge>
              <div className="mt-3 text-xs space-y-1">
                <div>• Full control</div>
                <div>• Scalability</div>
                <div>• Advanced security</div>
                <div>• Custom configurations</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Considerations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span>Security Considerations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-red-600">Critical Security Tasks</h4>
              <ul className="text-sm space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="text-red-500">🔒</span>
                  <span>Remove UserSwitcher component in production</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500">🔒</span>
                  <span>Enable RLS policies on all Supabase tables</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500">🔒</span>
                  <span>Set up proper CORS policies</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500">🔒</span>
                  <span>Configure CSP headers</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500">🔒</span>
                  <span>Set up rate limiting</span>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-green-600">Best Practices</h4>
              <ul className="text-sm space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="text-green-500">✅</span>
                  <span>Use HTTPS everywhere</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500">✅</span>
                  <span>Regular security updates</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500">✅</span>
                  <span>Backup sensitive data</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500">✅</span>
                  <span>Monitor access logs</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500">✅</span>
                  <span>Use environment variables</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Final Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-indigo-600" />
            <span>Final Production Steps</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Build Command</h4>
              <div className="bg-gray-800 text-green-400 p-3 rounded font-mono text-sm">
                <div>npm run build</div>
                <div>npm run preview  # Test production build locally</div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">🎉 Your system is ready for production!</h4>
              <p className="text-sm text-gray-600">
                Once deployed, your Monza TECH system will be a fully functional automotive management platform
                with vehicle inventory, garage operations, financial tracking, and employee management.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
