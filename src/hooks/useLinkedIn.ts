import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface LinkedInConnection {
  id: string;
  user_id: string;
  is_connected: boolean;
  profile_name: string | null;
  profile_id: string | null;
  avatar_url: string | null;
  headline: string | null;
  connected_at: string | null;
  expires_at: string | null;
}

export function useLinkedIn() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: connection, isLoading, error } = useQuery({
    queryKey: ['linkedin-connection', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('linkedin_connections')
        .select('id, user_id, is_connected, profile_name, profile_id, avatar_url, headline, connected_at, expires_at')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as LinkedInConnection | null;
    },
    enabled: !!user?.id,
  });

  const connectLinkedIn = () => {
    if (!user?.id) {
      toast.error('You must be logged in to connect LinkedIn');
      return;
    }

    const authUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/linkedin-auth?action=authorize&user_id=${user.id}`;
    window.location.href = authUrl;
  };

  const disconnectLinkedIn = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/linkedin-auth`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'disconnect' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to disconnect');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkedin-connection'] });
      toast.success('LinkedIn disconnected');
    },
    onError: (error) => {
      toast.error('Failed to disconnect: ' + error.message);
    },
  });

  const publishToLinkedIn = useMutation({
    mutationFn: async ({ content, draftId, hashtags }: { content: string; draftId?: string; hashtags?: string[] }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/linkedin-post`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, draftId, hashtags }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to publish');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      queryClient.invalidateQueries({ queryKey: ['publications'] });
      toast.success('Published to LinkedIn!', {
        action: data.postUrl ? {
          label: 'View Post',
          onClick: () => window.open(data.postUrl, '_blank'),
        } : undefined,
      });
    },
    onError: (error) => {
      toast.error('Failed to publish: ' + error.message);
    },
  });

  const isConnected = connection?.is_connected ?? false;
  const isExpired = connection?.expires_at ? new Date(connection.expires_at) < new Date() : false;

  return {
    connection,
    isLoading,
    error,
    isConnected,
    isExpired,
    connectLinkedIn,
    disconnectLinkedIn,
    publishToLinkedIn,
  };
}
