import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TopicIdea, TopicStatus } from '@/types/database';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function useTopics() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: topics = [], isLoading, error } = useQuery({
    queryKey: ['topics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('topic_ideas')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as TopicIdea[];
    },
  });

  const createTopic = useMutation({
    mutationFn: async (topic: { title: string; rationale?: string; hook?: string; tags?: string[]; status?: TopicStatus; source_generation_id?: string; news_item_id?: string }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('topic_ideas')
        .insert([{ ...topic, user_id: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      toast.success('Topic created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create topic: ' + error.message);
    },
  });

  const updateTopic = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TopicIdea> & { id: string }) => {
      // Remove user_id from updates
      const { user_id, ...dbUpdates } = updates as any;
      const { data, error } = await supabase
        .from('topic_ideas')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      toast.success('Topic updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update topic: ' + error.message);
    },
  });

  const deleteTopic = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('topic_ideas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      toast.success('Topic deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete topic: ' + error.message);
    },
  });

  const updateTopicStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TopicStatus }) => {
      const { data, error } = await supabase
        .from('topic_ideas')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
    },
    onError: (error) => {
      toast.error('Failed to update topic status: ' + error.message);
    },
  });

  return {
    topics,
    isLoading,
    error,
    createTopic,
    updateTopic,
    deleteTopic,
    updateTopicStatus,
  };
}
