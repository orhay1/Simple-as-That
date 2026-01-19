"use client"

import React, { useState } from "react"
import { FileTrigger } from "react-aria-components"
import { Button } from "@/components/ui/button"
import { Upload, Loader2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAssets } from "@/hooks/useAssets"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

export function FileUploadButton() {
  const [uploading, setUploading] = useState(false)
  const [filename, setFilename] = useState<string>()
  const { createAsset } = useAssets()
  const { user } = useAuth()

  const handleSelect = async (e: FileList | null) => {
    if (!e || !user) return

    const file = e[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']
    if (!validTypes.includes(file.type)) {
      toast.error('Please select an image or video file')
      return
    }

    setFilename(file.name)
    setUploading(true)

    try {
      // Create unique filename
      const ext = file.name.split('.').pop()
      const uniqueName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(uniqueName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(uniqueName)

      // Create asset record
      await createAsset.mutateAsync({
        file_url: publicUrl,
        is_ai_generated: false,
        metadata: { 
          original_name: file.name,
          size: file.size,
          type: file.type 
        }
      })

      setFilename(undefined)
    } catch (error: any) {
      toast.error('Upload failed: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <FileTrigger
      onSelect={handleSelect}
      acceptedFileTypes={['image/*', 'video/*']}
    >
      <Button disabled={uploading}>
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {filename}
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            Upload
          </>
        )}
      </Button>
    </FileTrigger>
  )
}
