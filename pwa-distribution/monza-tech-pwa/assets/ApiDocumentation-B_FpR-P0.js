import{j as e,c9 as x,Y as y,Z as j,_ as t,aA as r,b as n,c as i,d as o,aJ as g,ag as c,f as d,bZ as v,B as u}from"./index-BKWZsjPE.js";const f=()=>{const l=[{category:"Car Inventory",endpoints:[{method:"GET",path:"/api/car-inventory",description:"Get all cars in inventory",params:"None",response:"Array of car objects"},{method:"GET",path:"/api/car-inventory/{id}",description:"Get a specific car by ID",params:"id: UUID",response:"Car object"},{method:"POST",path:"/api/car-inventory",description:"Add a new car to inventory",params:"Car data object",response:"Created car object"},{method:"PUT",path:"/api/car-inventory/{id}",description:"Update car information",params:"id: UUID, update data",response:"Updated car object"},{method:"DELETE",path:"/api/car-inventory/{id}",description:"Remove car from inventory",params:"id: UUID",response:"Success message"}]},{category:"Garage Operations",endpoints:[{method:"GET",path:"/api/garage-cars",description:"Get all cars in garage",params:"None",response:"Array of garage car objects"},{method:"POST",path:"/api/garage-cars",description:"Add car to garage",params:"Garage car data",response:"Created garage car object"},{method:"PUT",path:"/api/garage-cars/{id}/status",description:"Update car status in garage",params:"id: UUID, status: string",response:"Updated garage car object"}]},{category:"Inventory Management",endpoints:[{method:"GET",path:"/api/inventory",description:"Get all inventory items",params:"location (optional)",response:"Array of inventory items"},{method:"POST",path:"/api/inventory",description:"Add new inventory item",params:"Inventory item data",response:"Created inventory item"},{method:"PUT",path:"/api/inventory/{id}",description:"Update inventory item",params:"id: UUID, update data",response:"Updated inventory item"}]},{category:"Sales & Analytics",endpoints:[{method:"GET",path:"/api/sales",description:"Get sales data",params:"start_date, end_date (optional)",response:"Array of sales records"},{method:"POST",path:"/api/sales",description:"Add sales record",params:"Sales data object",response:"Created sales record"}]},{category:"Notifications",endpoints:[{method:"GET",path:"/api/notifications",description:"Get user notifications",params:"user_id (optional)",response:"Array of notifications"},{method:"POST",path:"/api/notifications",description:"Create notification",params:"Notification data",response:"Created notification"},{method:"PUT",path:"/api/notifications/{id}/read",description:"Mark notification as read",params:"id: UUID",response:"Updated notification"}]}],p=s=>{switch(s){case"GET":return"bg-green-100 text-green-800";case"POST":return"bg-blue-100 text-blue-800";case"PUT":return"bg-yellow-100 text-yellow-800";case"DELETE":return"bg-red-100 text-red-800";default:return"bg-gray-100 text-gray-800"}};return e.jsxs("div",{className:"container mx-auto py-6 space-y-6",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-6",children:[e.jsx(x,{className:"h-6 w-6 text-monza-yellow"}),e.jsx("h1",{className:"text-3xl font-bold text-monza-black",children:"API Documentation"})]}),e.jsxs(y,{defaultValue:"overview",className:"space-y-6",children:[e.jsxs(j,{children:[e.jsx(t,{value:"overview",children:"Overview"}),e.jsx(t,{value:"authentication",children:"Authentication"}),e.jsx(t,{value:"endpoints",children:"Endpoints"}),e.jsx(t,{value:"examples",children:"Examples"})]}),e.jsx(r,{value:"overview",children:e.jsxs(n,{children:[e.jsxs(i,{children:[e.jsxs(o,{className:"flex items-center gap-2",children:[e.jsx(g,{className:"h-5 w-5"}),"Monza Automotive API"]}),e.jsx(c,{children:"RESTful API for managing automotive inventory, garage operations, and business analytics."})]}),e.jsxs(d,{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg font-semibold mb-2",children:"Base URL"}),e.jsx("code",{className:"bg-gray-100 px-3 py-1 rounded text-sm",children:"https://wunqntfreyezylvbzvxc.supabase.co/rest/v1"})]}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg font-semibold mb-2",children:"Content Type"}),e.jsx("code",{className:"bg-gray-100 px-3 py-1 rounded text-sm",children:"application/json"})]}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg font-semibold mb-2",children:"Features"}),e.jsxs("ul",{className:"list-disc list-inside space-y-1 text-sm text-gray-600",children:[e.jsx("li",{children:"Complete CRUD operations for all data entities"}),e.jsx("li",{children:"API key authentication for secure access"}),e.jsx("li",{children:"Real-time data synchronization"}),e.jsx("li",{children:"Comprehensive error handling"}),e.jsx("li",{children:"Rate limiting and usage tracking"})]})]})]})]})}),e.jsx(r,{value:"authentication",children:e.jsxs(n,{children:[e.jsxs(i,{children:[e.jsxs(o,{className:"flex items-center gap-2",children:[e.jsx(v,{className:"h-5 w-5"}),"Authentication"]}),e.jsx(c,{children:"All API requests require a valid API key for authentication."})]}),e.jsxs(d,{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg font-semibold mb-2",children:"API Key Header"}),e.jsx("code",{className:"bg-gray-100 px-3 py-1 rounded text-sm block",children:"Authorization: Bearer YOUR_API_KEY"})]}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg font-semibold mb-2",children:"API Key Format"}),e.jsxs("p",{className:"text-sm text-gray-600 mb-2",children:["API keys start with ",e.jsx("code",{className:"bg-gray-100 px-1 py-0.5 rounded",children:"mk_"})," followed by 64 hexadecimal characters."]}),e.jsx("code",{className:"bg-gray-100 px-3 py-1 rounded text-sm text-xs block",children:"mk_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"})]}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg font-semibold mb-2",children:"Error Responses"}),e.jsxs("div",{className:"space-y-2",children:[e.jsx("div",{className:"bg-red-50 p-3 rounded border-l-4 border-red-500",children:e.jsx("code",{className:"text-sm",children:"401 Unauthorized - Missing or invalid API key"})}),e.jsx("div",{className:"bg-red-50 p-3 rounded border-l-4 border-red-500",children:e.jsx("code",{className:"text-sm",children:"403 Forbidden - API key lacks required permissions"})})]})]})]})]})}),e.jsx(r,{value:"endpoints",children:e.jsx("div",{className:"space-y-6",children:l.map((s,m)=>e.jsxs(n,{children:[e.jsx(i,{children:e.jsx(o,{children:s.category})}),e.jsx(d,{children:e.jsx("div",{className:"space-y-4",children:s.endpoints.map((a,h)=>e.jsxs("div",{className:"border rounded-lg p-4",children:[e.jsxs("div",{className:"flex items-center gap-3 mb-2",children:[e.jsx(u,{className:p(a.method),children:a.method}),e.jsx("code",{className:"text-sm font-mono",children:a.path})]}),e.jsx("p",{className:"text-sm text-gray-600 mb-2",children:a.description}),e.jsxs("div",{className:"grid grid-cols-2 gap-4 text-xs",children:[e.jsxs("div",{children:[e.jsx("span",{className:"font-semibold",children:"Parameters:"}),e.jsx("p",{className:"text-gray-600",children:a.params})]}),e.jsxs("div",{children:[e.jsx("span",{className:"font-semibold",children:"Response:"}),e.jsx("p",{className:"text-gray-600",children:a.response})]})]})]},h))})})]},m))})}),e.jsx(r,{value:"examples",children:e.jsxs(n,{children:[e.jsxs(i,{children:[e.jsx(o,{children:"Code Examples"}),e.jsx(c,{children:"Sample requests and responses for common API operations."})]}),e.jsxs(d,{className:"space-y-6",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg font-semibold mb-2",children:"JavaScript/Fetch"}),e.jsx("pre",{className:"bg-gray-100 p-4 rounded text-sm overflow-x-auto",children:`// Get all cars in inventory
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
.then(data => console.log(data));`})]}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg font-semibold mb-2",children:"cURL"}),e.jsx("pre",{className:"bg-gray-100 p-4 rounded text-sm overflow-x-auto",children:`# Get all inventory items
curl -X GET "https://wunqntfreyezylvbzvxc.supabase.co/rest/v1/inventory_items" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -H "apikey: YOUR_SUPABASE_ANON_KEY"

# Update car status
curl -X PATCH "https://wunqntfreyezylvbzvxc.supabase.co/rest/v1/car_inventory?id=eq.SOME_UUID" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -H "apikey: YOUR_SUPABASE_ANON_KEY" \\
  -d '{"status": "sold"}'`})]}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg font-semibold mb-2",children:"Response Format"}),e.jsx("pre",{className:"bg-gray-100 p-4 rounded text-sm overflow-x-auto",children:`// Success Response
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
}`})]})]})]})})]})]})};export{f as default};
