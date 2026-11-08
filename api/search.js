// Vercel Serverless Function: /api/search
// Vyhledá prvky na Cosmos.so přes oficiální GraphQL API

const GRAPHQL_URL = 'https://api.cosmos.so/graphql';

const SEARCH_QUERY = `query SearchGlobalElements($userId: UserId, $searchTerm: String!, $contentType: ElementContentTypeFilter, $origin: SearchOrigin, $pageCursor: String, $order: ElementOrder, $color: String, $inStock: Boolean, $priceRange: PriceRangeInput, $productOrder: ProductOrder, $pageSize: Int = 40) {
  searchElements(
    filters: {color: $color, userId: $userId, contentType: $contentType, inStock: $inStock, priceRange: $priceRange}
    order: $order
    productOrder: $productOrder
    searchTerm: $searchTerm
    searchOrigin: $origin
    meta: {pageSize: $pageSize, pageCursor: $pageCursor}
  ) {
    results {
      slateId
      block
      element {
        ...ElementTile
        __typename
      }
      __typename
    }
    meta {
      nextPageCursor
      count
      __typename
    }
    __typename
  }
}

fragment ElementTile on ElementTile {
  __typename
  id
  processingState
  contentAccessibility
  createdAt
  isFeatured
  isReadyToShow
  hasIllegalReports
  ownerId
  owner {
    username
    isVerifiedProfile
    verifiedProfile {
      slug
      brand {
        __typename
        id
        slug
      }
      avatarUrl
      avatarThumbnailCropParameters {
        width
        height
        __typename
      }
      __typename
    }
    __typename
  }
  shareUrl
  originalClusterId
  generatedCaption {
    text
    __typename
  }
  source {
    ...ElementSource
    __typename
  }
  product {
    ...Product
    __typename
  }
  ... on MediaElementTile {
    hasMoreMedia
    multipleMedia {
      ...ElementMedia
      __typename
    }
    media {
      ...ElementMedia
      __typename
    }
    secondaryMedia {
      ...ElementMedia
      __typename
    }
    __typename
  }
  ... on ProductElementTile {
    media {
      ...ElementMedia
      __typename
    }
    productPrice: price {
      value
      currency
      __typename
    }
    productBrand: brand
    productTitle: name
    productDescription: description
    __typename
  }
  ... on WebsiteElementTile {
    media {
      ...ElementMedia
      __typename
    }
    websiteTitle: title
    websiteDescription: description
    __typename
  }
  ... on TextElementTile {
    text
    __typename
  }
}

fragment ElementMedia on Media {
  mediaId
  url
  width
  height
  notSafeForWorkStatus
  aiGenerated
  __typename
  ... on StaticImage {
    blurHash
    __typename
  }
  ... on AnimatedImage {
    blurHash
    video {
      url
      thumbnailUrl
      __typename
    }
    __typename
  }
  ... on Video {
    thumbnail {
      hash
      url
      __typename
    }
    duration
    isStored
    mux {
      playbackUrl
      mp4Url(quality: LOW)
      __typename
    }
    width
    height
    __typename
  }
  ... on Media {
    __typename
  }
}

fragment ElementSource on ElementSource {
  url
  isEditable
  isPublicDomain
  author {
    username
    fullName
    profileUrl
    avatarUrl
    __typename
  }
  __typename
}

fragment Product on Product {
  __typename
  id
  name
  description
  brand {
    id
    name
    slug
    __typename
  }
  listPrice {
    value
    currency
    __typename
  }
  salePrice {
    value
    currency
    __typename
  }
  availability
  gender
  delistedAt
  categories {
    slug
    __typename
  }
  offers {
    url
    domain
    __typename
  }
}`;

export default async function handler(req, res) {
  // CORS hlavičky
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Získání parametrů z GET query nebo POST body
  let searchTerm = '';
  let pageCursor = null;
  let pageSize = 40;

  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://localhost');
    searchTerm = url.searchParams.get('q') || url.searchParams.get('searchTerm') || '';
    pageCursor = url.searchParams.get('cursor') || url.searchParams.get('pageCursor') || null;
    const ps = url.searchParams.get('pageSize');
    if (ps) pageSize = parseInt(ps, 10) || 40;
  } else {
    // POST request
    const body = req.body || {};
    searchTerm = body.q || body.searchTerm || '';
    pageCursor = body.cursor || body.pageCursor || null;
    if (body.pageSize) pageSize = parseInt(body.pageSize, 10) || 40;
  }

  if (!searchTerm || typeof searchTerm !== 'string' || !searchTerm.trim()) {
    res.status(400).json({ error: 'Chybí hledaný výraz (parametr q nebo searchTerm)' });
    return;
  }

  searchTerm = searchTerm.trim();

  const payload = {
    operationName: 'SearchGlobalElements',
    variables: {
      pageSize,
      searchTerm,
      origin: 'SEARCH_BOX',
      contentType: null,
      order: null,
      color: null,
      pageCursor: pageCursor || null
    },
    extensions: {
      clientLibrary: {
        name: '@apollo/client',
        version: '4.2.10'
      }
    },
    query: SEARCH_QUERY
  };

  try {
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/graphql-response+json,application/json;q=0.9',
        'accept-language': 'cs-CZ,cs;q=0.9,en;q=0.8',
        'content-type': 'application/json',
        'origin': 'https://www.cosmos.so',
        'priority': 'u=1, i',
        'referer': 'https://www.cosmos.so/',
        'sec-ch-ua': '"Not:A-Brand";v="8", "Chromium";v="156", "Google Chrome";v="156"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36',
        'x-client-name': 'cosmos-web'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      res.status(response.status).json({
        error: `Server Cosmos vrátil chybu ${response.status}`,
        details: errText
      });
      return;
    }

    const data = await response.json();
    const parsed = parseGraphQLData(data);
    res.status(200).json(parsed);
  } catch (error) {
    res.status(500).json({
      error: 'Chyba při komunikaci se serverem Cosmos',
      message: error.message
    });
  }
}

function parseGraphQLData(json) {
  const items = [];
  const seenUrls = new Set();
  let nextPageCursor = null;
  let totalCount = 0;

  const searchElements = json?.data?.searchElements;
  if (!searchElements) {
    return { items, nextPageCursor, totalCount, hasMore: false };
  }

  // Metadata stránkování
  if (searchElements.meta) {
    nextPageCursor = searchElements.meta.nextPageCursor || null;
    totalCount = searchElements.meta.count || 0;
  }

  // Zpracování výsledků
  const results = searchElements.results || [];
  for (const result of results) {
    const el = result.element;
    if (!el) continue;

    const caption = el.generatedCaption?.text
      ? el.generatedCaption.text.replace(/<[^>]*>?/gm, '')
      : null;

    // 1. Primární media
    if (el.media) {
      addMediaItem(el.media, caption, items, seenUrls);
    }

    // 2. Sekundární media
    if (el.secondaryMedia) {
      addMediaItem(el.secondaryMedia, caption, items, seenUrls);
    }

    // 3. multipleMedia
    if (Array.isArray(el.multipleMedia)) {
      for (const m of el.multipleMedia) {
        addMediaItem(m, caption, items, seenUrls);
      }
    }
  }

  return {
    items,
    nextPageCursor,
    totalCount,
    hasMore: Boolean(nextPageCursor)
  };
}

function addMediaItem(media, caption, items, seenUrls) {
  if (!media || !media.url) return;

  let url = media.url;
  // Pokud je to mp4 video a má thumbnail, použijeme thumbnail
  if (url.endsWith('.mp4')) {
    if (media.thumbnail?.url) {
      url = media.thumbnail.url;
    } else {
      return; // Přeskočit mp4 video bez náhledu
    }
  }

  if (seenUrls.has(url)) return;
  seenUrls.add(url);

  const mediaId = media.mediaId || '';
  const cleanId = mediaId.replace(/[^a-zA-Z0-9\-_]/g, '') || String(items.length + 1);
  const fileName = `cosmos_${cleanId}.jpg`;

  items.push({
    url,
    mediaId,
    fileName,
    width: media.width || 0,
    height: media.height || 0,
    blurHash: media.blurHash || null,
    caption: caption || null,
    displayTitle: fileName
  });
}
