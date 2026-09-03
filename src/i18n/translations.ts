export type Locale = "en" | "tr";

export const translations = {
  en: {
    // Brand & Nav
    appName: "ClipMarket",
    adminCampaigns: "Admin Campaigns",
    browseCampaigns: "Browse Campaigns",
    mySubmissions: "My Submissions",
    devAuth: "[DEV AUTH]",
    selectUser: "Select User...",
    switchDevRole: "Switch Dev Role / User",
    language: "Language",

    // Landing Page
    landingTitle: "Creator Clip Marketplace",
    landingSubtitle:
      "Brands launch paid short-form video clipping campaigns. Creators submit TikTok, Instagram, and YouTube clips and earn per 1,000 views.",
    adminPortal: "Admin Portal",
    adminPortalDesc: "Manage budgets & review submissions",
    adminPortalContent:
      "Create campaigns, monitor real-time spent vs. remaining budgets, inspect view metrics charts, and approve or reject submissions in the review queue.",
    continueAsAdmin: "Continue as Admin (Sarah)",
    creatorPortal: "Creator Portal",
    creatorPortalDesc: "Submit video clips & track earnings",
    creatorPortalContent:
      "Browse active brand campaigns, submit your TikTok / Instagram / YouTube video links, and track your daily views and estimated earnings.",
    continueAsCreator: "Continue as Creator (Alex)",

    // Admin Campaigns List
    campaignsManagement: "Campaigns Management",
    campaignsSubtitle:
      "Monitor budgets, review creator video submissions, and track daily performance.",
    newCampaign: "New Campaign",
    searchPlaceholder: "Search campaign by title...",
    all: "All",
    active: "Active",
    draft: "Draft",
    paused: "Paused",
    completed: "Completed",
    noCampaignsFound: "No campaigns found.",
    adjustSearchTip: "Try adjusting your search or create a new campaign.",
    colTitle: "Campaign Title",
    colStatus: "Status",
    colPlatforms: "Platforms",
    colRate: "Rate / 1k",
    colBudget: "Total Budget",
    colDuration: "Duration",
    colActions: "Actions",
    reviewDetail: "Review & Detail",
    pageShowing: "Showing page {page} of {totalPages} ({total} total campaigns)",
    previous: "Previous",
    next: "Next",

    // Admin Campaign Detail
    backToCampaigns: "Back to Campaigns",
    editCampaign: "Edit Campaign",
    statusLabel: "Status",
    ratePer1k: "Rate: {rate} / 1k views",
    totalApprovedViews: "Total Approved Views",
    approvedViewsDesc: "Aggregated across all approved clips",
    budgetSpent: "Budget Spent",
    budgetLeft: "Budget Left",
    budgetAvailableDesc: "Available for pending/future approvals",
    pendingSubmissions: "Pending Submissions",
    awaitingReviewDesc: "Awaiting admin approval/rejection",
    dailyViewsTimeline: "Daily Views Timeline",
    dailyViewsDesc:
      "Daily aggregated view counts across the campaign period (zero-filled on days without metrics)",
    noMetricsAvailable: "No metric history available for this period.",
    approvalBlockedTitle: "Approval Blocked by Budget Ceiling",
    reviewQueueTitle: "Submissions Review Queue",
    reviewQueueSubtitle:
      "Review video clips, examine view numbers, and approve or reject submissions.",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    paid: "Paid",
    noSubmissionsMatching: "No submissions matching \"{filter}\".",
    colClipCreator: "Clip / Creator",
    colLatestViews: "Latest Views",
    colCostPayout: "Cost / Payout",
    approve: "Approve",
    reject: "Reject",
    reviewed: "Reviewed",
    rejectionReasonLabel: "Reason",

    // Modals - Create & Edit
    createCampaignTitle: "Create New Clipping Campaign",
    createCampaignDesc:
      "Configure platforms, payout per 1k views, budget ceiling, and duration.",
    editCampaignTitle: "Edit Campaign",
    editCampaignDesc:
      "Update campaign budget, payout rate, duration, or active status.",
    fieldTitle: "Campaign Title",
    fieldTitlePlaceholder: "e.g. Summer Fitness Energy Drink Challenge",
    fieldStatus: "Campaign Status",
    fieldPlatforms: "Supported Platforms",
    fieldPayoutDollar: "Payout per 1k Views ($)",
    fieldBudgetDollar: "Total Budget ($)",
    fieldStartsAt: "Starts At",
    fieldEndsAt: "Ends At",
    centsNote: "= {cents} cents (integer in DB)",
    cancel: "Cancel",
    saveChanges: "Save Changes",
    createCampaignBtn: "Create Campaign",

    // Modals - Reject
    rejectModalTitle: "Reject Submission",
    rejectModalDesc:
      "Please provide a clear reason for rejecting this clip submission (required).",
    rejectionReasonPlaceholder:
      "e.g. Video does not tag the campaign sponsor or violates content guidelines.",
    confirmRejection: "Confirm Rejection",
    reasonMinChars: "Reason must be at least 3 characters.",

    // Creator Pages
    activeCreatorCampaigns: "Active Creator Campaigns",
    creatorBrowseSubtitle:
      "Select an active campaign, submit your published short-form clips, and earn per 1,000 views.",
    viewMySubmissions: "View My Submissions",
    noActiveCampaigns: "No active campaigns right now.",
    checkBackSoon: "Check back soon for new brand launches.",
    payoutRate: "Payout Rate",
    per1kViews: "/ 1k views",
    endsOn: "Ends: {date}",
    submitClipBtn: "Submit Video Clip",
    submitClipModalTitle: "Submit Clip: {title}",
    submitClipModalDesc:
      "Provide a link to your public video post on an accepted platform.",
    choosePlatform: "Choose Platform",
    postUrlLabel: "Post URL ({platform})",
    urlDuplicateNotice:
      "The same URL cannot be submitted to the same campaign twice.",
    validUrlFormat: "✓ Valid URL format",
    invalidUrlFormat: "Invalid post URL",
    clipSubmittedSuccess: "Clip submitted successfully! Awaiting brand review.",
    clipQueuedDesc: "Your clip has been queued for admin verification.",
    close: "Close",
    goToMySubmissions: "Go to My Submissions",

    // My Submissions
    myClipSubmissions: "My Clip Submissions",
    mySubmissionsSubtitle:
      "Track the verification status, daily sync views, and estimated earnings of your videos.",
    browseMoreCampaigns: "Browse More Campaigns",
    totalSubmissions: "Total Submissions",
    totalTrackedViews: "Total Tracked Views",
    estimatedTotalEarnings: "Estimated Total Earnings",
    fromApprovedViews: "From approved clip views",
    noSubmissionsYet: "You have not submitted any clips yet.",
    noSubmissionsTip:
      "Browse active brand campaigns and submit your first video URL!",
    colCampaign: "Campaign",
    colPlatformLink: "Platform & Link",
    colCurrentViews: "Current Views",
    colEstimatedEarnings: "Estimated Earnings",
    colSubmittedOn: "Submitted On",
    pendingApproval: "Pending approval",
  },
  tr: {
    // Brand & Nav
    appName: "ClipMarket",
    adminCampaigns: "Yönetici Kampanyaları",
    browseCampaigns: "Kampanyaları Keşfet",
    mySubmissions: "Gönderilerim",
    devAuth: "[DEV GİRİŞ]",
    selectUser: "Kullanıcı Seç...",
    switchDevRole: "Geliştirici Rolünü / Kullanıcıyı Değiştir",
    language: "Dil",

    // Landing Page
    landingTitle: "İçerik Üreticisi Klip Pazaryeri",
    landingSubtitle:
      "Markalar ücretli kısa video (clipping) kampanyaları açar. Üreticiler TikTok, Instagram ve YouTube videoları göndererek 1.000 izlenme başına kazanç sağlar.",
    adminPortal: "Yönetici Paneli",
    adminPortalDesc: "Bütçeleri yönet & gönderileri incele",
    adminPortalContent:
      "Kampanya oluşturun, harcanan ve kalan bütçeyi canlı izleyin, günlük metrik grafiğini görüntüleyin ve video inceleme kuyruğunu yönetin.",
    continueAsAdmin: "Yönetici Olarak Devam Et (Sarah)",
    creatorPortal: "Üretici Portalı",
    creatorPortalDesc: "Video gönder & kazancını takip et",
    creatorPortalContent:
      "Aktif marka kampanyalarını keşfedin, TikTok / Instagram / YouTube linklerinizi gönderin, günlük izlenme ve tahmini kazancınızı takip edin.",
    continueAsCreator: "Üretici Olarak Devam Et (Alex)",

    // Admin Campaigns List
    campaignsManagement: "Kampanya Yönetimi",
    campaignsSubtitle:
      "Bütçeleri denetleyin, üreticilerin video gönderilerini inceleyin ve günlük performansı takip edin.",
    newCampaign: "Yeni Kampanya",
    searchPlaceholder: "Başlığa göre kampanya ara...",
    all: "Tümü",
    active: "Aktif",
    draft: "Taslak",
    paused: "Duraklatıldı",
    completed: "Tamamlandı",
    noCampaignsFound: "Kampanya bulunamadı.",
    adjustSearchTip: "Aramanızı değiştirmeyi veya yeni bir kampanya oluşturmayı deneyin.",
    colTitle: "Kampanya Başlığı",
    colStatus: "Durum",
    colPlatforms: "Platformlar",
    colRate: "1k Başına Ücret",
    colBudget: "Toplam Bütçe",
    colDuration: "Süre",
    colActions: "İşlemler",
    reviewDetail: "İncele & Detay",
    pageShowing: "Sayfa {page} / {totalPages} (Toplam {total} kampanya)",
    previous: "Önceki",
    next: "Sonraki",

    // Admin Campaign Detail
    backToCampaigns: "Kampanyalara Dön",
    editCampaign: "Kampanyayı Düzenle",
    statusLabel: "Durum",
    ratePer1k: "Birim Ücret: 1k izlenme başına {rate}",
    totalApprovedViews: "Toplam Onaylanan İzlenme",
    approvedViewsDesc: "Tüm onaylı kliplerin toplam izlenmesi",
    budgetSpent: "Harcanan Bütçe",
    budgetLeft: "Kalan Bütçe",
    budgetAvailableDesc: "Bekleyen ve gelecek onaylar için kalan tutar",
    pendingSubmissions: "Bekleyen Gönderiler",
    awaitingReviewDesc: "Yönetici onayı veya reddi bekliyor",
    dailyViewsTimeline: "Günlük İzlenme Zaman Çizelgesi",
    dailyViewsDesc:
      "Kampanya süresince günlük toplam izlenmeler (metrik olmayan günler sıfır olarak gösterilir)",
    noMetricsAvailable: "Bu dönem için metrik geçmişi bulunmuyor.",
    approvalBlockedTitle: "Onaylama Bütçe Tavanı Nedeniyle Engellendi",
    reviewQueueTitle: "Gönderi İnceleme Kuyruğu",
    reviewQueueSubtitle:
      "Video klipleri inceleyin, izlenme sayılarını kontrol edin ve onaylayın veya reddedin.",
    pending: "Bekliyor",
    approved: "Onaylandı",
    rejected: "Reddedildi",
    paid: "Ödendi",
    noSubmissionsMatching: "\"{filter}\" durumunda gönderi bulunamadı.",
    colClipCreator: "Klip / Üretici",
    colLatestViews: "Güncel İzlenme",
    colCostPayout: "Maliyet / Kazanç",
    approve: "Onayla",
    reject: "Reddet",
    reviewed: "İncelendi",
    rejectionReasonLabel: "Sebep",

    // Modals - Create & Edit
    createCampaignTitle: "Yeni Video Kampanyası Oluştur",
    createCampaignDesc:
      "Platformları, 1.000 izlenme başına ücreti, bütçe tavanını ve süreyi belirleyin.",
    editCampaignTitle: "Kampanyayı Düzenle",
    editCampaignDesc:
      "Kampanya bütçesini, birim ücreti, süreyi veya aktiflik durumunu güncelleyin.",
    fieldTitle: "Kampanya Başlığı",
    fieldTitlePlaceholder: "Örn: Yaz Enerji İçeceği TikTok Yarışması",
    fieldStatus: "Kampanya Durumu",
    fieldPlatforms: "Desteklenen Platformlar",
    fieldPayoutDollar: "1k İzlenme Başına Ücret ($)",
    fieldBudgetDollar: "Toplam Bütçe ($)",
    fieldStartsAt: "Başlangıç Tarihi",
    fieldEndsAt: "Bitiş Tarihi",
    centsNote: "= {cents} cent (Veritabanında tamsayı saklanır)",
    cancel: "Vazgeç",
    saveChanges: "Değişiklikleri Kaydet",
    createCampaignBtn: "Kampanya Oluştur",

    // Modals - Reject
    rejectModalTitle: "Gönderiyi Reddet",
    rejectModalDesc:
      "Lütfen bu video gönderisini reddetme nedeninizi belirtin (zorunludur).",
    rejectionReasonPlaceholder:
      "Örn: Video kampanya sponsorunu etiketlememiş veya içerik kurallarını ihlal ediyor.",
    confirmRejection: "Reddi Onayla",
    reasonMinChars: "Red sebebi en az 3 karakter olmalıdır.",

    // Creator Pages
    activeCreatorCampaigns: "Aktif Üretici Kampanyaları",
    creatorBrowseSubtitle:
      "Aktif bir kampanya seçin, yayınladığınız video linkini gönderin ve her 1.000 izlenmede kazanın.",
    viewMySubmissions: "Gönderilerimi Gör",
    noActiveCampaigns: "Şu anda aktif bir kampanya bulunmuyor.",
    checkBackSoon: "Yeni marka lansmanları için yakında tekrar kontrol edin.",
    payoutRate: "Birim Kazanç Oranı",
    per1kViews: "/ 1k izlenme",
    endsOn: "Bitiş: {date}",
    submitClipBtn: "Video Klip Gönder",
    submitClipModalTitle: "Klip Gönder: {title}",
    submitClipModalDesc:
      "Desteklenen bir platformdaki herkese açık videonuzun linkini girin.",
    choosePlatform: "Platform Seç",
    postUrlLabel: "Video Linki ({platform})",
    urlDuplicateNotice:
      "Aynı video linki aynı kampanyaya birden fazla kez gönderilemez.",
    validUrlFormat: "✓ Geçerli URL formatı",
    invalidUrlFormat: "Geçersiz video linki",
    clipSubmittedSuccess: "Klip başarıyla gönderildi! İnceleme kuyruğuna alındı.",
    clipQueuedDesc: "Videonuz yönetici doğrulaması için sıraya eklendi.",
    close: "Kapat",
    goToMySubmissions: "Gönderilerime Git",

    // My Submissions
    myClipSubmissions: "Video Gönderilerim",
    mySubmissionsSubtitle:
      "Videolarınızın onay durumunu, günlük güncellenen izlenmelerini ve tahmini kazancınızı takip edin.",
    browseMoreCampaigns: "Daha Fazla Kampanyaya Göz At",
    totalSubmissions: "Toplam Gönderi",
    totalTrackedViews: "Toplam İzlenme",
    estimatedTotalEarnings: "Tahmini Toplam Kazanç",
    fromApprovedViews: "Onaylı klip izlenmelerinden",
    noSubmissionsYet: "Henüz hiçbir video klibi göndermediniz.",
    noSubmissionsTip:
      "Aktif marka kampanyalarını keşfedin ve ilk video linkinizi gönderin!",
    colCampaign: "Kampanya",
    colPlatformLink: "Platform & Link",
    colCurrentViews: "Güncel İzlenme",
    colEstimatedEarnings: "Tahmini Kazanç",
    colSubmittedOn: "Gönderilme Tarihi",
    pendingApproval: "Onay bekleniyor",
  },
};

export type TranslationKey = keyof typeof translations.en;
