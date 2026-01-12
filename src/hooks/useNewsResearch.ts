import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

export interface NewsItem {
  id: string;
  title: string;
  summary: string | null;
  full_content: string | null;
  source_url: string | null;
  official_url: string | null;
  source_name: string | null;
  tool_name: string | null;
  published_date: string | null;
  discovered_at: string;
  status: string;
  tags: string[] | null;
  created_at: string;
}

export function useNewsResearch() {
  const queryClient = useQueryClient();
  const [researchStatus, setResearchStatus] = useState<string | null>(null);

  // Fetch all news items
  const { data: newsItems = [], isLoading, error } = useQuery({
    queryKey: ['news-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_news_items')
        .select('*')
        .order('discovered_at', { ascending: false });
      
      if (error) throw error;
      return data as NewsItem[];
    },
  });

  // Research new AI news
  const researchNews = useMutation({
    mutationFn: async ({ query, count, language }: { query?: string; count?: number; language?: string }) => {
      setResearchStatus('Connecting...');
      
      const { data, error } = await supabase.functions.invoke('research-ai-news', {
        body: { query, count, language },
      });
      
      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Research failed');
      return data;
    },
    onMutate: () => {
      setResearchStatus('Searching tools...');
    },
    onSuccess: (data) => {
      setResearchStatus(null);
      queryClient.invalidateQueries({ queryKey: ['news-items'] });
      toast.success(data.message || 'Research complete');
    },
    onError: (error: any) => {
      setResearchStatus(null);
      toast.error('Research failed: ' + (error.message || 'Unknown error'));
    },
  });

  // Update news item status
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('ai_news_items')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news-items'] });
    },
    onError: (error: any) => {
      toast.error('Failed to update status: ' + (error.message || 'Unknown error'));
    },
  });

  // Delete news item
  const deleteNewsItem = useMutation({
    mutationFn: async (id: string) => {
      // First, unlink any topic_ideas referencing this news item
      await supabase
        .from('topic_ideas')
        .update({ news_item_id: null })
        .eq('news_item_id', id);
      
      const { error } = await supabase
        .from('ai_news_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news-items'] });
      toast.success('News item deleted');
    },
    onError: (error: any) => {
      toast.error('Failed to delete: ' + (error.message || 'Unknown error'));
    },
  });

  return {
    newsItems,
    isLoading,
    error,
    researchNews,
    updateStatus,
    deleteNewsItem,
    isResearching: researchNews.isPending,
    researchStatus,
  };
}
