/**
 * Add configuration values to locals.
 * @returns {import('express').Handler}
 */
export function addLocalsConfiguration() {
	return (req, res, next) => {
		const path = req.path;

		const links = [
			{
				text: 'Home',
				href: '/'
			},
			{
				text: 'Another Page',
				href: '/another-page'
			}
		];

		res.locals.config = {
			cspNonce: res.locals.cspNonce,
			headerTitle: 'A New Service',
			footerLinks: [
				{
					text: 'Terms and conditions',
					href: '/terms-and-conditions'
				},
				{
					text: 'Accessibility statement',
					href: '/accessibility-statement'
				},
				{
					text: 'Privacy',
					href: 'https://www.gov.uk/government/publications/planning-inspectorate-privacy-notices/customer-privacy-notice'
				},
				{
					text: 'Cookies',
					href: '/cookies'
				},
				{
					text: 'Contact',
					href: '/contact'
				}
			],
			primaryNavigationLinks: links.map((l) => {
				const link = { current: false, ...l };
				link.current = link.href === path;
				return link;
			})
		};
		next();
	};
}
