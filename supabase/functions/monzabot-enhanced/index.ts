
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context, imageData, audioEnabled } = await req.json();

    console.log('=== MONZABOT ENHANCED REQUEST ===');
    console.log('Message:', message);
    console.log('Context:', context);
    console.log('Has Image:', !!imageData);

    // Get comprehensive database context
    const databaseContext = await getCompanyDatabaseContext(message, context);
    
    // Build company-specific system prompt
    const systemPrompt = buildCompanyAssistantPrompt(databaseContext, context);

    // Prepare messages for GPT-4o Vision
    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ];

    // Handle image analysis for car identification
    if (imageData) {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: `${message}\n\nPlease analyze this image and extract car information including: VIN, make, model, year, color, condition, any visible damage. If this is for new car arrivals, provide structured data to auto-fill the form. Focus only on factual observations from the image.`
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
        temperature: 0.3, // Lower temperature for more factual responses
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Process response for form filling if it's a car analysis
    const formFillData = extractFormFillData(aiResponse, context);

    // Generate audio response if enabled
    let audioResponse = null;
    if (audioEnabled && aiResponse) {
      audioResponse = await generateAudioResponse(aiResponse);
    }

    console.log('=== MONZABOT RESPONSE ===');
    console.log('Response:', aiResponse);

    return new Response(
      JSON.stringify({ 
        textResponse: aiResponse,
        audioResponse,
        formFillData,
        type: imageData ? 'car_analysis' : 'assistant_response',
        databaseContext: databaseContext
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in monzabot-enhanced function:', error);
    return new Response(
      JSON.stringify({ 
        textResponse: `I'm experiencing technical difficulties. Error: ${error.message}`,
        type: 'error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function getCompanyDatabaseContext(message: string, context?: any) {
  const lowerMessage = message.toLowerCase();
  const companyContext: any = { 
    tables: [],
    insights: [],
    recentActivity: []
  };

  try {
    // Get car inventory data
    const { data: carData } = await supabase
      .from('car_inventory')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (carData?.length) {
      companyContext.tables.push({ 
        name: 'car_inventory', 
        data: carData, 
        count: carData.length,
        description: 'Current car inventory with status, models, clients'
      });
    }

    // Get new arrivals data
    const { data: arrivalData } = await supabase
      .from('new_car_arrivals')
      .select('*')
      .order('arrival_date', { ascending: false })
      .limit(15);
    if (arrivalData?.length) {
      companyContext.tables.push({ 
        name: 'new_car_arrivals', 
        data: arrivalData, 
        count: arrivalData.length,
        description: 'Recent car arrivals awaiting processing'
      });
    }

    // Get garage/repair data
    const { data: garageData } = await supabase
      .from('garage_cars')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(15);
    if (garageData?.length) {
      companyContext.tables.push({ 
        name: 'garage_cars', 
        data: garageData, 
        count: garageData.length,
        description: 'Cars currently in garage for repairs'
      });
    }

    // Get ordered parts data
    const { data: partsData } = await supabase
      .from('ordered_parts')
      .select('*')
      .order('order_date', { ascending: false })
      .limit(10);
    if (partsData?.length) {
      companyContext.tables.push({ 
        name: 'ordered_parts', 
        data: partsData, 
        count: partsData.length,
        description: 'Recently ordered parts and their status'
      });
    }

    // Get notifications for updates
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    if (notifications?.length) {
      companyContext.recentActivity = notifications;
    }

  } catch (error) {
    console.error('Error getting company database context:', error);
  }

  return companyContext;
}

function buildCompanyAssistantPrompt(databaseContext: any, userContext?: any) {
  return `You are MonzaBot, a specialized AI assistant for a car dealership management system. You operate ONLY with the company's actual data and user-provided information. Do not use general automotive knowledge unless specifically asked.

**YOUR PRIMARY FUNCTIONS:**

1. **Car Image Analysis**: When provided with car images, extract:
   - VIN numbers (17-character codes)
   - Make, model, year (only what's clearly visible)
   - Color and condition
   - Visible damage or issues
   - License plates if visible

2. **New Car Arrival Assistant**: Help auto-fill arrival forms with image analysis data

3. **Data-Driven Recommendations**: Use only the company's database to provide insights about:
   - Inventory status and trends
   - Parts availability and orders
   - Garage scheduling and capacity
   - Customer service improvements

4. **Shipping & ETA Tracking**: Monitor and update shipping information for parts and vehicles

**CURRENT COMPANY DATA:**
${databaseContext.tables.map(table => 
  `\n**${table.name}** (${table.count} records): ${table.description}`
).join('')}

**RECENT ACTIVITY:**
${databaseContext.recentActivity.slice(0, 5).map(activity => 
  `- ${activity.title}: ${activity.message}`
).join('\n')}

**STRICT GUIDELINES:**
- Base responses ONLY on provided company data
- For car identification, state only what is clearly visible in images
- Provide confidence levels for visual analysis
- Ask for clarification when data is insufficient
- Focus on practical business operations
- Suggest form auto-fill when analyzing car images
- Alert about shipping delays or inventory issues

**USER CONTEXT:** ${userContext ? JSON.stringify(userContext) : 'General assistance request'}

When analyzing images, be specific about what you can see clearly vs. what requires verification. Always offer to help fill relevant forms with extracted data.`;
}

function extractFormFillData(aiResponse: string, context?: any) {
  // Extract structured data from AI response for form filling
  const formData: any = {};
  
  // Look for VIN patterns
  const vinMatch = aiResponse.match(/VIN[:\s]*([A-HJ-NPR-Z0-9]{17})/i);
  if (vinMatch) {
    formData.vin_number = vinMatch[1];
  }

  // Look for model information
  const modelMatch = aiResponse.match(/Model[:\s]*([A-Za-z0-9\s-]+)/i);
  if (modelMatch) {
    formData.model = modelMatch[1].trim();
  }

  // Look for year
  const yearMatch = aiResponse.match(/Year[:\s]*(20\d{2})/i);
  if (yearMatch) {
    formData.year = parseInt(yearMatch[1]);
  }

  // Look for color
  const colorMatch = aiResponse.match(/Color[:\s]*([A-Za-z\s]+)/i);
  if (colorMatch) {
    formData.color = colorMatch[1].trim();
  }

  // Look for damage information
  const damageMatch = aiResponse.match(/Damage[:\s]*([^.]+)/i);
  if (damageMatch) {
    formData.has_damages = true;
    formData.damage_description = damageMatch[1].trim();
  }

  return Object.keys(formData).length > 0 ? formData : null;
}

async function generateAudioResponse(text: string): Promise<string | null> {
  try {
    // Generate audio using OpenAI TTS
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: 'alloy',
        speed: 1.0
      }),
    });

    if (!response.ok) {
      throw new Error(`TTS API error: ${response.statusText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
    
    return `data:audio/mpeg;base64,${base64Audio}`;
  } catch (error) {
    console.error('Error generating audio:', error);
    return null;
  }
}
