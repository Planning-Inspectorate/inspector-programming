import { NotifyClient } from 'notifications-node-client';

/**
 * @typedef {import('./types.js').GovNotifyOptions} GovNotifyOptions
 */

export class GovNotifyClient {
	/** @type {import('./types.js').TemplateIds} */
	#templateIds;

	/**
	 * @param {import('pino').Logger} logger
	 * @param {string} govNotifyApiKey - Gov Notify API key
	 * @param {import('./types.js').TemplateIds} templateIds
	 **/
	constructor(logger, govNotifyApiKey, templateIds) {
		this.logger = logger;
		this.notifyClient = new NotifyClient(govNotifyApiKey);
		this.#templateIds = templateIds;
	}

	/**
	 * @param {string} email - Recipients email address
	 * @param {import('./types.js').AssignedCasePersonalisation} personalisation
	 * @returns {Promise<void>}
	 */
	async sendAssignedCaseEmail(email, personalisation) {
		const fields = ['inspectorName', 'assignmentDate', 'selectedCases', 'cbosLink'];
		await this.sendEmail(this.#templateIds.assignedCase, email, { personalisation }, fields, 'assigned case');
	}

	/**
	 * @param {string} email - Recipients email address
	 * @param {import('./types.js').AssignedCaseProgrammeOfficerPersonalisation} personalisation
	 * @returns {Promise<void>}
	 */
	async sendAssignedCaseProgrammeOfficerEmail(email, personalisation) {
		const fields = ['inspectorName', 'assignmentDate', 'selectedCases', 'cbosLink', 'programmeOfficerName'];
		await this.sendEmail(
			this.#templateIds.assignedCaseProgrammeOfficer,
			email,
			{ personalisation },
			fields,
			'assigned case programme officer'
		);
	}

	/**
	 * @param {string} email - Recipients email address
	 * @param {import('./types.js').SelfAssignedCasePersonalisation} personalisation
	 * @returns {Promise<void>}
	 */
	async sendSelfAssignedCaseEmail(email, personalisation) {
		const fields = ['inspectorName', 'assignmentDate', 'selectedCases'];
		await this.sendEmail(this.#templateIds.selfAssignedCase, email, { personalisation }, fields, 'self assigned case');
	}

	/**
	 * @param {string} email - Recipients email address
	 * @param {import('./types.js').SelfAssignedCaseProgrammeOfficerPersonalisation} personalisation
	 * @returns {Promise<void>}
	 */
	async sendSelfAssignedCaseProgrammeOfficerEmail(email, personalisation) {
		const fields = ['inspectorName', 'assignmentDate', 'selectedCases', 'programmeOfficerName'];
		await this.sendEmail(
			this.#templateIds.selfAssignedCaseProgrammeOfficer,
			email,
			{ personalisation },
			fields,
			'self assigned case programme officer'
		);
	}

	/**
	 * @param {string} templateId - Gov Notify email template id
	 * @param {string} emailAddress - Recipients email address
	 * @param {GovNotifyOptions} options - Options to pass to Gov Notify
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
			throw new Error(`email failed to dispatch: ${e.message}`);
		}
	}

	async getNotificationById(notificationId) {
		try {
			this.logger.info(`fetching notification by ID: ${notificationId}`);
			return await this.notifyClient.getNotificationById(notificationId);
		} catch (e) {
			this.logger.error({ error: e, notificationId }, 'failed to fetch notification by ID');
			throw new Error(`failed to fetch notification: ${e.message}`);
		}
	}
}
