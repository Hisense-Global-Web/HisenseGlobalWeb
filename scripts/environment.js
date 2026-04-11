const DEV_PUBLISH_ORIGIN = 'https://publish-p174152-e1855821.adobeaemcloud.com';
const STAGE_PUBLISH_ORIGIN = 'https://publish-p174152-e1855674.adobeaemcloud.com';
const PROD_PUBLISH_ORIGIN = 'https://publish-p174152-e1855954.adobeaemcloud.com';

const DEV_EDS_ORIGIN = 'https://development--hisense-dev--hisense-global-web.aem.page';
const STAGE_EDS_ORIGIN = 'https://stage--hisense-stage--hisense-global-web.aem.page';
const PROD_EDS_ORIGIN = 'https://main--hisenseglobalweb--hisense-global-web.aem.live';

function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

export function getLocationPart(key) {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.location[key] || '';
}

export function isLocalHostname(hostname = getLocationPart('hostname')) {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

export function isAuthorHostname(hostname = getLocationPart('hostname')) {
  return hostname.includes('author-');
}

function isPublishHostname(hostname = getLocationPart('hostname')) {
  return hostname.includes('publish-');
}

function isDevHostname(hostname = getLocationPart('hostname')) {
  return isLocalHostname(hostname)
    || hostname.includes('hisense-dev')
    || hostname.includes('e1855821');
}

function isStageHostname(hostname = getLocationPart('hostname')) {
  return hostname.includes('hisense-stage')
    || hostname.includes('e1855674');
}

function isProdHostname(hostname = getLocationPart('hostname')) {
  return hostname.includes('hisense.com')
    || hostname.includes('hisenseglobalweb')
    || hostname.includes('e1855954');
}

export function getGraphQLBaseUrl() {
  const hostname = getLocationPart('hostname');

  if (isLocalHostname(hostname)) {
    return `${DEV_PUBLISH_ORIGIN}/`;
  }

  if (isAuthorHostname(hostname) || isPublishHostname(hostname)) {
    return '';
  }

  if (isDevHostname(hostname)) {
    return DEV_PUBLISH_ORIGIN;
  }

  if (isStageHostname(hostname)) {
    return STAGE_PUBLISH_ORIGIN;
  }

  if (isProdHostname(hostname)) {
    return PROD_PUBLISH_ORIGIN;
  }

  return '';
}

export function getEdsBaseUrl() {
  const hostname = getLocationPart('hostname');
  const origin = getLocationPart('origin');

  if (isLocalHostname(hostname) || hostname.includes('e1855821')) {
    return DEV_EDS_ORIGIN;
  }

  if (hostname.includes('e1855674')) {
    return STAGE_EDS_ORIGIN;
  }

  if (hostname.includes('e1855954')) {
    return PROD_EDS_ORIGIN;
  }

  return origin;
}

export function getHybrisBffBaseUrl() {
  const hostname = getLocationPart('hostname');
  const origin = trimTrailingSlash(getLocationPart('origin'));

  if (!hostname) {
    return '/api/hybris';
  }

  if (isAuthorHostname(hostname)) {
    return `${origin}/bin/hybris`;
  }

  if (isPublishHostname(hostname)) {
    return `${origin}/api/hybris`;
  }

  if (isDevHostname(hostname)) {
    return `${DEV_PUBLISH_ORIGIN}/api/hybris`;
  }

  if (isStageHostname(hostname)) {
    return `${STAGE_PUBLISH_ORIGIN}/api/hybris`;
  }

  if (isProdHostname(hostname)) {
    return `${PROD_PUBLISH_ORIGIN}/api/hybris`;
  }

  return `${origin}/api/hybris`;
}
