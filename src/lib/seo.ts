/**
 * schema.org JSON-LD 빌더.
 *
 * 페이지마다 자기 내용에 해당하는 노드만 싣는다. Organization·WebSite·MobileApplication의
 * 전체 정의는 홈(앱은 소개 페이지에도)에만 두고, 다른 페이지는 `@id`로 참조한다.
 * 모든 페이지에 같은 덩어리를 복제하면 "이 페이지가 무엇인지"가 흐려진다.
 */
import { features, site, weekly } from "../data/site";

type Node = Record<string, unknown>;

export const ids = {
  organization: `${site.url}/#organization`,
  website: `${site.url}/#website`,
  app: `${site.url}/#app`,
} as const;

export const abs = (path: string) => new URL(path, site.url).href;

export function organizationNode(): Node {
  return {
    "@type": "Organization",
    "@id": ids.organization,
    name: site.nameKo,
    alternateName: [site.name, "Deulli"],
    legalName: site.legalName,
    url: `${site.url}/`,
    logo: {
      "@type": "ImageObject",
      url: abs("/icon-512.png"),
      width: 512,
      height: 512,
    },
    email: site.email,
    slogan: site.slogan,
    sameAs: [site.stores.appStore, site.stores.googlePlay],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: site.policy.support,
      email: site.email,
      availableLanguage: "ko",
    },
  };
}

export function websiteNode(): Node {
  return {
    "@type": "WebSite",
    "@id": ids.website,
    url: `${site.url}/`,
    name: site.nameKo,
    alternateName: [site.name, "Deulli", "들리 deulli"],
    description: site.description,
    inLanguage: "ko",
    publisher: { "@id": ids.organization },
  };
}

export function appNode(): Node {
  return {
    "@type": "MobileApplication",
    "@id": ids.app,
    name: `${site.nameKo} (${site.name})`,
    alternateName: [site.nameKo, "Deulli"],
    applicationCategory: "EducationalApplication",
    operatingSystem: "iOS, Android",
    url: abs("/about/"),
    description: site.description,
    inLanguage: "ko",
    image: abs(site.ogImage),
    publisher: { "@id": ids.organization },
    installUrl: [site.stores.appStore, site.stores.googlePlay],
    sameAs: [site.stores.appStore, site.stores.googlePlay],
    featureList: [
      `${weekly.name}: ${weekly.lead}`,
      ...features.map((feature) => `${feature.title}: ${feature.body}`),
    ],
  };
}

export function faqNode(
  path: string,
  items: readonly { question: string; answer: string }[],
): Node {
  return {
    "@type": "FAQPage",
    "@id": `${abs(path)}#faq`,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbNode(crumbs: readonly Crumb[]): Node {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: abs(crumb.path),
    })),
  };
}

export function webPageNode(page: {
  path: string;
  title: string;
  description: string;
  lang?: "ko" | "en";
  type?: "WebPage" | "CollectionPage" | "AboutPage";
  about?: string;
}): Node {
  return {
    "@type": page.type ?? "WebPage",
    "@id": `${abs(page.path)}#webpage`,
    url: abs(page.path),
    name: page.title,
    description: page.description,
    inLanguage: page.lang ?? "ko",
    isPartOf: { "@id": ids.website },
    ...(page.about ? { about: { "@id": page.about } } : {}),
  };
}

export function articleNode(article: {
  path: string;
  title: string;
  description: string;
  publishedAt: Date;
  updatedAt: Date;
  lang?: "ko" | "en";
  about?: string;
}): Node {
  return {
    "@type": "Article",
    "@id": `${abs(article.path)}#article`,
    mainEntityOfPage: abs(article.path),
    headline: article.title,
    description: article.description,
    inLanguage: article.lang ?? "ko",
    image: abs(site.ogImage),
    datePublished: isoDate(article.publishedAt),
    dateModified: isoDate(article.updatedAt),
    author: { "@id": ids.organization },
    publisher: { "@id": ids.organization },
    isPartOf: { "@id": ids.website },
    ...(article.about ? { about: { "@id": article.about } } : {}),
  };
}

export function itemListNode(
  name: string,
  items: readonly { name: string; path: string }[],
): Node {
  return {
    "@type": "ItemList",
    name,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: abs(item.path),
    })),
  };
}

/** 여러 노드를 한 개의 @graph 문서로 묶는다. `<`를 이스케이프해 본문에서 스크립트가 닫히지 않게 한다. */
export function jsonLdGraph(nodes: readonly Node[]): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": nodes,
  }).replace(/</g, "\\u003c");
}

export const isoDate = (date: Date) => date.toISOString().slice(0, 10);

export function displayDate(date: Date, lang: "ko" | "en" = "ko"): string {
  return new Intl.DateTimeFormat(lang === "en" ? "en-US" : "ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}
