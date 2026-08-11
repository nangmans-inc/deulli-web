/**
 * 사전신청 페이지 카피.
 *
 * 문구는 지어내지 않고 Figma의 스토어 아트(FINAL 1, Feature Graphic v2)에 이미 확정된
 * 브랜드 카피를 그대로 가져왔다. 여기서 바꾸면 스토어 스크린샷과 어긋난다.
 *
 * 이 파일과 `components/Hero.astro`·`components/SignupForm.astro`는 사전신청 기간에만
 * 쓰인다. 공식 페이지로 전환할 때 통째로 지운다.
 */
export const prelaunch = {
  /** 슬로건 앞 두 줄. 줄바꿈은 스토어 아트와 같은 지점이다. */
  heading: "듣다 보면\n들리니까,",
  /** 슬로건을 받는 브랜드명. 아이보리로 크게 놓인다. */
  headingBrand: "들리",

  lead: "팟캐스트로 하는 최고의 영어 공부",

  perk: "사전신청하신 분들께 프리미엄 1개월 무료",

  formLabel: "전화번호를 입력해주세요",
  formPlaceholder: "010-0000-0000",
  submitLabel: "출시되면 알려주세요",
  submitPendingLabel: "보내는 중…",

  successHeading: "번호를 받았습니다",
  successBody: "출시하는 날, 이 번호로 가장 먼저 알려드릴게요.",

  // 토스트는 실패할 때만 띄운다. 성공은 카드 안에서 완료 화면으로 바뀌는데,
  // 여기에 토스트까지 겹치면 완료 문구를 가린다.
  errorToast: "전송에 실패했어요. 잠시 후 다시 시도해 주세요.",
} as const;
