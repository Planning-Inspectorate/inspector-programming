/**
 * Add configuration values to locals.
 * @param {string } feedbackUrl
 * @returns {import('express').Handler}
 */
export function addLocalsConfiguration(feedbackUrl) {
	return (req, res, next) => {
		res.locals.config = {
			feedbackUrl,
			headerTitle: 'Programme appeals',
			styleFile: 'style-878bb3bb.css'
		};
		next();
	};
}
