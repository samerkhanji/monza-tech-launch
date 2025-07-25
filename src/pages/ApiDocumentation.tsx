
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Key, Shield, Database } from 'lucide-react';

const ApiDocumentation = () => {
  const endpoints = [
    {
      category: 'Car Inventory',
      endpoints: [
        {
          method: 'GET',
          path: '/api/car-inventory',
          description: 'Get all cars in inventory',
          params: 'None',
          response: 'Array of car objects'
        },
        {
          method: 'GET',
          path: '/api/car-inventory/{id}',
          description: 'Get a specific car by ID',
          params: 'id: UUID',
          response: 'Car object'
        },
        {
          method: 'POST',
          path: '/api/car-inventory',
          description: 'Add a new car to inventory',
          params: 'Car data object',
          response: 'Created car object'
        },
        {
          method: 'PUT',
          path: '/api/car-inventory/{id}',
          description: 'Update car information',
          params: 'id: UUID, update data',
          response: 'Updated car object'
        },
        {
          method: 'DELETE',
          path: '/api/car-inventory/{id}',
          description: 'Remove car from inventory',
          params: 'id: UUID',
          response: 'Success message'
        }
      ]
    },
    {
      category: 'Garage Operations',
      endpoints: [
        {
          method: 'GET',
          path: '/api/garage-cars',
          description: 'Get all cars in garage',
          params: 'None',
          response: 'Array of garage car objects'
        },
        {
          method: 'POST',
          path: '/api/garage-cars',
          description: 'Add car to garage',
          params: 'Garage car data',
          response: 'Created garage car object'
        },
        {
          method: 'PUT',
          path: '/api/garage-cars/{id}/status',
          description: 'Update car status in garage',
          params: 'id: UUID, status: string',
          response: 'Updated garage car object'
        }
      ]
    },
    {
      category: 'Inventory Management',
      endpoints: [
        {
          method: 'GET',
          path: '/api/inventory',
          description: 'Get all inventory items',
          params: 'location (optional)',
          response: 'Array of inventory items'
        },
        {
          method: 'POST',
          path: '/api/inventory',
          description: 'Add new inventory item',
          params: 'Inventory item data',
          response: 'Created inventory item'
        },
        {
          method: 'PUT',
          path: '/api/inventory/{id}',
          description: 'Update inventory item',
          params: 'id: UUID, update data',
          response: 'Updated inventory item'
        }
      ]
    },
    {
      category: 'Sales & Analytics',
      endpoints: [
        {
          method: 'GET',
          path: '/api/sales',
          description: 'Get sales data',
          params: 'start_date, end_date (optional)',
          response: 'Array of sales records'
        },
        {
          method: 'POST',
          path: '/api/sales',
          description: 'Add sales record',
          params: 'Sales data object',
          response: 'Created sales record'
        }
      ]
    },
    {
      category: 'Notifications',
      endpoints: [
        {
          method: 'GET',
          path: '/api/notifications',
          description: 'Get user notifications',
          params: 'user_id (optional)',
          response: 'Array of notifications'
        },
        {
          method: 'POST',
          path: '/api/notifications',
          description: 'Create notification',
          params: 'Notification data',
          response: 'Created notification'
        },
        {
          method: 'PUT',
          path: '/api/notifications/{id}/read',
          description: 'Mark notification as read',
          params: 'id: UUID',
          response: 'Updated notification'
        }
      ]
    }
  ];

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800';
      case 'POST': return 'bg-blue-100 text-blue-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Code className="h-6 w-6 text-monza-yellow" />
        <h1 className="text-3xl font-bold text-monza-black">API Documentation</h1>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="authentication">Authentication</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Monza Automotive API
              </CardTitle>
              <CardDescription>
                RESTful API for managing automotive inventory, garage operations, and business analytics.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Base URL</h3>
                <code className="bg-gray-100 px-3 py-1 rounded text-sm">
                  https://wunqntfreyezylvbzvxc.supabase.co/rest/v1
                </code>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Content Type</h3>
                <code className="bg-gray-100 px-3 py-1 rounded text-sm">
                  application/json
                </code>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Features</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Complete CRUD operations for all data entities</li>
                  <li>API key authentication for secure access</li>
                  <li>Real-time data synchronization</li>
                  <li>Comprehensive error handling</li>
                  <li>Rate limiting and usage tracking</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="authentication">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Authentication
              </CardTitle>
              <CardDescription>
                All API requests require a valid API key for authentication.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">API Key Header</h3>
                <code className="bg-gray-100 px-3 py-1 rounded text-sm block">
                  Authorization: Bearer YOUR_API_KEY
                </code>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">API Key Format</h3>
                <p className="text-sm text-gray-600 mb-2">
                  API keys start with <code className="bg-gray-100 px-1 py-0.5 rounded">mk_</code> followed by 64 hexadecimal characters.
                </p>
                <code className="bg-gray-100 px-3 py-1 rounded text-sm text-xs block">
                  mk_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
                </code>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Error Responses</h3>
                <div className="space-y-2">
                  <div className="bg-red-50 p-3 rounded border-l-4 border-red-500">
                    <code className="text-sm">401 Unauthorized - Missing or invalid API key</code>
                  </div>
                  <div className="bg-red-50 p-3 rounded border-l-4 border-red-500">
                    <code className="text-sm">403 Forbidden - API key lacks required permissions</code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endpoints">
          <div className="space-y-6">
            {endpoints.map((category, categoryIndex) => (
              <Card key={categoryIndex}>
                <CardHeader>
                  <CardTitle>{category.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {category.endpoints.map((endpoint, endpointIndex) => (
                      <div key={endpointIndex} className="border rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={getMethodColor(endpoint.method)}>
                            {endpoint.method}
                          </Badge>
                          <code className="text-sm font-mono">{endpoint.path}</code>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{endpoint.description}</p>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="font-semibold">Parameters:</span>
                            <p className="text-gray-600">{endpoint.params}</p>
                          </div>
                          <div>
                            <span className="font-semibold">Response:</span>
                            <p className="text-gray-600">{endpoint.response}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="examples">
          <Card>
            <CardHeader>
              <CardTitle>Code Examples</CardTitle>
              <CardDescription>
                Sample requests and responses for common API operations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">JavaScript/Fetch</h3>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`// Get all cars in inventory
fetch('https://wunqntfreyezylvbzvxc.supabase.co/rest/v1/car_inventory', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
    'apikey': 'YOUR_SUPABASE_ANON_KEY'
  }
})
.then(response => response.json())
.then(data => console.log(data));

// Add new car to inventory
fetch('https://wunqntfreyezylvbzvxc.supabase.co/rest/v1/car_inventory', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
    'apikey': 'YOUR_SUPABASE_ANON_KEY'
  },
  body: JSON.stringify({
    vin_number: 'WBAFR7C50BC123456',
    model: 'BMW X3',
    color: 'Black',
    year: 2023,
    status: 'available'
  })
})
.then(response => response.json())
.then(data => console.log(data));`}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">cURL</h3>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`# Get all inventory items
curl -X GET "https://wunqntfreyezylvbzvxc.supabase.co/rest/v1/inventory_items" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -H "apikey: YOUR_SUPABASE_ANON_KEY"

# Update car status
curl -X PATCH "https://wunqntfreyezylvbzvxc.supabase.co/rest/v1/car_inventory?id=eq.SOME_UUID" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -H "apikey: YOUR_SUPABASE_ANON_KEY" \\
  -d '{"status": "sold"}'`}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Response Format</h3>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`// Success Response
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "vin_number": "WBAFR7C50BC123456",
  "model": "BMW X3",
  "color": "Black",
  "year": 2023,
  "status": "available",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}

// Error Response
{
  "error": "Unauthorized",
  "message": "Invalid API key",
  "code": 401
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApiDocumentation;
