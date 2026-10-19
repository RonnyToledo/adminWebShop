function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    return Object.keys(value)
      .filter((key) => key !== "_localPreview" && key !== "_deleteImage")
      .sort()
      .reduce((result, key) => {
        result[key] = normalize(value[key]);
        return result;
      }, {});
  }
  return value;
}

export function serializeForComparison(value) {
  return JSON.stringify(normalize(value));
}

export function hasChanged(current, original) {
  return serializeForComparison(current) !== serializeForComparison(original);
}
