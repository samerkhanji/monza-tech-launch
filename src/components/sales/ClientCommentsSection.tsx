
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { CAR_MODELS } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Plus, Star, Calendar } from 'lucide-react';

interface ClientComment {
  id: string;
  clientName: string;
  carModel: string;
  comment: string;
  rating: number;
  timestamp: string;
  category: 'design' | 'performance' | 'features' | 'price' | 'service' | 'general';
}

const ClientCommentsSection: React.FC = () => {
  const [comments, setComments] = useState<ClientComment[]>([]);
  const [newComment, setNewComment] = useState({
    clientName: '',
    carModel: '',
    comment: '',
    rating: 5,
    category: 'general' as ClientComment['category']
  });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    // Load comments from localStorage
    const savedComments = localStorage.getItem('clientComments');
    if (savedComments) {
      setComments(JSON.parse(savedComments));
    }
  }, []);

  const saveComment = () => {
    if (!newComment.clientName || !newComment.carModel || !newComment.comment) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const comment: ClientComment = {
      id: Date.now().toString(),
      ...newComment,
      timestamp: new Date().toISOString()
    };

    const updatedComments = [comment, ...comments];
    setComments(updatedComments);
    localStorage.setItem('clientComments', JSON.stringify(updatedComments));

    toast({
      title: "Comment Added",
      description: `${newComment.clientName}'s comment has been recorded.`,
    });

    // Reset form
    setNewComment({
      clientName: '',
      carModel: '',
      comment: '',
      rating: 5,
      category: 'general'
    });
    setIsAdding(false);
  };

  const getCategoryColor = (category: ClientComment['category']) => {
    const colors = {
      design: 'bg-purple-100 text-purple-800',
      performance: 'bg-red-100 text-red-800',
      features: 'bg-blue-100 text-blue-800',
      price: 'bg-green-100 text-green-800',
      service: 'bg-orange-100 text-orange-800',
      general: 'bg-gray-100 text-gray-800'
    };
    return colors[category];
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="space-y-4">
      {!isAdding ? (
        <Button onClick={() => setIsAdding(true)} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Client Comment
        </Button>
      ) : (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Client Name</label>
                <Input
                  placeholder="Enter client name"
                  value={newComment.clientName}
                  onChange={(e) => setNewComment({ ...newComment, clientName: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Car Model</label>
                <Select
                  value={newComment.carModel}
                  onValueChange={(value) => setNewComment({ ...newComment, carModel: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select car model" />
                  </SelectTrigger>
                  <SelectContent>
                    {CAR_MODELS.map((model) => (
                      <SelectItem key={model.id} value={`${model.name} ${model.year}`}>
                        {model.name} {model.year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={newComment.category}
                  onValueChange={(value: ClientComment['category']) => setNewComment({ ...newComment, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="features">Features</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Rating</label>
                <Select
                  value={newComment.rating.toString()}
                  onValueChange={(value) => setNewComment({ ...newComment, rating: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <SelectItem key={rating} value={rating.toString()}>
                        {rating} Star{rating > 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Comment</label>
              <Textarea
                placeholder="Enter client's feedback about the car"
                value={newComment.comment}
                onChange={(e) => setNewComment({ ...newComment, comment: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={saveComment} className="flex-1">
                Save Comment
              </Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No client comments yet. Add the first one!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} className="border-l-4 border-l-monza-yellow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-monza-black">{comment.clientName}</h4>
                    <p className="text-sm text-monza-grey">{comment.carModel}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getCategoryColor(comment.category)}>
                      {comment.category}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {renderStars(comment.rating)}
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 mb-2">{comment.comment}</p>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  {new Date(comment.timestamp).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ClientCommentsSection;
