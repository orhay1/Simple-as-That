import { Loader2 } from 'lucide-react';
import { Language } from '@/lib/i18n/translations';

interface LinkedInPostPreviewProps {
  profileName?: string;
  profileHeadline?: string;
  profileAvatar?: string;
  body: string;
  hashtags?: string[];
  imageUrl?: string;
  imageDescription?: string;
  isGeneratingImage?: boolean;
  language?: Language;
}

export function LinkedInPostPreview({
  profileName = 'Your Name',
  profileHeadline = 'Your headline',
  profileAvatar,
  body,
  hashtags = [],
  imageUrl,
  imageDescription,
  isGeneratingImage,
  language = 'en',
}: LinkedInPostPreviewProps) {
  const characterCount = body.length;
  const maxCharacters = 3000;
  const isOverLimit = characterCount > maxCharacters;
  const isRTL = language === 'he';

  // Format hashtags as LinkedIn displays them
  const formattedHashtags = hashtags
    .filter(Boolean)
    .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
    .join(' ');

  const initials = profileName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // LinkedIn-specific inline styles to override any theme
  const linkedInStyles = {
    container: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      backgroundColor: '#f3f2ef',
      padding: '16px',
      borderRadius: '8px',
    },
    card: {
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      border: '1px solid #e0e0e0',
      overflow: 'hidden' as const,
    },
    header: {
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
    },
    avatar: {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      backgroundColor: '#0a66c2',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      fontSize: '16px',
      fontWeight: 600,
      flexShrink: 0,
      overflow: 'hidden' as const,
    },
    profileInfo: {
      flex: 1,
      minWidth: 0,
    },
    name: {
      fontSize: '14px',
      fontWeight: 600,
      color: '#000000e6',
      lineHeight: '20px',
      margin: 0,
    },
    headline: {
      fontSize: '12px',
      color: '#00000099',
      lineHeight: '16px',
      margin: 0,
      whiteSpace: 'nowrap' as const,
      overflow: 'hidden' as const,
      textOverflow: 'ellipsis' as const,
    },
    timestamp: {
      fontSize: '12px',
      color: '#00000099',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      marginTop: '2px',
    },
    content: {
      padding: '0 16px 12px',
    },
    bodyText: {
      fontSize: '14px',
      color: '#000000e6',
      lineHeight: '20px',
      whiteSpace: 'pre-wrap' as const,
      margin: 0,
      direction: isRTL ? 'rtl' as const : 'ltr' as const,
      textAlign: isRTL ? 'right' as const : 'left' as const,
    },
    placeholder: {
      fontSize: '14px',
      color: '#00000066',
      fontStyle: 'italic' as const,
    },
    hashtags: {
      fontSize: '14px',
      color: '#0a66c2',
      marginTop: '8px',
    },
    imagePlaceholder: {
      backgroundColor: '#f3f2ef',
      height: '200px',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      borderTop: '1px solid #e0e0e0',
      padding: '16px',
    },
    imagePlaceholderText: {
      fontSize: '12px',
      color: '#00000099',
      textAlign: 'center' as const,
      maxWidth: '80%',
    },
    image: {
      width: '100%',
      maxHeight: '400px',
      objectFit: 'cover' as const,
      borderTop: '1px solid #e0e0e0',
    },
    reactions: {
      padding: '8px 16px',
      borderTop: '1px solid #e0e0e0',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    reactionIcons: {
      display: 'flex',
      marginLeft: '-4px',
    },
    reactionIcon: {
      width: '16px',
      height: '16px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '10px',
      marginLeft: '-4px',
      border: '2px solid #ffffff',
    },
    reactionText: {
      fontSize: '12px',
      color: '#00000099',
      marginLeft: '4px',
    },
    actions: {
      padding: '4px 8px',
      borderTop: '1px solid #e0e0e0',
      display: 'flex',
      justifyContent: 'space-around',
    },
    actionButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '12px 8px',
      borderRadius: '4px',
      border: 'none',
      backgroundColor: 'transparent',
      color: '#00000099',
      fontSize: '12px',
      fontWeight: 600,
      cursor: 'pointer',
    },
    charCount: {
      fontSize: '11px',
      color: isOverLimit ? '#cc1016' : '#00000066',
      textAlign: 'right' as const,
      marginBottom: '8px',
    },
    label: {
      fontSize: '12px',
      fontWeight: 500,
      color: '#00000099',
      marginBottom: '8px',
    },
  };

  // LinkedIn SVG icons
  const GlobeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="12" height="12" fill="#00000099">
      <path d="M8 1a7 7 0 107 7 7 7 0 00-7-7zM3 8a5 5 0 011-3l.55.55A1.5 1.5 0 015 6.62v1.07a.75.75 0 00.22.53l.56.56a.75.75 0 00.53.22H7v.69a.75.75 0 00.22.53l.56.56a.75.75 0 01.22.53V13a5 5 0 01-5-5zm6.93 4.82L10 12v-.5a.5.5 0 00-.5-.5H9v-1a.5.5 0 00-.5-.5H6.5v-1H8a.5.5 0 00.5-.5V7h1a.5.5 0 00.35-.15l.65-.65h.5a.5.5 0 00.39-.19A5 5 0 019.93 12.82z"/>
    </svg>
  );

  const LikeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M19.46 11l-3.91-3.91a7 7 0 01-1.69-2.74l-.49-1.47A2.76 2.76 0 0010.76 1 2.75 2.75 0 008 3.74v1.12a9.19 9.19 0 00.46 2.85L8.89 9H4.12A2.12 2.12 0 002 11.12a2.16 2.16 0 00.92 1.76A2.11 2.11 0 002 14.62a2.14 2.14 0 001.28 2 2 2 0 00-.28 1 2.12 2.12 0 002 2.12v.14A2.12 2.12 0 007.12 22h7.49a8.08 8.08 0 003.58-.84l.31-.16H21V11zM19 19h-1l-.73.37a6.14 6.14 0 01-2.69.63H7.12a.12.12 0 01-.12-.12v-.14a.12.12 0 01.12-.12H9V18H5a.12.12 0 01-.12-.12A.12.12 0 015 17.76h4v-1H4.12a.12.12 0 01-.12-.12.12.12 0 01.12-.12H9v-1H4.12A.12.12 0 014 15.4a.12.12 0 01.12-.12H9v-1H4.12A.12.12 0 014 14.16a.12.12 0 01.12-.12h6.76L9.88 11H4.12A.12.12 0 014 10.88.12.12 0 014.12 10.76h6L10 9.65A7.19 7.19 0 019.5 6.86V3.74A.75.75 0 0110.25 3a.76.76 0 01.72.54l.49 1.47a9 9 0 002.17 3.54L17 12v7z"/>
    </svg>
  );

  const CommentIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M7 9h10v1H7zm0 4h7v-1H7zm16-2a6.78 6.78 0 01-2.84 5.61L12 22v-4H8A7 7 0 018 4h8a7 7 0 017 7zm-2 0a5 5 0 00-5-5H8a5 5 0 000 10h6v2.28L18.37 13A4.79 4.79 0 0021 9z"/>
    </svg>
  );

  const RepostIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M13.96 5H6c-1.06 0-2 .94-2 2v10l2-2V7h7.96L12 9l1.41 1.41L17.66 6l-4.25-4.24L12 3.17l1.96 1.83zM10.04 19H18c1.06 0 2-.94 2-2V7l-2 2v10h-7.96l1.96-2-1.41-1.41L6.34 20l4.25 4.24L12 22.83l-1.96-1.83z"/>
    </svg>
  );

  const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M21 3L0 10l7.66 4.26L16 8l-6.26 8.34L14 24l7-21z"/>
    </svg>
  );

  const MoreIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="#00000099">
      <path d="M3 9.5A1.5 1.5 0 114.5 8 1.5 1.5 0 013 9.5zM11.5 8A1.5 1.5 0 1013 6.5 1.5 1.5 0 0011.5 8zm-5 0A1.5 1.5 0 108 6.5 1.5 1.5 0 006.5 8z"/>
    </svg>
  );

  return (
    <div style={linkedInStyles.container}>
      <div style={linkedInStyles.label}>LinkedIn Preview</div>
      <div style={linkedInStyles.charCount as React.CSSProperties}>
        {characterCount.toLocaleString()} / {maxCharacters.toLocaleString()}
      </div>

      <div style={linkedInStyles.card}>
        {/* Header */}
        <div style={linkedInStyles.header}>
          <div style={linkedInStyles.avatar}>
            {profileAvatar ? (
              <img src={profileAvatar} alt={profileName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              initials
            )}
          </div>
          <div style={linkedInStyles.profileInfo}>
            <p style={linkedInStyles.name}>{profileName}</p>
            <p style={linkedInStyles.headline}>{profileHeadline}</p>
            <div style={linkedInStyles.timestamp}>
              <span>Just now</span>
              <span>•</span>
              <GlobeIcon />
            </div>
          </div>
          <button style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer' }}>
            <MoreIcon />
          </button>
        </div>

        {/* Content */}
        <div style={linkedInStyles.content}>
          {body ? (
            <p style={linkedInStyles.bodyText}>{body}</p>
          ) : (
            <p style={linkedInStyles.placeholder}>Your post content will appear here...</p>
          )}
          {formattedHashtags && (
            <p style={linkedInStyles.hashtags}>{formattedHashtags}</p>
          )}
        </div>

        {/* Image */}
        {imageUrl ? (
          <img src={imageUrl} alt="Post image" style={linkedInStyles.image} />
        ) : isGeneratingImage ? (
          <div style={linkedInStyles.imagePlaceholder}>
            <Loader2 style={{ width: 24, height: 24, color: '#0a66c2', animation: 'spin 1s linear infinite' }} />
            <p style={{ ...linkedInStyles.imagePlaceholderText, marginTop: '8px' }}>Generating image...</p>
          </div>
        ) : imageDescription ? (
          <div style={linkedInStyles.imagePlaceholder}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="#00000066">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5-7l-3 3.72L9 13l-3 4h12l-4-5z"/>
            </svg>
            <p style={{ ...linkedInStyles.imagePlaceholderText, marginTop: '8px' }}>
              Image will be generated from:
            </p>
            <p style={{ ...linkedInStyles.imagePlaceholderText, marginTop: '4px', fontSize: '11px' }}>
              {imageDescription.length > 100 ? `${imageDescription.slice(0, 100)}...` : imageDescription}
            </p>
          </div>
        ) : null}

        {/* Reactions Bar */}
        <div style={linkedInStyles.reactions}>
          <div style={linkedInStyles.reactionIcons}>
            <div style={{ ...linkedInStyles.reactionIcon, backgroundColor: '#0a66c2' }}>👍</div>
          </div>
          <span style={linkedInStyles.reactionText}>Be the first to react</span>
        </div>

        {/* Action Buttons */}
        <div style={linkedInStyles.actions}>
          <button style={linkedInStyles.actionButton}>
            <LikeIcon />
            <span>Like</span>
          </button>
          <button style={linkedInStyles.actionButton}>
            <CommentIcon />
            <span>Comment</span>
          </button>
          <button style={linkedInStyles.actionButton}>
            <RepostIcon />
            <span>Repost</span>
          </button>
          <button style={linkedInStyles.actionButton}>
            <SendIcon />
            <span>Send</span>
          </button>
        </div>
      </div>

      {/* Hashtag count */}
      {hashtags.length > 0 && (
        <p style={{ fontSize: '11px', color: '#00000066', marginTop: '8px' }}>
          {hashtags.length} hashtag{hashtags.length !== 1 ? 's' : ''} attached
        </p>
      )}
    </div>
  );
}
