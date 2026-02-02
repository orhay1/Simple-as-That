export type Language = 'en' | 'he';

export interface Translations {
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    create: string;
    loading: string;
    error: string;
    success: string;
    confirm: string;
    search: string;
    filter: string;
    all: string;
    none: string;
    back: string;
    next: string;
    previous: string;
    close: string;
    open: string;
    view: string;
    download: string;
    upload: string;
    refresh: string;
    retry: string;
    signOut: string;
    role: string;
    reset: string;
    characters: string;
    modified: string;
    adminOnly: string;
  };
  navigation: {
    dashboard: string;
    topics: string;
    drafts: string;
    assets: string;
    schedule: string;
    published: string;
    settings: string;
    content: string;
    system: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    aiToolsResearched: string;
    draftsCount: string;
    approved: string;
    publishedCount: string;
    recentAITools: string;
    recentDrafts: string;
    research: string;
    viewAll: string;
    noAITools: string;
    noDrafts: string;
  };
  topics: {
    title: string;
    subtitle: string;
    research: string;
    generateTopics: string;
    createDraft: string;
    archive: string;
    shortlist: string;
    new: string;
    shortlisted: string;
    archived: string;
    noTopics: string;
    researchAITools: string;
    discoverDescription: string;
    noToolsYet: string;
    startResearch: string;
    selectAll: string;
    clear: string;
    selected: string;
    toDrafts: string;
    showMore: string;
    showLess: string;
    summary: string;
    fullContent: string;
    visitTool: string;
    viewSource: string;
    used: string;
  };
  research: {
    title: string;
    description: string;
    searchQuery: string;
    quickPicks: string;
    numberOfResults: string;
    searching: string;
  };
  assetDetail: {
    title: string;
    prompt: string;
    created: string;
    model: string;
    size: string;
    copyUrl: string;
    noImage: string;
    invalidUrl: string;
    urlCopied: string;
    downloadStarted: string;
    downloadFailed: string;
  };
  drafts: {
    title: string;
    subtitle: string;
    newDraft: string;
    editDraft: string;
    postContent: string;
    imageDescription: string;
    hashtags: string;
    preview: string;
    publish: string;
    schedule: string;
    approve: string;
    rewrite: string;
    generateHashtags: string;
    generateImage: string;
    chooseFromLibrary: string;
    fetchFromSource: string;
    noDrafts: string;
    status: {
      draft: string;
      in_review: string;
      approved: string;
      scheduled: string;
      published: string;
    };
    rewriteOptions: {
      tighten: string;
      expand: string;
      addCta: string;
      founderTone: string;
      educational: string;
      contrarian: string;
      storyMode: string;
      translateTo: string;
      translateHebrew: string;
      translateEnglish: string;
    };
    versionHistory: string;
    original: string;
    noVersions: string;
  };
  assets: {
    title: string;
    subtitle: string;
    upload: string;
    generate: string;
    noAssets: string;
    aiGenerated: string;
    uploaded: string;
  };
  schedule: {
    title: string;
    subtitle: string;
    noScheduled: string;
    scheduledFor: string;
  };
  published: {
    title: string;
    subtitle: string;
    noPublished: string;
    impressions: string;
    likes: string;
    comments: string;
    viewPreview: string;
    publishedOn: string;
    manualPublish: string;
    linkedInPost: string;
  };
  settings: {
    title: string;
    subtitle: string;
    linkedin: string;
    prompts: string;
    images: string;
    guardrails: string;
    language: string;
    linkedinConnection: string;
    linkedinDescription: string;
    connect: string;
    reconnect: string;
    disconnect: string;
    connected: string;
    expired: string;
    checkingConnection: string;
    connectDescription: string;
    connectedOn: string;
    tokenExpires: string;
    languageSettings: string;
    languageDescription: string;
    uiLanguage: string;
    uiLanguageDescription: string;
    contentLanguage: string;
    contentLanguageDescription: string;
    english: string;
    hebrew: string;
    account: string;
  };
  settingsAccount: {
    title: string;
    description: string;
    email: string;
    displayName: string;
    memberSince: string;
    dangerZone: string;
    dangerDescription: string;
    deleteAccount: string;
    deleteTitle: string;
    deleteWarning: string;
    deleteItem1: string;
    deleteItem2: string;
    deleteItem3: string;
    deleteItem4: string;
    typeDelete: string;
    deleting: string;
    deleteSuccess: string;
    deleteFailed: string;
  };
  settingsPrompts: {
    title: string;
    description: string;
    gptInstructions: string;
    gptInstructionsDesc: string;
    researchSystem: string;
    researchSystemDesc: string;
    researchQuery: string;
    researchQueryDesc: string;
    summaryPolish: string;
    summaryPolishDesc: string;
    hashtagGenerator: string;
    hashtagGeneratorDesc: string;
    imageGenerator: string;
    imageGeneratorDesc: string;
  };
  settingsImages: {
    title: string;
    description: string;
    modelLabel: string;
    modelNotes: string;
    geminiNote: string;
    dalleNote: string;
    flashNote: string;
    accessTip: string;
  };
  settingsGuardrails: {
    title: string;
    description: string;
    bannedPhrases: string;
    bannedPhrasesDesc: string;
    disclaimers: string;
    disclaimersDesc: string;
    noClickbait: string;
    noClickbaitDesc: string;
    allowLinks: string;
    allowLinksDesc: string;
    enforceRules: string;
    enforceRulesDesc: string;
    maxHashtags: string;
    dedupeThreshold: string;
    dedupeDesc: string;
    saveChanges: string;
    aiSuggestions: string;
    aiSuggestionsDesc: string;
    contextLabel: string;
    contextPlaceholder: string;
    getSuggestions: string;
    suggestions: string;
    suggestedBanned: string;
    suggestedDisclaimers: string;
    recommendedRules: string;
    apply: string;
    addBannedPlaceholder: string;
    addDisclaimerPlaceholder: string;
  };
  auth: {
    signIn: string;
    signUp: string;
    email: string;
    password: string;
    forgotPassword: string;
    noAccount: string;
    hasAccount: string;
    welcomeBack: string;
    createAccount: string;
  };
  ai: {
    generating: string;
    regenerate: string;
    generated: string;
    failed: string;
  };
  settingsApiKeys: {
    title: string;
    description: string;
    required: string;
    optional: string;
    configured: string;
    notConfigured: string;
    update: string;
    removed: string;
    securityNote: string;
    noKeysWarning: string;
    howItWorks: string;
    howItWorks1: string;
    howItWorks2: string;
    howItWorks3: string;
    howItWorks4: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      confirm: 'Confirm',
      search: 'Search',
      filter: 'Filter',
      all: 'All',
      none: 'None',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      close: 'Close',
      open: 'Open',
      view: 'View',
      download: 'Download',
      upload: 'Upload',
      refresh: 'Refresh',
      retry: 'Retry',
      signOut: 'Sign Out',
      role: 'Role',
      reset: 'Reset',
      characters: 'characters',
      modified: 'Modified',
      adminOnly: '(View only - Admin access required)',
    },
    navigation: {
      dashboard: 'Dashboard',
      topics: 'Topics',
      drafts: 'Drafts',
      assets: 'Assets',
      schedule: 'Schedule',
      published: 'Published',
      settings: 'Settings',
      content: 'Content',
      system: 'System',
    },
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Manage your LinkedIn content pipeline',
      aiToolsResearched: 'AI Tools Researched',
      draftsCount: 'Drafts',
      approved: 'Approved',
      publishedCount: 'Published',
      recentAITools: 'Recent AI Tools',
      recentDrafts: 'Recent Drafts',
      research: 'Research',
      viewAll: 'View All',
      noAITools: 'No AI tools yet. Research some!',
      noDrafts: 'No drafts yet. Create one from an AI tool!',
    },
    topics: {
      title: 'AI Tools Research',
      subtitle: 'Discover and curate AI tools for LinkedIn posts',
      research: 'Research',
      generateTopics: 'Generate Topics',
      createDraft: 'Create Draft',
      archive: 'Archive',
      shortlist: 'Shortlist',
      new: 'New',
      shortlisted: 'Shortlisted',
      archived: 'Archived',
      noTopics: 'No topics yet',
      researchAITools: 'Research AI Tools',
      discoverDescription: 'Click "Research AI Tools" to discover the latest AI tools from GitHub, Taaft, and more',
      noToolsYet: 'No AI tools discovered yet',
      startResearch: 'Start Research',
      selectAll: 'Select All',
      clear: 'Clear',
      selected: 'selected',
      toDrafts: 'To Drafts',
      showMore: 'Show more',
      showLess: 'Show less',
      summary: 'Summary',
      fullContent: 'Full Content',
      visitTool: 'Visit Tool',
      viewSource: 'View Source',
      used: 'Used',
    },
    research: {
      title: 'Research AI Tools',
      description: 'Search for the latest practical AI tools from GitHub, Taaft, and other sources. Results will be summarized for easy LinkedIn post creation.',
      searchQuery: 'Search Query (optional)',
      quickPicks: 'Quick picks',
      numberOfResults: 'Number of results',
      searching: 'Researching...',
    },
    assetDetail: {
      title: 'Asset Details',
      prompt: 'Prompt',
      created: 'Created',
      model: 'Model',
      size: 'Size',
      copyUrl: 'Copy URL',
      noImage: 'No image available',
      invalidUrl: 'Invalid image URL - please regenerate this image',
      urlCopied: 'URL copied to clipboard',
      downloadStarted: 'Download started',
      downloadFailed: 'Failed to download image',
    },
    drafts: {
      title: 'Drafts',
      subtitle: 'Manage your LinkedIn post drafts',
      newDraft: 'New Draft',
      editDraft: 'Edit Draft',
      postContent: 'Post Content',
      imageDescription: 'Image Description',
      hashtags: 'Hashtags',
      preview: 'LinkedIn Preview',
      publish: 'Publish',
      schedule: 'Schedule',
      approve: 'Approve',
      rewrite: 'Rewrite',
      generateHashtags: 'Hashtags',
      generateImage: 'Generate Image',
      chooseFromLibrary: 'Choose from Library',
      fetchFromSource: 'Fetch from Source',
      noDrafts: 'No drafts yet',
      status: {
        draft: 'Draft',
        in_review: 'In Review',
        approved: 'Approved',
        scheduled: 'Scheduled',
        published: 'Published',
      },
      rewriteOptions: {
        tighten: 'Tighten',
        expand: 'Expand',
        addCta: 'Add CTA',
        founderTone: 'Founder Voice',
        educational: 'Educational',
        contrarian: 'Contrarian',
        storyMode: 'Story Mode',
        translateTo: 'Translate',
        translateHebrew: '🇮🇱 Hebrew',
        translateEnglish: '🇺🇸 English',
      },
      versionHistory: 'Version History',
      original: 'Original',
      noVersions: 'No versions yet',
    },
    assets: {
      title: 'Assets',
      subtitle: 'Manage your images and media',
      upload: 'Upload',
      generate: 'Generate',
      noAssets: 'No assets yet',
      aiGenerated: 'AI Generated',
      uploaded: 'Uploaded',
    },
    schedule: {
      title: 'Schedule',
      subtitle: 'View and manage scheduled posts',
      noScheduled: 'No scheduled posts',
      scheduledFor: 'Scheduled for',
    },
    published: {
      title: 'Published',
      subtitle: 'Track your published content performance',
      noPublished: 'No published posts yet',
      impressions: 'Impressions',
      likes: 'Likes',
      comments: 'Comments',
      viewPreview: 'View Preview',
      publishedOn: 'Published on',
      manualPublish: 'Manual',
      linkedInPost: 'View on LinkedIn',
    },
    settings: {
      title: 'Settings',
      subtitle: 'Configure your content studio',
      linkedin: 'LinkedIn',
      prompts: 'Prompts',
      images: 'Images',
      guardrails: 'Guardrails',
      language: 'Language',
      linkedinConnection: 'LinkedIn Connection',
      linkedinDescription: 'Connect your LinkedIn profile for direct publishing',
      connect: 'Connect LinkedIn',
      reconnect: 'Reconnect',
      disconnect: 'Disconnect',
      connected: 'Connected',
      expired: 'Expired',
      checkingConnection: 'Checking connection...',
      connectDescription: 'Connect your LinkedIn account to publish posts directly from this platform.',
      connectedOn: 'Connected',
      tokenExpires: 'Token expires',
      languageSettings: 'Language Settings',
      languageDescription: 'Configure your preferred languages for the interface and content generation',
      uiLanguage: 'Interface Language',
      uiLanguageDescription: 'The language used for menus, buttons, and navigation',
      contentLanguage: 'Default Content Language',
      contentLanguageDescription: 'The default language for generating LinkedIn posts',
      english: 'English',
      hebrew: 'עברית (Hebrew)',
      account: 'Account',
    },
    settingsAccount: {
      title: 'Account Information',
      description: 'View your account details',
      email: 'Email',
      displayName: 'Display Name',
      memberSince: 'Member Since',
      dangerZone: 'Danger Zone',
      dangerDescription: 'Permanently delete your account and all associated data',
      deleteAccount: 'Delete Account',
      deleteTitle: 'Delete Account Permanently',
      deleteWarning: 'This action cannot be undone. This will permanently delete:',
      deleteItem1: 'All your drafts and published posts',
      deleteItem2: 'All your topics and research data',
      deleteItem3: 'All your images and assets',
      deleteItem4: 'Your LinkedIn connection and settings',
      typeDelete: 'Type DELETE to confirm',
      deleting: 'Deleting...',
      deleteSuccess: 'Account deleted successfully',
      deleteFailed: 'Failed to delete account. Please try again.',
    },
    settingsPrompts: {
      title: 'AI Prompts',
      description: 'Configure prompts for research, content generation, and images',
      gptInstructions: 'GPT Master Instructions',
      gptInstructionsDesc: 'Your Custom GPT personality and writing guidelines for LinkedIn posts',
      researchSystem: 'AI Research System Prompt',
      researchSystemDesc: 'Instructions for finding and analyzing AI tools',
      researchQuery: 'AI Research Query',
      researchQueryDesc: 'Default search query for discovering tools',
      summaryPolish: 'Summary Polish Prompt',
      summaryPolishDesc: 'Transforms raw research into LinkedIn-ready summaries',
      hashtagGenerator: 'Hashtag Generator Prompt',
      hashtagGeneratorDesc: 'Generates relevant hashtags for posts',
      imageGenerator: 'Image Generator Prompt',
      imageGeneratorDesc: 'Creates image descriptions for AI generation',
    },
    settingsImages: {
      title: 'Image Generation Settings',
      description: 'Choose the AI model for generating images for your LinkedIn posts',
      modelLabel: 'Image Generation Model',
      modelNotes: 'Model Notes',
      geminiNote: '500 free images per day with any Gemini API key',
      dalleNote: 'Requires OpenAI API key with credits',
      flashNote: 'Requires a paid Gemini API key for highest quality',
      accessTip: 'You can access this setting from the draft editor via the Image dropdown → "Choose Model"',
    },
    settingsGuardrails: {
      title: 'Content Rules',
      description: 'Define guardrails for content quality and compliance',
      bannedPhrases: 'Banned Phrases',
      bannedPhrasesDesc: 'Words or phrases that should never appear in content',
      disclaimers: 'Required Disclaimers',
      disclaimersDesc: 'Disclaimers that must be included when applicable',
      noClickbait: 'No Clickbait',
      noClickbaitDesc: 'Avoid sensational language',
      allowLinks: 'Allow Links',
      allowLinksDesc: 'Permit URLs in content',
      enforceRules: 'Enforce Rules',
      enforceRulesDesc: 'Block vs. warn on violations',
      maxHashtags: 'Max Hashtags',
      dedupeThreshold: 'Duplicate Detection Threshold',
      dedupeDesc: 'Similarity threshold for flagging duplicate content',
      saveChanges: 'Save Changes',
      aiSuggestions: 'AI Suggestions',
      aiSuggestionsDesc: 'Get AI-powered guardrail recommendations based on your context',
      contextLabel: 'Describe your context',
      contextPlaceholder: 'e.g., B2B SaaS company targeting enterprise CTOs, focused on AI/ML content. We want professional, authoritative content without hype...',
      getSuggestions: 'Get AI Suggestions',
      suggestions: 'Suggestions',
      suggestedBanned: 'Suggested Banned Phrases',
      suggestedDisclaimers: 'Suggested Disclaimers',
      recommendedRules: 'Recommended Rules',
      apply: 'Apply',
      addBannedPlaceholder: 'Add banned phrase...',
      addDisclaimerPlaceholder: 'Add disclaimer...',
    },
    auth: {
      signIn: 'Sign In',
      signUp: 'Sign Up',
      email: 'Email',
      password: 'Password',
      forgotPassword: 'Forgot password?',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      welcomeBack: 'Welcome back',
      createAccount: 'Create an account',
    },
    ai: {
      generating: 'Generating...',
      regenerate: 'Regenerate',
      generated: 'Generated',
      failed: 'Generation failed',
    },
    settingsApiKeys: {
      title: 'API Keys',
      description: 'Configure your AI provider API keys. Your keys are stored securely and never shared.',
      required: 'Required',
      optional: 'Optional',
      configured: 'Configured',
      notConfigured: 'Not configured',
      update: 'Update',
      removed: 'API key removed',
      securityNote: 'Your API keys are stored securely in the database and are only used server-side. They are never exposed to the browser.',
      noKeysWarning: 'At least one AI key (Gemini or ChatGPT) is required to use AI features. Gemini offers a free tier at Google AI Studio.',
      howItWorks: 'How it works',
      howItWorks1: 'Gemini and ChatGPT are equal priority for drafts, hashtags, and rewrites - use whichever you prefer',
      howItWorks2: 'Perplexity is used for research when available; otherwise Gemini with web grounding is used',
      howItWorks3: 'Firecrawl enables detailed content scraping - without it, only AI summaries are shown',
      howItWorks4: 'For images, Gemini is the default; DALL-E is available if you add an OpenAI key',
    },
  },
  he: {
    common: {
      save: 'שמור',
      cancel: 'ביטול',
      delete: 'מחק',
      edit: 'ערוך',
      create: 'צור',
      loading: 'טוען...',
      error: 'שגיאה',
      success: 'הצלחה',
      confirm: 'אישור',
      search: 'חיפוש',
      filter: 'סינון',
      all: 'הכל',
      none: 'אף אחד',
      back: 'חזור',
      next: 'הבא',
      previous: 'הקודם',
      close: 'סגור',
      open: 'פתח',
      view: 'הצג',
      download: 'הורד',
      upload: 'העלה',
      refresh: 'רענן',
      retry: 'נסה שוב',
      signOut: 'התנתק',
      role: 'תפקיד',
      reset: 'איפוס',
      characters: 'תווים',
      modified: 'שונה',
      adminOnly: '(צפייה בלבד - נדרשת הרשאת מנהל)',
    },
    navigation: {
      dashboard: 'לוח בקרה',
      topics: 'נושאים',
      drafts: 'טיוטות',
      assets: 'נכסים',
      schedule: 'לוח זמנים',
      published: 'פורסמו',
      settings: 'הגדרות',
      content: 'תוכן',
      system: 'מערכת',
    },
    dashboard: {
      title: 'לוח בקרה',
      subtitle: 'נהל את צינור התוכן שלך בלינקדאין',
      aiToolsResearched: 'כלי AI שנחקרו',
      draftsCount: 'טיוטות',
      approved: 'מאושרות',
      publishedCount: 'פורסמו',
      recentAITools: 'כלי AI אחרונים',
      recentDrafts: 'טיוטות אחרונות',
      research: 'מחקר',
      viewAll: 'הצג הכל',
      noAITools: 'אין עדיין כלי AI. חקור כמה!',
      noDrafts: 'אין עדיין טיוטות. צור אחת מכלי AI!',
    },
    topics: {
      title: 'מחקר כלי AI',
      subtitle: 'גלה ואסוף כלי AI לפוסטים בלינקדאין',
      research: 'מחקר',
      generateTopics: 'צור נושאים',
      createDraft: 'צור טיוטה',
      archive: 'ארכיון',
      shortlist: 'רשימה מקוצרת',
      new: 'חדש',
      shortlisted: 'ברשימה מקוצרת',
      archived: 'בארכיון',
      noTopics: 'אין עדיין נושאים',
      researchAITools: 'חקור כלי AI',
      discoverDescription: 'לחץ על "חקור כלי AI" כדי לגלות את כלי ה-AI העדכניים ביותר מ-GitHub, Taaft ועוד',
      noToolsYet: 'לא נמצאו עדיין כלי AI',
      startResearch: 'התחל מחקר',
      selectAll: 'בחר הכל',
      clear: 'נקה',
      selected: 'נבחרו',
      toDrafts: 'לטיוטות',
      showMore: 'הצג עוד',
      showLess: 'הצג פחות',
      summary: 'סיכום',
      fullContent: 'תוכן מלא',
      visitTool: 'בקר בכלי',
      viewSource: 'הצג מקור',
      used: 'בשימוש',
    },
    research: {
      title: 'חקור כלי AI',
      description: 'חפש את כלי ה-AI המעשיים האחרונים מ-GitHub, Taaft ומקורות נוספים. התוצאות יסוכמו ליצירת פוסטים קלה בלינקדאין.',
      searchQuery: 'שאילתת חיפוש (אופציונלי)',
      quickPicks: 'בחירות מהירות',
      numberOfResults: 'מספר תוצאות',
      searching: 'מחפש...',
    },
    assetDetail: {
      title: 'פרטי נכס',
      prompt: 'פרומפט',
      created: 'נוצר',
      model: 'מודל',
      size: 'גודל',
      copyUrl: 'העתק קישור',
      noImage: 'אין תמונה זמינה',
      invalidUrl: 'קישור תמונה לא תקין - נא ליצור מחדש',
      urlCopied: 'הקישור הועתק ללוח',
      downloadStarted: 'ההורדה החלה',
      downloadFailed: 'ההורדה נכשלה',
    },
    drafts: {
      title: 'טיוטות',
      subtitle: 'נהל את טיוטות הפוסטים שלך בלינקדאין',
      newDraft: 'טיוטה חדשה',
      editDraft: 'ערוך טיוטה',
      postContent: 'תוכן הפוסט',
      imageDescription: 'תיאור התמונה',
      hashtags: 'האשטאגים',
      preview: 'תצוגה מקדימה',
      publish: 'פרסם',
      schedule: 'תזמן',
      approve: 'אשר',
      rewrite: 'כתוב מחדש',
      generateHashtags: 'האשטאגים',
      generateImage: 'צור תמונה',
      chooseFromLibrary: 'בחר מהספרייה',
      fetchFromSource: 'הבא מהמקור',
      noDrafts: 'אין עדיין טיוטות',
      status: {
        draft: 'טיוטה',
        in_review: 'בבדיקה',
        approved: 'מאושר',
        scheduled: 'מתוזמן',
        published: 'פורסם',
      },
      rewriteOptions: {
        tighten: 'קצר',
        expand: 'הרחב',
        addCta: 'הוסף קריאה לפעולה',
        founderTone: 'קול מייסד',
        educational: 'חינוכי',
        contrarian: 'נגד הזרם',
        storyMode: 'סיפור',
        translateTo: 'תרגם',
        translateHebrew: '🇮🇱 עברית',
        translateEnglish: '🇺🇸 אנגלית',
      },
      versionHistory: 'היסטוריית גרסאות',
      original: 'מקורי',
      noVersions: 'אין עדיין גרסאות',
    },
    assets: {
      title: 'נכסים',
      subtitle: 'נהל את התמונות והמדיה שלך',
      upload: 'העלה',
      generate: 'צור',
      noAssets: 'אין עדיין נכסים',
      aiGenerated: 'נוצר ע"י AI',
      uploaded: 'הועלה',
    },
    schedule: {
      title: 'לוח זמנים',
      subtitle: 'צפה ונהל פוסטים מתוזמנים',
      noScheduled: 'אין פוסטים מתוזמנים',
      scheduledFor: 'מתוזמן ל',
    },
    published: {
      title: 'פורסמו',
      subtitle: 'עקוב אחר ביצועי התוכן שפורסם',
      noPublished: 'עדיין לא פורסמו פוסטים',
      impressions: 'חשיפות',
      likes: 'לייקים',
      comments: 'תגובות',
      viewPreview: 'צפה בתצוגה מקדימה',
      publishedOn: 'פורסם ב',
      manualPublish: 'ידני',
      linkedInPost: 'צפה בלינקדאין',
    },
    settings: {
      title: 'הגדרות',
      subtitle: 'הגדר את סטודיו התוכן שלך',
      linkedin: 'לינקדאין',
      prompts: 'פרומפטים',
      images: 'תמונות',
      guardrails: 'מגבלות',
      language: 'שפה',
      linkedinConnection: 'חיבור לינקדאין',
      linkedinDescription: 'חבר את פרופיל הלינקדאין שלך לפרסום ישיר',
      connect: 'חבר לינקדאין',
      reconnect: 'התחבר מחדש',
      disconnect: 'נתק',
      connected: 'מחובר',
      expired: 'פג תוקף',
      checkingConnection: 'בודק חיבור...',
      connectDescription: 'חבר את חשבון הלינקדאין שלך כדי לפרסם פוסטים ישירות מפלטפורמה זו.',
      connectedOn: 'מחובר מאז',
      tokenExpires: 'התוקף פג ב',
      languageSettings: 'הגדרות שפה',
      languageDescription: 'הגדר את השפות המועדפות עליך לממשק וליצירת תוכן',
      uiLanguage: 'שפת הממשק',
      uiLanguageDescription: 'השפה המשמשת לתפריטים, כפתורים וניווט',
      contentLanguage: 'שפת תוכן ברירת מחדל',
      contentLanguageDescription: 'שפת ברירת המחדל ליצירת פוסטים בלינקדאין',
      english: 'English (אנגלית)',
      hebrew: 'עברית',
      account: 'חשבון',
    },
    settingsAccount: {
      title: 'פרטי חשבון',
      description: 'צפה בפרטי החשבון שלך',
      email: 'אימייל',
      displayName: 'שם תצוגה',
      memberSince: 'חבר מאז',
      dangerZone: 'אזור סכנה',
      dangerDescription: 'מחק לצמיתות את החשבון שלך ואת כל הנתונים המשויכים',
      deleteAccount: 'מחק חשבון',
      deleteTitle: 'מחק חשבון לצמיתות',
      deleteWarning: 'לא ניתן לבטל פעולה זו. הפעולה תמחק לצמיתות:',
      deleteItem1: 'כל הטיוטות והפוסטים שפורסמו',
      deleteItem2: 'כל הנושאים ונתוני המחקר',
      deleteItem3: 'כל התמונות והנכסים',
      deleteItem4: 'חיבור הלינקדאין וההגדרות שלך',
      typeDelete: 'הקלד DELETE לאישור',
      deleting: 'מוחק...',
      deleteSuccess: 'החשבון נמחק בהצלחה',
      deleteFailed: 'מחיקת החשבון נכשלה. נסה שוב.',
    },
    settingsPrompts: {
      title: 'פרומפטים של AI',
      description: 'הגדר פרומפטים למחקר, יצירת תוכן ותמונות',
      gptInstructions: 'הוראות GPT ראשיות',
      gptInstructionsDesc: 'האישיות והנחיות הכתיבה של ה-GPT המותאם אישית לפוסטים בלינקדאין',
      researchSystem: 'פרומפט מערכת למחקר AI',
      researchSystemDesc: 'הוראות לאיתור וניתוח כלי AI',
      researchQuery: 'שאילתת מחקר AI',
      researchQueryDesc: 'שאילתת חיפוש ברירת מחדל לגילוי כלים',
      summaryPolish: 'פרומפט ליטוש סיכום',
      summaryPolishDesc: 'הופך מחקר גולמי לסיכומים מוכנים ללינקדאין',
      hashtagGenerator: 'פרומפט יצירת האשטאגים',
      hashtagGeneratorDesc: 'מייצר האשטאגים רלוונטיים לפוסטים',
      imageGenerator: 'פרומפט יצירת תמונות',
      imageGeneratorDesc: 'יוצר תיאורי תמונות ליצירה באמצעות AI',
    },
    settingsImages: {
      title: 'הגדרות יצירת תמונות',
      description: 'בחר את מודל ה-AI ליצירת תמונות לפוסטים שלך בלינקדאין',
      modelLabel: 'מודל יצירת תמונות',
      modelNotes: 'הערות על המודלים',
      geminiNote: '500 תמונות חינם ליום עם כל מפתח API של Gemini',
      dalleNote: 'דורש מפתח API של OpenAI עם קרדיטים',
      flashNote: 'דורש מפתח Gemini API בתשלום לאיכות הגבוהה ביותר',
      accessTip: 'ניתן לגשת להגדרה זו מעורך הטיוטה דרך תפריט תמונה → "בחר מודל"',
    },
    settingsGuardrails: {
      title: 'כללי תוכן',
      description: 'הגדר מגבלות לאיכות תוכן ותאימות',
      bannedPhrases: 'ביטויים אסורים',
      bannedPhrasesDesc: 'מילים או ביטויים שלעולם לא צריכים להופיע בתוכן',
      disclaimers: 'הצהרות נדרשות',
      disclaimersDesc: 'הצהרות שחייבות להיכלל במידת הצורך',
      noClickbait: 'ללא קליקבייט',
      noClickbaitDesc: 'הימנע משפה סנסציונית',
      allowLinks: 'אפשר קישורים',
      allowLinksDesc: 'התר כתובות URL בתוכן',
      enforceRules: 'אכוף כללים',
      enforceRulesDesc: 'חסום לעומת הזהר על הפרות',
      maxHashtags: 'מקסימום האשטאגים',
      dedupeThreshold: 'סף זיהוי כפילויות',
      dedupeDesc: 'סף דמיון לסימון תוכן כפול',
      saveChanges: 'שמור שינויים',
      aiSuggestions: 'הצעות AI',
      aiSuggestionsDesc: 'קבל המלצות מגבלות מונעות AI בהתבסס על ההקשר שלך',
      contextLabel: 'תאר את ההקשר שלך',
      contextPlaceholder: 'לדוגמה, חברת B2B SaaS שמכוונת לסמנכ"לי טכנולוגיה בארגונים, מתמקדת בתוכן AI/ML. אנחנו רוצים תוכן מקצועי וסמכותי ללא הייפ...',
      getSuggestions: 'קבל הצעות AI',
      suggestions: 'הצעות',
      suggestedBanned: 'ביטויים אסורים מוצעים',
      suggestedDisclaimers: 'הצהרות מוצעות',
      recommendedRules: 'כללים מומלצים',
      apply: 'החל',
      addBannedPlaceholder: 'הוסף ביטוי אסור...',
      addDisclaimerPlaceholder: 'הוסף הצהרה...',
    },
    auth: {
      signIn: 'התחבר',
      signUp: 'הירשם',
      email: 'אימייל',
      password: 'סיסמה',
      forgotPassword: 'שכחת סיסמה?',
      noAccount: 'אין לך חשבון?',
      hasAccount: 'יש לך כבר חשבון?',
      welcomeBack: 'ברוך הבא',
      createAccount: 'צור חשבון',
    },
    ai: {
      generating: 'מייצר...',
      regenerate: 'צור מחדש',
      generated: 'נוצר',
      failed: 'היצירה נכשלה',
    },
    settingsApiKeys: {
      title: 'מפתחות API',
      description: 'הגדר את מפתחות ה-API של ספקי ה-AI שלך. המפתחות שלך מאוחסנים באופן מאובטח ולעולם לא משותפים.',
      required: 'נדרש',
      optional: 'אופציונלי',
      configured: 'מוגדר',
      notConfigured: 'לא מוגדר',
      update: 'עדכן',
      removed: 'מפתח API הוסר',
      securityNote: 'מפתחות ה-API שלך מאוחסנים באופן מאובטח במסד הנתונים ומשמשים רק בצד השרת. הם לעולם לא נחשפים לדפדפן.',
      noKeysWarning: 'נדרש לפחות מפתח AI אחד (Gemini או ChatGPT) לשימוש בתכונות AI. ל-Gemini יש שכבה חינמית ב-Google AI Studio.',
      howItWorks: 'איך זה עובד',
      howItWorks1: 'Gemini ו-ChatGPT בעדיפות שווה לטיוטות, האשטאגים ושכתובים - השתמש במה שאתה מעדיף',
      howItWorks2: 'Perplexity משמש למחקר כשזמין; אחרת Gemini עם חיפוש אינטרנט',
      howItWorks3: 'Firecrawl מאפשר גרידת תוכן מפורטת - בלעדיו, רק סיכומי AI מוצגים',
      howItWorks4: 'לתמונות, Gemini הוא ברירת המחדל; DALL-E זמין אם תוסיף מפתח OpenAI',
    },
  },
};
