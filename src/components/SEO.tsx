import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  noindex?: boolean;
}

const DEFAULT_TITLE = "Donasi & Program Sosial Jakarta — Jakarta Mengabdi";
const DEFAULT_DESC = "Salurkan donasi untuk program sosial di Jakarta bersama Jakarta Mengabdi. Transparan, terverifikasi, dan berdampak nyata bagi adik asuh dan warga.";
const DEFAULT_IMAGE = "https://kakasaku.jakartamengabdi.com/FULL_COLOR.png";
const BASE_URL = "https://kakasaku.jakartamengabdi.com";

export default function SEO({
  title,
  description = DEFAULT_DESC,
  canonical,
  ogImage = DEFAULT_IMAGE,
  noindex = false,
}: SEOProps) {
  const fullTitle = title || DEFAULT_TITLE;
  const canonicalUrl = canonical 
    ? (canonical.startsWith("http") ? canonical : `${BASE_URL}${canonical.startsWith("/") ? "" : "/"}${canonical}`)
    : undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Robots */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

      {/* Twitter */}
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
