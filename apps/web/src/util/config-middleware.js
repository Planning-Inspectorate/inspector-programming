/**
 * Add configuration values to locals.
 * @returns {import('express').Handler}
 */
export function addLocalsConfiguration() {
	return (req, res, next) => {
		res.locals.config = {
			headerTitle: 'Programme appeals',
			styleFile: 'style-825b02e4.css'
		};
		next();
	};
}
