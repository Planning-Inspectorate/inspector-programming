export interface NotifyConfig {
	disabled: boolean;
	apiKey: string;
	templateIds: TemplateIds;
}

export interface TemplateIds {
	assignedCase: string;
	assignedCaseProgrammeOfficer: string;
	selfAssignedCase: string;
	selfAssignedCaseProgrammeOfficer: string;
}

export interface GovNotifyOptions {
	personalisation: {
		[key: string]: string;
	};
	reference?: string;
	oneClickUnsubscribeURL?: string;
	emailReplyToId?: string;
}

export interface AssignedCasePersonalisation extends SelfAssignedCasePersonalisation {
	cbosLink: string;
}

export interface AssignedCaseProgrammeOfficerPersonalisation extends AssignedCasePersonalisation {
	programmeOfficerName: string;
}

export interface SelfAssignedCasePersonalisation {
	[key: string]: string; // satisfies the GovNotifyOptions personalisation type

	inspectorName: string;
	assignmentDate: string;
	selectedCases: string;
}

export interface SelfAssignedCaseProgrammeOfficerPersonalisation extends SelfAssignedCasePersonalisation {
	programmeOfficerName: string;
}
