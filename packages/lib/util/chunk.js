/**
 * @param {T[]} array
 * @param {number} size
 * @returns {T[][]}
 * @template T
 */
export function chunk(array, size) {
	const chunkCount = Math.ceil(array.length / size);
	const chunks = [];
	for (let i = 0; i < chunkCount; i++) {
		chunks.push(array.slice(i * size, i * size + size));
	}
	return chunks;
}
