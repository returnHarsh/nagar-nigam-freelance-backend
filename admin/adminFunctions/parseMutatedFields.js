function parseMutatedFieldsSafe(data) {
  const result = {};

  Object.entries(data).forEach(([key, value]) => {
    const match = key.match(/mutatedFields\[(\d+)\]\[(\w+)\]/);
    if (!match) return;

    const [, index, prop] = match;
    result[index] ??= {};
    result[index][prop] = value;
  });

  return Object.values(result);
}

export {parseMutatedFieldsSafe}