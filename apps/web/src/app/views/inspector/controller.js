/**
 * @returns {import('express').Handler}
 */
export function buildViewInspector() {
	return async (req, res) => {
		const inspector = null;

		const events = [];

		return res.render('views/inspector/view.njk', {
			inspector,
			events: events,
			containerClasses: 'pins-container-wide',
			title: 'Inspector details'
		});
	};
}
