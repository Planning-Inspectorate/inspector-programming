import { NotifyClient } from 'notifications-node-client';

export class FunctionGovNotifyClient {
	#reportTemplateId;

	/**
	 * @param {import('pino').Logger} logger
	 * @param {string} govNotifyApiKey - Gov Notify API key
	 * @param {string} reportTemplateId
	 **/
	constructor(logger, govNotifyApiKey, reportTemplateId) {
		this.logger = logger;
		this.notifyClient = new NotifyClient(govNotifyApiKey);
		this.#reportTemplateId = reportTemplateId;
	}

	/**
	 * @param {string} email - Recipients email address
	 * @param {{weekStart: string, casesCount: string, greeting: string}} personalisation
	 * @returns {Promise<void>}
	 */
	async sendWeeklyReportEmail(email, personalisation) {
		const fields = ['weekStart', 'casesCount', 'greeting'];
		await this.sendEmail(this.#reportTemplateId, email, { personalisation }, fields, 'weekly report');
	}

	/**
	 * @param {string} templateId - Gov Notify email template id
	 * @param {string} emailAddress - Recipients email address
	 * @param {import('@pins/inspector-programming-lib/emails/types').GovNotifyOptions} options - Options to pass to Gov Notify
	 * @param {string[]} [fields] - required fields
	 * @param {string} [name] - name of the email for logging only
	 **/
	async sendEmail(templateId, emailAddress, options, fields = [], name = templateId) {
		// Ensure all required fields are present in the personalisation object
		for (const field of fields) {
			if (!options.personalisation[field]) {
				throw new Error(`${field} is required for ${name} email`);
			}
		}
		try {
			this.logger.info(`dispatching email ${name} (${templateId})`);
			await this.notifyClient.sendEmail(templateId, emailAddress, options);
		} catch (e) {
			// log the original error
			const errors = e?.response?.data?.errors;
			this.logger.error({ error: e, templateId, errors }, 'failed to dispatch email');
			throw new Error(`email failed to dispatch: ${e.message}`, { cause: e });
		}
	}
}
