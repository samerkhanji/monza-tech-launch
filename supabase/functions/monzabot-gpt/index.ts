
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context, imageData } = await req.json();

    console.log('=== GPT-4O MONZABOT REQUEST ===');
    console.log('Message:', message);
    console.log('Context:', context);
    console.log('Has Image:', !!imageData);

    // Get database context for GPT-4o
    const databaseContext = await getDatabaseContext(message);
    
    // Build system prompt with database awareness
    const systemPrompt = buildSystemPrompt(databaseContext, context);

    // Prepare messages array
    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ];

    // Handle image analysis
    if (imageData) {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: message
          },
          {
            type: 'image_url',
            image_url: {
              url: imageData
            }
          }
        ]
      });
    } else {
      messages.push({ role: 'user', content: message });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('=== GPT-4O RESPONSE ===');
    console.log('Response:', aiResponse);

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        type: imageData ? 'image_analysis' : 'gpt4o_analysis',
        data: databaseContext 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in monzabot-gpt function:', error);
    return new Response(
      JSON.stringify({ 
        response: `I'm experiencing technical difficulties with the AI analysis. Error: ${error.message}`,
        type: 'error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function getDatabaseContext(message: string) {
  const lowerMessage = message.toLowerCase();
  const context: any = { tables: [] };

  try {
    // Get relevant data based on message content
    if (lowerMessage.includes('car') || lowerMessage.includes('inventory') || lowerMessage.includes('vehicle')) {
      const { data: carData } = await supabase
        .from('car_inventory')
        .select('*')
        .limit(10);
      context.tables.push({ name: 'car_inventory', sample_data: carData, count: carData?.length || 0 });
    }

    if (lowerMessage.includes('repair') || lowerMessage.includes('garage') || lowerMessage.includes('mechanic')) {
      const { data: repairData } = await supabase
        .from('garage_cars')
        .select('*')
        .limit(10);
      context.tables.push({ name: 'garage_cars', sample_data: repairData, count: repairData?.length || 0 });
    }

    if (lowerMessage.includes('arrival') || lowerMessage.includes('new car')) {
      const { data: arrivalData } = await supabase
        .from('new_car_arrivals')
        .select('*')
        .limit(10);
      context.tables.push({ name: 'new_car_arrivals', sample_data: arrivalData, count: arrivalData?.length || 0 });
    }

    if (lowerMessage.includes('schedule') || lowerMessage.includes('appointment')) {
      const { data: scheduleData } = await supabase
        .from('garage_schedule')
        .select('*')
        .limit(10);
      context.tables.push({ name: 'garage_schedule', sample_data: scheduleData, count: scheduleData?.length || 0 });
    }

    if (lowerMessage.includes('part') || lowerMessage.includes('inventory')) {
      const { data: inventoryData } = await supabase
        .from('inventory_items')
        .select('*')
        .limit(10);
      context.tables.push({ name: 'inventory_items', sample_data: inventoryData, count: inventoryData?.length || 0 });
    }

    // If no specific context, get general overview
    if (context.tables.length === 0) {
      const tables = ['car_inventory', 'garage_cars', 'new_car_arrivals', 'garage_schedule', 'inventory_items'];
      for (const table of tables) {
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        context.tables.push({ name: table, count });
      }
    }

  } catch (error) {
    console.error('Error getting database context:', error);
  }

  return context;
}

function buildSystemPrompt(databaseContext: any, userContext?: any) {
  return `You are MonzaBot, an AI assistant for a car dealership management system with advanced vision and voice capabilities. You can analyze images and respond to voice commands to help with:

1. **Image Analysis**: Analyze automotive images to extract:
   - Vehicle information (make, model, year, color, condition)
   - VIN numbers and license plates
   - Parts identification and condition assessment
   - Damage documentation
   - Any visible automotive-related data

2. **Voice Commands**: Process spoken requests to:
   - Navigate through system workflows
   - Fill out forms with voice-dictated information
   - Provide guidance and assistance
   - Execute common dealership tasks

3. **Data Integration**: Suggest how extracted information can fill forms like:
   - New car arrivals
   - Inventory management
   - Repair documentation
   - Parts tracking

4. **Smart Assistance**: 
   - Ask permission before auto-filling forms
   - Provide confidence levels for extracted data
   - Suggest verification steps for critical information
   - Offer alternative actions based on context

**Current Database Context:**
${databaseContext.tables.map(table => 
  `- ${table.name}: ${table.count} records${table.sample_data ? ' (sample data available)' : ''}`
).join('\n')}

**Available Tables:**
- car_inventory: All vehicles in inventory with status, location, client info
- garage_cars: Vehicles currently being repaired with mechanics, status, progress
- new_car_arrivals: Newly arrived vehicles awaiting processing
- garage_schedule: Garage scheduling and capacity management
- inventory_items: Parts and inventory management

**Your Role:**
- Analyze images for automotive information extraction
- Process voice commands for system navigation and data entry
- Suggest automated form filling with user permission
- Provide confidence ratings for extracted data
- Help streamline dealership workflows through AI assistance

**User Context:** ${userContext ? JSON.stringify(userContext) : 'General inquiry'}

When analyzing images, be specific about what you can see clearly vs. what might need human verification. Always offer to help fill out relevant forms but ask for permission first.`;
}
