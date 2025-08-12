/**
 * chunks array into sub-arrays for batch processing
 * @param {any[]} array
 * @param {number} chunkSize
 * @returns
 */
export function chunkArray(array, chunkSize) {
	const chunks = [];
	for (let i = 0; i < array.length; i += chunkSize) {
		chunks.push(array.slice(i, i + chunkSize));
	}
	return chunks;
}
