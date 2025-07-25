
import { supabase } from '@/integrations/supabase/client';

export interface ProductivityTrackingData {
  carId: string;
  carCode: string;
  customerName: string;
  assignedMechanics: string[];
  workType: 'electrical' | 'painter' | 'detailer' | 'mechanic' | 'body_work';
  estimatedHours: number;
  actualHours?: number;
  estimatedStart: string;
  actualStart?: string;
  estimatedCompletion: string;
  actualCompletion?: string;
  status?: 'in_progress' | 'completed' | 'delayed' | 'cancelled';
  delayReason?: string;
  productivityNotes?: string;
  qualityIssues?: string[];
}

export interface WeeklyProductivitySummary {
  weekStart: string;
  weekEnd: string;
  totalCarsWorked: number;
  totalEstimatedHours: number;
  totalActualHours: number;
  overallEfficiencyPercentage: number;
  carsCompletedOnTime: number;
  carsDelayed: number;
  averageDelayHours: number;
  electricalHours: number;
  painterHours: number;
  detailerHours: number;
  mechanicHours: number;
  bodyWorkHours: number;
}

export interface AIInsight {
  id: string;
  insight_type: string;
  priority: string;
  title: string;
  description: string;
  affected_area: string;
  affected_entity?: string;
  efficiency_drop?: number;
  delay_increase?: number;
  quality_issues_increase?: number;
  recommended_actions: string[];
  expected_improvement: string;
  status: string;
  created_at: string;
  week_start?: string;
  week_end?: string;
}

export const productivityTrackingService = {
  // Track productivity for a car repair
  async trackProductivity(data: ProductivityTrackingData) {
    try {
      // Calculate week start, number, and year from estimated start
      const startDate = new Date(data.estimatedStart);
      const weekStart = new Date(startDate);
      weekStart.setDate(startDate.getDate() - startDate.getDay()); // Start of week (Sunday)
      
      const weekNumber = Math.ceil((startDate.getTime() - new Date(startDate.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
      const year = startDate.getFullYear();

      const { error } = await supabase
        .from('productivity_tracking')
        .insert({
          car_id: data.carId,
          car_code: data.carCode,
          customer_name: data.customerName,
          assigned_mechanics: data.assignedMechanics,
          work_type: data.workType,
          estimated_hours: data.estimatedHours,
          actual_hours: data.actualHours,
          estimated_start: data.estimatedStart,
          actual_start: data.actualStart,
          estimated_completion: data.estimatedCompletion,
          actual_completion: data.actualCompletion,
          status: data.status || 'in_progress',
          delay_reason: data.delayReason,
          productivity_notes: data.productivityNotes,
          quality_issues: data.qualityIssues || [],
          week_start: weekStart.toISOString().split('T')[0],
          week_number: weekNumber,
          year: year
        });

      if (error) throw error;
      
      // Auto-generate weekly summary for this week
      await this.generateWeeklySummary(new Date(data.estimatedStart));
      
      // Check for AI insights
      await this.generateAIInsights();
      
      console.log('Productivity tracking recorded successfully');
    } catch (error) {
      console.error('Error tracking productivity:', error);
      throw error;
    }
  },

  // Update productivity tracking when repair is completed
  async updateProductivityCompletion(carCode: string, actualCompletion: string, actualHours: number, qualityIssues?: string[]) {
    try {
      const { error } = await supabase
        .from('productivity_tracking')
        .update({
          actual_completion: actualCompletion,
          actual_hours: actualHours,
          status: 'completed',
          quality_issues: qualityIssues || [],
          updated_at: new Date().toISOString()
        })
        .eq('car_code', carCode)
        .eq('status', 'in_progress');

      if (error) throw error;
      
      // Regenerate weekly summary
      await this.generateWeeklySummary(new Date(actualCompletion));
      
      // Check for new AI insights
      await this.generateAIInsights();
      
      console.log('Productivity completion updated successfully');
    } catch (error) {
      console.error('Error updating productivity completion:', error);
      throw error;
    }
  },

  // Generate weekly summary
  async generateWeeklySummary(weekDate: Date) {
    try {
      const { error } = await supabase.rpc('generate_weekly_summary', {
        week_date: weekDate.toISOString().split('T')[0]
      });

      if (error) throw error;
      console.log('Weekly summary generated successfully');
    } catch (error) {
      console.error('Error generating weekly summary:', error);
      throw error;
    }
  },

  // Get productivity data for a specific week
  async getWeeklyProductivity(weekStart: string): Promise<WeeklyProductivitySummary | null> {
    try {
      const { data, error } = await supabase
        .from('weekly_productivity_summary')
        .select('*')
        .eq('week_start', weekStart)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data ? {
        weekStart: data.week_start,
        weekEnd: data.week_end,
        totalCarsWorked: data.total_cars_worked,
        totalEstimatedHours: data.total_estimated_hours,
        totalActualHours: data.total_actual_hours,
        overallEfficiencyPercentage: data.overall_efficiency_percentage,
        carsCompletedOnTime: data.cars_completed_on_time,
        carsDelayed: data.cars_delayed,
        averageDelayHours: data.average_delay_hours,
        electricalHours: data.electrical_hours,
        painterHours: data.painter_hours,
        detailerHours: data.detailer_hours,
        mechanicHours: data.mechanic_hours,
        bodyWorkHours: data.body_work_hours
      } : null;
    } catch (error) {
      console.error('Error fetching weekly productivity:', error);
      throw error;
    }
  },

  // Get mechanic performance data
  async getMechanicPerformance(weekStart: string) {
    try {
      const { data, error } = await supabase
        .from('mechanic_performance')
        .select('*')
        .eq('week_start', weekStart)
        .order('efficiency_percentage', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching mechanic performance:', error);
      throw error;
    }
  },

  // Generate AI insights based on current data
  async generateAIInsights() {
    try {
      // Get last 4 weeks of data for comparison
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
      
      const { data: recentData, error } = await supabase
        .from('weekly_productivity_summary')
        .select('*')
        .gte('week_start', fourWeeksAgo.toISOString().split('T')[0])
        .order('week_start', { ascending: false })
        .limit(4);

      if (error || !recentData || recentData.length < 2) return;

      const latestWeek = recentData[0];
      const previousWeek = recentData[1];
      
      const insights: any[] = [];

      // Check for efficiency drops
      if (latestWeek.overall_efficiency_percentage && previousWeek.overall_efficiency_percentage) {
        const efficiencyDrop = previousWeek.overall_efficiency_percentage - latestWeek.overall_efficiency_percentage;
        
        if (efficiencyDrop > 10) {
          insights.push({
            insight_type: 'efficiency',
            priority: efficiencyDrop > 20 ? 'high' : 'medium',
            title: 'Significant Efficiency Drop Detected',
            description: `Overall garage efficiency dropped by ${efficiencyDrop.toFixed(1)}% this week compared to last week.`,
            affected_area: 'overall',
            efficiency_drop: efficiencyDrop,
            recommended_actions: [
              'Review work allocation and scheduling',
              'Check if mechanics need additional training',
              'Analyze bottlenecks in the workflow',
              'Consider equipment maintenance or upgrades'
            ],
            expected_improvement: 'Could improve efficiency by 15-25% within 2 weeks',
            week_start: latestWeek.week_start,
            week_end: latestWeek.week_end
          });
        }
      }

      // Check for delay increases
      if (latestWeek.average_delay_hours && previousWeek.average_delay_hours) {
        const delayIncrease = latestWeek.average_delay_hours - previousWeek.average_delay_hours;
        
        if (delayIncrease > 2) {
          insights.push({
            insight_type: 'bottleneck',
            priority: delayIncrease > 5 ? 'high' : 'medium',
            title: 'Increasing Repair Delays',
            description: `Average repair delays increased by ${delayIncrease.toFixed(1)} hours this week.`,
            affected_area: 'overall',
            delay_increase: delayIncrease,
            recommended_actions: [
              'Review parts inventory to prevent delays',
              'Optimize scheduling to reduce wait times',
              'Consider hiring additional mechanics for peak periods',
              'Implement better project management tools'
            ],
            expected_improvement: 'Could reduce delays by 30-40% within 3 weeks',
            week_start: latestWeek.week_start,
            week_end: latestWeek.week_end
          });
        }
      }

      // Check work type imbalances
      const totalHours = latestWeek.electrical_hours + latestWeek.painter_hours + 
                        latestWeek.detailer_hours + latestWeek.mechanic_hours + latestWeek.body_work_hours;
      
      if (totalHours > 0) {
        const workTypes = [
          { type: 'electrical', hours: latestWeek.electrical_hours, name: 'Electrical Work' },
          { type: 'painter', hours: latestWeek.painter_hours, name: 'Painting' },
          { type: 'detailer', hours: latestWeek.detailer_hours, name: 'Detailing' },
          { type: 'mechanic', hours: latestWeek.mechanic_hours, name: 'Mechanical Work' },
          { type: 'body_work', hours: latestWeek.body_work_hours, name: 'Body Work' }
        ];

        const maxWorkType = workTypes.reduce((max, current) => 
          current.hours > max.hours ? current : max
        );

        if (maxWorkType.hours / totalHours > 0.6) {
          insights.push({
            insight_type: 'recommendation',
            priority: 'medium',
            title: `${maxWorkType.name} Capacity Imbalance`,
            description: `${maxWorkType.name} accounts for ${((maxWorkType.hours / totalHours) * 100).toFixed(1)}% of total work hours, indicating potential capacity imbalance.`,
            affected_area: 'work_type_specific',
            affected_entity: maxWorkType.type,
            recommended_actions: [
              `Consider cross-training mechanics in ${maxWorkType.name.toLowerCase()}`,
              'Hire specialized technicians for high-demand work types',
              'Implement better work distribution strategies',
              'Review pricing strategy for overloaded work types'
            ],
            expected_improvement: 'Better work distribution and reduced bottlenecks',
            week_start: latestWeek.week_start,
            week_end: latestWeek.week_end
          });
        }
      }

      // Insert insights into database
      for (const insight of insights) {
        await supabase
          .from('ai_insights')
          .insert(insight);
      }

      console.log(`Generated ${insights.length} AI insights`);
    } catch (error) {
      console.error('Error generating AI insights:', error);
    }
  },

  // Get AI insights
  async getAIInsights(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      return [];
    }
  },

  // Acknowledge an AI insight
  async acknowledgeInsight(insightId: string, acknowledgedBy: string) {
    try {
      const { error } = await supabase
        .from('ai_insights')
        .update({
          status: 'acknowledged',
          acknowledged_by: acknowledgedBy,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', insightId);

      if (error) throw error;
      console.log('AI insight acknowledged');
    } catch (error) {
      console.error('Error acknowledging insight:', error);
      throw error;
    }
  }
};
