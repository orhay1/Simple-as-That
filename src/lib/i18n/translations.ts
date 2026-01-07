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
    };
    language: string;
    selectLanguage: string;
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
  };
  settings: {
    title: string;
    subtitle: string;
    linkedin: string;
    prompts: string;
    tone: string;
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
      title: 'Topics',
      subtitle: 'Research and manage your content ideas',
      research: 'Research',
      generateTopics: 'Generate Topics',
      createDraft: 'Create Draft',
      archive: 'Archive',
      shortlist: 'Shortlist',
      new: 'New',
      shortlisted: 'Shortlisted',
      archived: 'Archived',
      noTopics: 'No topics yet',
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
      },
      language: 'Language',
      selectLanguage: 'Select language',
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
    },
    settings: {
      title: 'Settings',
      subtitle: 'Configure your content studio',
      linkedin: 'LinkedIn',
      prompts: 'Prompts',
      tone: 'Tone',
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
      title: 'נושאים',
      subtitle: 'חקור ונהל את רעיונות התוכן שלך',
      research: 'מחקר',
      generateTopics: 'צור נושאים',
      createDraft: 'צור טיוטה',
      archive: 'ארכיון',
      shortlist: 'רשימה מקוצרת',
      new: 'חדש',
      shortlisted: 'ברשימה מקוצרת',
      archived: 'בארכיון',
      noTopics: 'אין עדיין נושאים',
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
      },
      language: 'שפה',
      selectLanguage: 'בחר שפה',
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
    },
    settings: {
      title: 'הגדרות',
      subtitle: 'הגדר את סטודיו התוכן שלך',
      linkedin: 'לינקדאין',
      prompts: 'פרומפטים',
      tone: 'טון',
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
  },
};
