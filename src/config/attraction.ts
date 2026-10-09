/**
 * 单景点 SEO 实体绑定配置 (Single-Attraction Entity Config)
 *
 * 这是整个站点唯一的实体数据源。所有模板中的变量占位符都在这里落地：
 *   {{DOMAIN_NAME}} {{ATTRACTION_FULL_NAME}} {{ATTRACTION_SHORT_NAME}}
 *   {{CITY_NAME}} {{STATE_PROVINCE}} {{COUNTRY_NAME}} {{COUNTRY_CODE_2LETTER}}
 *   {{POSTAL_CODE}} {{LATITUDE}} {{LONGITUDE}} {{MAPS_SHARE_URL}} {{MAPS_EMBED_SRC}}
 *   {{NEARBY_LANDMARK_1}} {{NEARBY_LANDMARK_2}} {{GOVT_TOURISM_URL}}
 */

export const DOMAIN_NAME = 'manopunta.com';
export const SITE_URL = `https://${DOMAIN_NAME}`;

const GALLERY_COUNT = 18;

/** 全部图库图片的绝对地址，用于 JSON-LD image 数组 / OG 图 */
export const galleryImages: string[] = Array.from(
  { length: GALLERY_COUNT },
  (_, i) => `${SITE_URL}/gallery/punta-del-este-${i + 1}.jpg`,
);

export const attraction = {
  /** 知识图谱锚点：https://manopunta.com/#attraction */
  id: `${SITE_URL}/#attraction`,
  /** {{ATTRACTION_FULL_NAME}} 景点官方全称 */
  fullName: 'La Mano (Hombre emergiendo a la vida)',
  /** {{ATTRACTION_SHORT_NAME}} 景点常用俗称 / 域名对应含义 (mano = hand) */
  shortName: 'La Mano',
  /** 别名（多语言 + 俗称），写入 alternateName */
  alternateNames: [
    'La Mano',
    'Los Dedos de Punta del Este',
    'The Fingers of Punta del Este',
    'Hombre emergiendo a la vida',
    'Man Emerging into Life',
    '五指雕塑',
  ],
  /** {{CITY_NAME}} */
  city: 'Punta del Este',
  /** {{STATE_PROVINCE}} */
  region: 'Maldonado',
  /** {{COUNTRY_NAME}} */
  country: 'Uruguay',
  /** {{COUNTRY_CODE_2LETTER}} */
  countryCode: 'UY',
  /** {{POSTAL_CODE}} */
  postalCode: '20001',
  /** NAP 地址行 */
  streetAddress: 'Av. Eduardo Víctor Haedo, Parada 1 Brava',
  /** NAP 电话（与 Google Business Profile 保持一致） */
  telephone: '+598 93 324 497',
  /** Google Plus Code（位于 Punta del Este 的 Playa Brava 1 号站，避免与 La Barra 混淆） */
  plusCode: '23R7+R3 Punta del Este, Maldonado, Uruguay',
  /** {{LATITUDE}} —— 经 Google Maps / OpenStreetMap 地标核实（Playa Brava, Parada 1） */
  latitude: -34.95789,
  /** {{LONGITUDE}} */
  longitude: -54.93729,
  /** {{MAPS_SHARE_URL}} Google Maps 分享短链接 */
  mapsShareUrl: 'https://maps.app.goo.gl/MU5QCr5mQWiTMGuG6',
  /** {{MAPS_EMBED_SRC}} Google Maps 嵌入代码中的 src 链接 */
  mapsEmbedSrc:
    'https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d23247.29035913815!2d-54.93729!3d-34.95789!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95750512eda09d7d%3A0xb6244bde1fa3faee!2z5LqU5oyH6ZuV5aGR!5e1!3m2!1szh-CN!2s!4v1789019460312!5m2!1szh-CN!2s',
  /** {{NEARBY_LANDMARK_1}} */
  nearbyLandmark1: 'Faro de Punta del Este',
  /** {{NEARBY_LANDMARK_2}} */
  nearbyLandmark2: 'Casapueblo',
  /** {{GOVT_TOURISM_URL}} 当地政府 / 官方旅游局链接 */
  govtTourismUrl: 'https://www.gub.uy/ministerio-turismo/',
  /** 主视觉图（Hero / OG image）—— 已压缩的 1600px 版本 */
  heroImage: `${SITE_URL}/gallery/hero-mano.jpg`,
  /** 主视觉图真实像素尺寸：OG / Twitter 卡片的声明必须与文件一致 */
  heroImageWidth: 1600,
  heroImageHeight: 1200,
  /** 作者、国籍与创作年代（结构化数据 + E-E-A-T 信号） */
  creator: 'Mario Irarrázabal',
  creatorNationality: 'Chile',
  dateCreated: '1982',
  material: 'Concrete and steel',
  /** GA4 衡量 ID */
  ga4Id: 'G-HXM22WWPKP',
} as const;

/** 面包屑地理层级 {{ATTRACTION_FULL_NAME}} → {{CITY_NAME}} → {{STATE_PROVINCE}} → {{COUNTRY_NAME}} */
export const breadcrumbTrail = [
  { name: attraction.fullName, url: `${SITE_URL}/es/` },
  { name: attraction.city, url: 'https://es.wikipedia.org/wiki/Punta_del_Este' },
  { name: attraction.region, url: 'https://es.wikipedia.org/wiki/Departamento_de_Maldonado' },
  { name: attraction.country, url: 'https://es.wikipedia.org/wiki/Uruguay' },
];

/** 权威出站来源（.gub.uy / .org），用于 SourcesSection 与 E-E-A-T */
export const authoritySources = [
  {
    name: 'Intendencia de Maldonado',
    url: 'https://www.maldonado.gub.uy/',
    kind: 'government',
  },
  {
    name: 'Ministerio de Turismo (Uruguay)',
    url: 'https://www.gub.uy/ministerio-turismo/',
    kind: 'government',
  },
  {
    name: 'Uruguay Natural — Turismo Oficial',
    url: 'https://uruguaynatural.com/',
    kind: 'official',
  },
  {
    name: 'Wikipedia — La Mano',
    url: 'https://es.wikipedia.org/wiki/La_mano_(escultura)',
    kind: 'reference',
  },
  {
    name: 'Google Maps',
    url: attraction.mapsShareUrl,
    kind: 'reference',
  },
];

export default attraction;
