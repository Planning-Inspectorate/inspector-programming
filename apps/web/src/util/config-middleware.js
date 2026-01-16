/**
 * Add configuration values to locals.
 * @returns {import('express').Handler}
 */
export function addLocalsConfiguration() {
	return (req, res, next) => {
		res.locals.config = {
			headerTitle: 'Programme appeals',
			styleFile: 'style-8ac469fb.css'
		};
		next();
	};
}
