export function collectProductSortingAueAttributes(element) {
  const attributes = {};

  Array.from(element?.attributes || []).forEach((attr) => {
    const name = attr?.name || attr?.nodeName || '';
    if (name.startsWith('data-aue-')) {
      attributes[name] = attr.value;
    }
  });

  return attributes;
}

export function splitProductSortingAueAttributes(attributes = {}, options = {}) {
  const { transferResource = false } = options;
  let resource = null;
  const nextAttributes = {};

  Object.entries(attributes).forEach(([name, value]) => {
    if (name === 'data-aue-resource') {
      if (transferResource) {
        resource = value;
      }
      return;
    }

    nextAttributes[name] = value;
  });

  return {
    resource,
    attributes: nextAttributes,
  };
}
