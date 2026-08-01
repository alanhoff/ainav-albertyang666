const enTranslations = {
  brand: "AI Directory",
  siteName: "AI Directory - ainav.space",
  siteDescription:
    "ainav.space - The best AI tools directory featuring ChatGPT, Midjourney, and 500+ AI tools for writing, image, video, coding and more.",
  keywords: [
    "AI tools directory",
    "best AI tools",
    "AI software collection",
    "ChatGPT alternatives",
    "AI writing tools",
    "AI image generators",
    "AI video tools",
    "AI coding assistants",
    "free AI tools",
    "Artificial Intelligence",
    "AI productivity",
  ],
  nav: {
    home: "Home",
    search: "Search",
    about: "About",
    submit: "Submit",
    bookmarks: "Bookmarks",
  },
  hero: {
    title: "Discover the best AI tools",
    subtitle:
      "Curated AI websites to help you explore the AI world efficiently",
  },
  stats: {
    tools: "AI Tools",
    categories: "Categories",
    featured: "Featured",
  },
  sections: {
    browseCategories: "Browse Categories",
    featured: "Featured Picks",
    viewAll: "View All",
  },
  newsletter: {
    title: "Stay Updated with AI Innovations",
    description: "Get weekly updates on the latest AI tools, trends, and resources directly to your inbox.",
    placeholder: "Enter your email",
    button: "Subscribe",
    privacy: "We respect your privacy. Unsubscribe at any time.",
  },
  unsubscribe: {
    successTitle: "Successfully Unsubscribed",
    emailRemoved: "has been removed from our mailing list.",
    noMoreEmails: "You will no longer receive email updates from AI Directory.",
    changedMind: "Changed your mind?",
    returnHome: "Return to Home",
    safetyNote: "If you didn't request this, you can safely ignore this page.",
  },
  search: {
    title: "Search AI tools",
    results: (query: string, count: number) =>
      `Search "${query}" - ${count} results`,
    noResultsTitle: "No matching tools found",
    noResultsHint: 'Try other keywords like "chat", "image", or "coding"',
    emptyTitle: "Start searching",
    emptyHint: "Enter keywords to find the AI tools you need",
    placeholder: "Search AI tools...",
    button: "Search",
    filters: {
      category: "Filter by Category",
      allCategories: "All Categories",
      pricing: "Filter by Pricing",
      allPricing: "All Pricing",
      sortBy: "Sort By",
      defaultSort: "Default",
      relevance: "Relevance",
      rating: "Highest Rating",
      reviewCount: "Most Reviews",
      nameAsc: "Name A-Z",
      nameDesc: "Name Z-A",
    },
  },
  category: {
    count: (count: number) => `${count} tools found`,
    empty: "No tools in this category yet",
  },
  categoryIntros: {
    chat: "Conversational AI tools let you interact naturally with AI to handle writing, analysis, translation, coding, and more. Whether for daily work or creative tasks, tools like ChatGPT, Claude, and Gemini all offer free tiers — try them before upgrading.",
    image: "AI image generators have made \"text-to-image\" creation accessible to everyone, ideal for designers, creators, and marketers. Midjourney excels in artistic style, Stable Diffusion supports local deployment, and DALL·E integrates deeply with ChatGPT. Choose based on your use case.",
    video: "AI video tools make it possible for solo creators to produce professional-quality content. Sora, Runway, and Pika support text-to-video or video remixing. Check the free usage limits and resolution caps before committing to a paid plan.",
    writing: "AI writing tools dramatically boost content output for bloggers, copywriters, and researchers. They support long-form content, short copy, headline optimization, and SEO writing. Use AI to draft, then refine manually for best results.",
    coding: "AI coding assistants are a must-have for modern developers, helping with code completion, bug fixes, documentation, and unit tests. GitHub Copilot offers the smoothest IDE integration, while Cursor leads the \"AI editor\" paradigm. Start with the free trial.",
    voice: "AI voice tools cover speech synthesis, voice cloning, and real-time voice changing — widely used for audiobooks, podcasting, and voiceovers. ElevenLabs leads in near-human quality, while Whisper is one of the most accurate open-source speech recognition models.",
    search: "AI-powered search engines go beyond keywords, offering semantic understanding, real-time retrieval, and follow-up queries. Perplexity is great for research, You.com for customizable search. Use alongside traditional search engines for best coverage.",
    productivity: "AI productivity tools span task management, meeting summaries, and knowledge bases, designed to boost efficiency for individuals and teams. Notion AI combines notes with AI, and Taskade supports team collaboration. Choose based on team size and workflow.",
    design: "AI design tools let non-designers create high-quality visuals quickly, covering UI/UX, posters, brand assets, and presentations. Canva's AI features suit beginners, while Figma-tier tools are better for professional teams.",
    music: "AI music tools let you compose songs from scratch, create background music, or generate sung vocals — great for short video creators, game developers, and music enthusiasts. Suno and Udio are the most talked-about AI composition tools, both with free tiers.",
    translation: "AI translation tools now approach professional-grade quality, supporting real-time translation, document translation, and website localization. DeepL leads in natural-sounding output, while Google Translate offers the broadest language coverage.",
    data: "AI data tools help analysts, business teams, and researchers uncover patterns, generate reports, and build visualizations — without writing SQL. They lower the barrier to data analysis and are ideal for descriptive analysis and trend forecasting.",
    education: "AI education tools support personalized learning paths, smart question banks, Q&A tutoring, and exercise feedback — useful for students, teachers, and exam candidates. Khanmigo and Duolingo Max are mature products that have successfully integrated AI.",
    marketing: "AI marketing tools cover content creation, ad design, SEO optimization, and user research — helping marketing teams and solo entrepreneurs improve growth and brand reach. HubSpot and Jasper stand out for end-to-end marketing workflow integration.",
    "3d": "AI 3D tools are transforming workflows for game development, architectural visualization, and metaverse content creation, dramatically lowering the barrier to 3D modeling. Current tools suit concept validation and prototyping; professional 3D modeling still benefits from specialized software.",
    avatar: "AI avatar tools generate stylized virtual characters, digital presenter videos, and personalized profile pictures — widely used for solo-creator videos, game character design, and social media content. Check output licensing and commercial usage rights before publishing.",
  },
  submit: {
    title: "Submit a new AI tool",
    subtitle: "Found a great AI tool? Share it with the community!",
    flowTitle: "Submission process",
    flowSteps: [
      {
        title: "Fill in tool information",
        description: "Provide the tool name, URL, and a clear description",
      },
      {
        title: "Submit form",
        description: "Click submit to save the tool information for review",
      },
      {
        title: "Review and publish",
        description:
          "We will review your submission and add it to the directory",
      },
    ],
    requirementsTitle: "📋 Requirements",
    requirements: [
      "The tool or service must be available and working",
      "Provide accurate information and a valid link",
      "Clear description that reflects the main features",
      "No illegal or malicious content",
      "Preference for tools with real value and good feedback",
    ],
  },
  submitForm: {
    labels: {
      name: "Tool name",
      url: "Website",
      description: "Description",
      category: "Category",
      pricing: "Pricing",
      tags: "Tags",
      email: "Your email",
    },
    placeholders: {
      name: "e.g. ChatGPT",
      url: "https://example.com",
      description: "Briefly describe what this AI tool does...",
      tags: "Comma separated, e.g. chat, writing, coding",
      email: "your@email.com",
    },
    tagsHint: "Use commas to separate tags",
    emailHint: "We may contact you to confirm details",
    submit: "Submit tool",
    submitting: "Submitting...",
    success:
      "✅ Thanks! We will review your submission and add it to the site soon.",
    error: "❌ Submission failed. Please try again later.",
    tip: "💡 Tip: After submission, we will review your tool and notify you via email once approved.",
  },
  pricing: {
    free: "Free",
    freemium: "Freemium",
    paid: "Paid",
  },
  serviceDetail: {
    backToCategory: '← Back to Category',
    visitWebsite: 'Visit Website',
    features: 'Features',
    keyFeatures: 'Key Features',
    useCases: 'Use Cases',
    howToUse: 'How to Use',
    quickStart: 'Quick Start',
    faq: 'FAQ',
    relatedTools: 'Related Tools',
  },
  footer: {
    copyright: "© 2026 ainav.space - Curated AI tools directory",
    tagline: "A curated AI tools directory featuring ChatGPT, Midjourney, and more to help you explore AI efficiently.",
    product: {
      title: "Product",
      home: "Home",
      search: "Search",
      submit: "Submit Tool",
    },
    resources: {
      title: "Resources",
      github: "GitHub",
      blog: "Blog",
      aboutUs: "About Us",
    },
    connect: {
      title: "Connect",
    },
    legal: {
      privacy: "Privacy Policy",
      terms: "Terms of Service",
    },
  },
  language: {
    switchLabel: "Language",
  },
  compare: {
    title: "Tool Comparison",
    description: "Compare AI tools side by side",
  },
  common: {
    back: "Back to category",
    visit: "Visit Website",
  },
  categories: {
    chat: {
      name: "AI Chat",
      description: "Conversational assistants and chatbots",
    },
    image: {
      name: "AI Image",
      description: "Image generation and editing tools",
    },
    video: {
      name: "AI Video",
      description: "Video generation and editing tools",
    },
    writing: {
      name: "AI Writing",
      description: "Content creation and copywriting",
    },
    coding: {
      name: "AI Coding",
      description: "Code generation and developer tools",
    },
    voice: {
      name: "AI Voice",
      description: "Speech synthesis and recognition",
    },
    search: { name: "AI Search", description: "AI-powered search engines" },
    productivity: {
      name: "AI Productivity",
      description: "Tools to boost productivity",
    },
    design: {
      name: "AI Design",
      description: "UI/Ux and creative design tools",
    },
    music: {
      name: "AI Music",
      description: "Music creation and audio processing",
    },
    translation: {
      name: "AI Translation",
      description: "Translation and localization tools",
    },
    data: { name: "AI Data", description: "Data analysis and visualization" },
    education: {
      name: "AI Education",
      description: "Learning and knowledge tools",
    },
    marketing: {
      name: "AI Marketing",
      description: "Marketing automation and content",
    },
    "3d": { name: "AI 3D", description: "3D modeling and virtual reality" },
    avatar: {
      name: "AI Avatar",
      description: "Virtual avatars and digital humans",
    },
  },
  reviews: {
    title: "Reviews & Ratings",
    ratingLabels: {
      1: "Poor",
      2: "Fair",
      3: "Good",
      4: "Very Good",
      5: "Excellent",
    },
    basedOn: (count: number) =>
      `Based on ${count} review${count !== 1 ? "s" : ""}`,
    shareTitle: "Share Your Experience",
    submit: {
      button: "Submit Review",
      submitting: "Submitting...",
      submitted: "Review Submitted",
      successMessage:
        "✓ Thank you! Your review will be published after moderation.",
      errorTooShort: "Review must be at least 10 characters",
      errorTooLong: "Review is too long (max 5000 characters)",
      minLength: 10,
      maxLength: 5000,
      titlePlaceholder: "Summary of your experience",
      contentPlaceholder: "Share your thoughts about this AI tool...",
    },
    loading: "Loading reviews...",
    recentTitle: "Recent Reviews",
    noReviews: "No reviews yet. Be the first to share your experience!",
    noReviewsHint: "There are no approved reviews yet.",
    helpful: "Helpful",
    notHelpful: "Not Helpful",
    alreadyVoted: "You have already voted on this review",
    voteError: "Failed to record your vote. Please try again.",
    votedHelpful: "👍 Thank you for your feedback!",
    votedUnhelpful: "👎 Thank you for your feedback!",
    pagination: {
      previous: "Previous",
      next: "Next",
      pageInfo: (page: number, totalPages: number) =>
        `Page ${page} of ${totalPages}`,
    },
  }
};

export default enTranslations;
