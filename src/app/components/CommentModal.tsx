import React, { useState, useEffect } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { createClient } from "../../../utils/superbase/client";


interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
}

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageId: string;
  canComment: boolean;
}

export function CommentModal({ isOpen, onClose, imageId, canComment }: CommentModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('image_comments_new')
        .select('*')  // Removed the profiles join
        .eq('image_id', imageId)
        .order('created_at', { ascending: false });
  
      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No user found');

      const { error: insertError } = await supabase
        .from('image_comments_new')
        .insert({
          image_id: imageId,  // This comes from props
          user_id: user.id,   // From auth
          content: newComment.trim(),
          // created_at will be set by default
        });

      if (insertError) throw insertError;
      
      setNewComment('');
      await fetchComments();  // Refresh comments after successful insert
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Failed to post comment');
    } finally {
      setIsLoading(false);
    }
};

  useEffect(() => {
    if (isOpen && imageId) {
      fetchComments();
    }
  }, [isOpen, imageId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md relative">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Comments</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Comments List */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">{comment.content}</p>
              <div className="text-xs text-gray-400 mt-1">
                {new Date(comment.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-center text-gray-500">No comments yet</p>
          )}
        </div>

        {/* Comment Form */}
        <div className="p-4 border-t">
          {canComment ? (
            <form onSubmit={handleSubmitComment} className="space-y-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full p-2 border rounded-lg resize-none h-24 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={isLoading}
              />
              <button 
                type="submit" 
                disabled={isLoading || !newComment.trim()}
                className={`w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg 
                  ${isLoading ? 'bg-gray-300' : 'bg-indigo-600 hover:bg-indigo-700'} 
                  text-white transition-colors`}
              >
                <MessageSquare size={16} />
                <span>{isLoading ? 'Posting...' : 'Post Comment'}</span>
              </button>
            </form>
          ) : (
            <p className="text-center text-sm text-gray-500">
              You dont have permission to comment
            </p>
          )}
        </div>
      </div>
    </div>
  );
}




