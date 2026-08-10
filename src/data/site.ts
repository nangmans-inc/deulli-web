export const site = {
  name: "deulli",
  // 한글 브랜드명. "들리" 검색 노출을 위해 title·description·JSON-LD에 함께 노출.
  nameKo: "들리",
  legalName: "손기령",
  url: "https://deulli.com",
  email: "contact@nangmans.com",
  defaultTitle: "들리 deulli · 팟캐스트로 하는 영어 공부",
  description:
    "들리(deulli)는 팟캐스트로 영어를 공부하는 앱입니다. 듣다가 놓친 문장은 화면에서 영어와 한국어로 바로 확인하고, 그 문장부터 다시 들으면 됩니다. 지금 전화번호를 남기시면 출시일에 가장 먼저 알려드립니다.",
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
    "팟캐스트 영어",
    "영어 회화 듣기",
    "출시 알림",
    "사전신청",
  ],
  ogImage: "/og-image.png", // 1200x630
  ogImageAlt:
    "들리 deulli — 듣다 보면 들리니까, 들리. 팟캐스트로 하는 영어 공부",

  /** Figma의 스토어 아트에서 확정된 슬로건. JSON-LD와 OG에 같은 문구를 쓴다. */
  slogan: "듣다 보면 들리니까, 들리",

  /** 정책 문서는 별도 정적 사이트(deulli-policy)에서 서비스한다. */
  policy: {
    privacy: "https://deulli.policy.nangmans.com/privacy",
    terms: "https://deulli.policy.nangmans.com/terms",
    support: "https://deulli.policy.nangmans.com/support",
  },
} as const;
