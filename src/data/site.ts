export const site = {
  name: "deulli",
  // 한글 브랜드명. "들리" 검색 노출을 위해 title·description·JSON-LD에 함께 노출.
  nameKo: "들리",
  legalName: "손기령",
  url: "https://deulli.com",
  email: "contact@nangmans.com",
  defaultTitle: "들리 deulli · 영어 팟캐스트를 끝까지 듣게 하는 앱",
  description:
    "들리(deulli)는 영어 팟캐스트를 영문·한글 동기화 스크립트로 학습하는 앱입니다. 재생되는 문장이 스크립트에서 그대로 따라 흐르고, 놓친 문장은 탭 한 번으로 되돌아갑니다. 지금 전화번호를 남기시면 출시일에 가장 먼저 알려드립니다.",
  // 검색·SEO용 키워드. 브랜드명과 제품 핵심어 위주.
  keywords: [
    "들리",
    "deulli",
    "영어 팟캐스트",
    "영어 듣기",
    "영어 청취",
    "리스닝 앱",
    "영어 스크립트",
    "쉐도잉",
    "영어 공부 앱",
    "팟캐스트 학습",
    "영어 회화 듣기",
    "출시 알림",
    "사전신청",
  ],
  ogImage: "/og-image.png", // 1200x630
  ogImageAlt: "들리 deulli — 영어 팟캐스트를 끝까지 듣게 하는 앱",

  /** 정책 문서는 별도 정적 사이트(deulli-policy)에서 서비스한다. */
  policy: {
    privacy: "https://deulli.policy.nangmans.com/privacy",
    terms: "https://deulli.policy.nangmans.com/terms",
    support: "https://deulli.policy.nangmans.com/support",
  },
} as const;
