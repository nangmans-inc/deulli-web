import { site } from "./site";

/** 헤더·푸터·llms.txt가 함께 쓰는 사이트 구조. 페이지를 추가하면 여기에 등록한다. */
export const primaryNav = [
  { href: "/weekly/", label: "위클리" },
  { href: "/about/", label: "앱 소개" },
  { href: "/podcasts/", label: "공식 팟캐스트" },
  { href: "/guides/", label: "학습 가이드" },
] as const;

export const supportNav = [
  { href: site.policy.support, label: "고객지원" },
  { href: site.policy.privacy, label: "개인정보 처리방침" },
  { href: site.policy.terms, label: "이용약관" },
] as const;
