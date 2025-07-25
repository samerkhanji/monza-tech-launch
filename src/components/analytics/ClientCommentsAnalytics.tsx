
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Star, TrendingUp, MessageSquare } from 'lucide-react';

interface ClientComment {
  id: string;
  clientName: string;
  carModel: string;
  comment: string;
  rating: number;
  timestamp: string;
  category: 'design' | 'performance' | 'features' | 'price' | 'service' | 'general';
}

const COLORS = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', '#d0ed57'];

const ClientCommentsAnalytics: React.FC = () => {
  const [comments, setComments] = useState<ClientComment[]>([]);

  useEffect(() => {
    const savedComments = localStorage.getItem('clientComments');
    if (savedComments) {
      setComments(JSON.parse(savedComments));
    }
  }, []);

  // Calculate analytics data
  const categoryData = comments.reduce((acc, comment) => {
    acc[comment.category] = (acc[comment.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartCategoryData = Object.entries(categoryData).map(([category, count]) => ({
    category: category.charAt(0).toUpperCase() + category.slice(1),
    count
  }));

  const ratingData = comments.reduce((acc, comment) => {
    acc[comment.rating] = (acc[comment.rating] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const chartRatingData = [1, 2, 3, 4, 5].map(rating => ({
    rating: `${rating} Star${rating > 1 ? 's' : ''}`,
    count: ratingData[rating] || 0
  }));

  const averageRating = comments.length > 0 
    ? (comments.reduce((sum, comment) => sum + comment.rating, 0) / comments.length).toFixed(1)
    : '0';

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No client comments yet. Start collecting feedback to see analytics!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-monza-black">{comments.length}</div>
            <div className="text-sm text-gray-600">Total Comments</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-2xl font-bold text-monza-black">{averageRating}</span>
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            </div>
            <div className="text-sm text-gray-600">Average Rating</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-monza-black">
              {Object.keys(categoryData).length}
            </div>
            <div className="text-sm text-gray-600">Categories</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h4 className="text-lg font-medium mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Comments by Category
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartCategoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h4 className="text-lg font-medium mb-4 flex items-center gap-2">
            <Star className="h-5 w-5" />
            Rating Distribution
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartRatingData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartRatingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#FFD700', '#FFA500', '#FF6347', '#32CD32', '#4169E1'][index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent Comments */}
      <Card className="p-4">
        <h4 className="text-lg font-medium mb-4">Recent Comments</h4>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {comments.slice(0, 5).map((comment) => (
            <div key={comment.id} className="border-l-4 border-l-monza-yellow pl-4">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <span className="font-medium">{comment.clientName}</span>
                  <span className="text-sm text-gray-500 ml-2">{comment.carModel}</span>
                </div>
                <div className="flex items-center gap-1">
                  {renderStars(comment.rating)}
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-1">{comment.comment}</p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {comment.category}
                </Badge>
                <span className="text-xs text-gray-500">
                  {new Date(comment.timestamp).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ClientCommentsAnalytics;
