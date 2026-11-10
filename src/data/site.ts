/** 사이트 전역 사실. 문구·주소·제품 기능은 여기 한 곳에서만 고친다. */
export const site = {
  name: "deulli",
  nameKo: "들리",
  legalName: "손기령",
  url: "https://deulli.com",
  email: "contact@nangmans.com",
  defaultTitle: "들리 deulli · 팟캐스트로 하는 영어 공부",
  description:
    "들리(deulli)는 팟캐스트로 영어를 공부하는 앱입니다. 매주 내가 고른 주제로 만든 팟캐스트를 하루 한 미션씩 듣는 위클리가 중심이고, 놓친 문장은 영어 스크립트와 한국어 번역으로 확인해 그 문장부터 다시 듣습니다.",
  descriptionEn:
    "Deulli (들리) is a mobile app for Korean speakers learning English through podcasts. Its core is Weekly: each week Deulli makes podcasts on a topic you choose and splits them into one listening mission a day. Every episode comes with English transcripts, Korean text translations and dialogue replay.",
  ogImage: "/og-image.png", // 1200x630
  ogImageAlt:
    "들리 deulli: 듣다 보면 들리니까, 들리. 팟캐스트로 하는 영어 공부",

  /** Figma의 스토어 아트에서 확정된 슬로건. JSON-LD와 OG에 같은 문구를 쓴다. */
  slogan: "듣다 보면 들리니까, 들리",

  hero: {
    eyebrow: "영어 팟캐스트 학습 앱",
    lead: "팟캐스트로 하는 최고의 영어 공부",
  },

  stores: {
    appStore: "https://apps.apple.com/kr/app/id6798545609",
    googlePlay: "https://play.google.com/store/apps/details?id=com.deulli.app",
  },

  /** 정책 문서는 별도 정적 사이트(deulli-policy)에서 서비스한다. */
  policy: {
    privacy: "https://deulli.policy.nangmans.com/privacy",
    terms: "https://deulli.policy.nangmans.com/terms",
    support: "https://deulli.policy.nangmans.com/support",
  },
} as const;

/**
 * 위클리 — 앱의 중심 기능. 홈·llms.txt·JSON-LD가 함께 쓴다.
 * 근거는 deulli-app의 lib/features/curriculum (주제 대화, 주 2편, 일차별 미션, 7일차 기록).
 * 요금과 체험 기간은 앱에서 바뀌므로 숫자를 적지 않는다.
 */
export const weekly = {
  name: "위클리",
  heading: "매주, 내가 고른 이야기로 만든 팟캐스트",
  lead: "듣고 싶은 이야기를 적으면 들리가 그 주제로 팟캐스트 두 편을 만들고, 일주일 치 듣기 미션으로 나눠 줍니다.",
  steps: [
    {
      title: "이번 주 이야기를 정합니다",
      body: "요즘 관심사나 이어서 듣고 싶은 이야기를 적습니다. 들리가 그 내용으로 이번 주 팟캐스트를 만듭니다.",
    },
    {
      title: "하루에 미션 하나를 듣습니다",
      body: "첫날은 글보다 소리에 집중해 이야기 전체를 듣고, 들은 내용을 내 말로 적습니다. 다음 날부터는 짧은 구간으로 나눠 다시 듣고 놓친 문장을 복습합니다. 대본, 해석, 딕테이션은 필요할 때 엽니다.",
    },
    {
      title: "7일차에 한 주를 돌아봅니다",
      body: "이번 주에 들은 기록을 보고, 다음 주에 들을 이야기를 정합니다.",
    },
  ],
  note: "첫 위클리는 무료 체험으로 시작할 수 있습니다. 이어서 하려면 들리 프리미엄 구독이 필요하고, 체험 기간과 요금은 앱의 구독 안내에 나옵니다.",
} as const;

/**
 * 위클리 외의 제품 기능. 홈의 기능 목록과 MobileApplication JSON-LD의 featureList가 같은 배열을 쓴다.
 * 앱에서 확인된 기능만 적는다. 바뀌면 src/content/pages/about*.md도 함께 고친다.
 */
export const features = [
  {
    title: "영어 스크립트와 한국어 번역",
    body: "재생 중인 문장을 영어 스크립트와 한국어 번역으로 봅니다. 단어를 길게 누르면 뜻이 나오고 단어장에 저장됩니다.",
  },
  {
    title: "놓친 문장부터 다시 듣기",
    body: "스크립트에서 문장을 누르면 그 자리부터 다시 재생합니다. 배속과 이전·다음 대화 이동이 있습니다.",
  },
  {
    title: "표현 복습 · 쉐도잉 · 퀴즈",
    body: "저장한 단어와 문장을 복습하고, 퀴즈를 풀고, 문장을 듣고 따라 말합니다.",
  },
  {
    title: "공식 채널의 진행자별 언어 선택",
    body: "들리 공식 채널 에피소드는 진행자마다 한국어와 영어 중 하나를 골라 듣습니다. 외부 팟캐스트 전체에 있는 기능은 아닙니다.",
  },
  {
    title: "원하는 주제로 팟캐스트 생성",
    body: "듣고 싶은 주제를 적으면 그 주제의 팟캐스트를 만듭니다. 앱의 학습 메뉴에 있습니다.",
  },
  {
    title: "아이폰 잠금화면 자막",
    body: "아이폰을 잠근 채로 자막을 보고 이전·다음 대화로 넘어갑니다.",
  },
] as const;

/** 홈의 플레이어 사용 순서 세 단계. */
export const steps = [
  {
    title: "먼저 듣습니다",
    body: "영어 팟캐스트를 하나 골라 평소처럼 듣습니다.",
  },
  {
    title: "놓친 문장을 봅니다",
    body: "안 들린 문장은 영어 스크립트에서 찾고, 뜻이 헷갈리면 한국어 번역을 켭니다.",
  },
  {
    title: "그 문장부터 다시 듣습니다",
    body: "문장을 누르면 그 자리부터 재생합니다. 글로 본 표현이 소리로는 어떻게 나는지 비교합니다.",
  },
] as const;
