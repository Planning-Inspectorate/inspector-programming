import { AppealHASCase, AppealS78Case } from '@planning-inspectorate/data-model/src/schemas.d.ts';
import { Event } from '@microsoft/microsoft-graph-types';
import { AppealCaseSpecialism } from '@pins/inspector-programming-database/src/client/client.ts';
import { Inspector } from '@pins/inspector-programming-database/src/client/client.ts';
import { Prisma } from '@pins/inspector-programming-database/src/client/client.ts';

export type AppealCase = AppealHASCase | AppealS78Case;
export type CalendarEvent = Event;
export interface FetchCasesResponse {
	cases: AppealCase[];
	total: number;
}

export interface CaseViewModel {
	caseReference: string | null;
	caseId: number | null;
	caseType: string | null;
	caseProcedure: string | null;
	allocationBand: string | number | null;
	caseLevel: string | null;
	siteAddressPostcode: string | null;
	siteAddressLongitude: number | null;
	siteAddressLatitude: number | null;
	lpaName: string | null;
	lpaRegion: string | null;
	caseStatus: string | null;
	caseAge: number;
	caseAgeColor?: string;
	linkedCaseReferences: string[];
	caseReceivedDate: Date | null;
	finalCommentsDate: Date | string;
	linkedCases: number;
	linkedCaseStatus: string | null;
	selected: boolean | null;
	specialisms: AppealCaseSpecialism[] | null;
	specialismList: string | null;
	leadCaseReference: string | null;
}

export interface Filters {
	minimumAge?: string;
	maximumAge?: string;
	inspectorCoordinates?: Coordinates;
	caseSpecialisms?: string[];
	lpaRegion?: string[];
}

export interface FilterQuery {
	clearFiltersUrl: string;
	buildUrlWithoutFilter: (keyType: string, valueToRemove?: string) => string;
	case?: FilterCaseQuery;
	limit?: number;
	page?: number;
	sort?: string | 'age' | 'distance';
	inspectorId?: string;
}

export interface InspectorViewModel extends Inspector {
	specialisms: Specialism[];
	specialismsList: string;
}

export interface Specialism {
	name: string;
	proficiency: string;
	validFrom: Date | string;
}

export interface Coordinates {
	lat: Decimal | number | null;
	lng: Decimal | number | null;
}

export interface CbosSingleAppealResponse {
	agent?: {
		/** @example 199 */
		serviceUserId?: number;
		/** @example "Some" */
		firstName?: string;
		/** @example "User" */
		lastName?: string;
		/** @example "Some Company" */
		organisationName?: string;
		/** @example "an email address" */
		email?: string;
		phoneNumber?: any;
	};
	appellant?: {
		/** @example 200 */
		serviceUserId?: number;
		/** @example "Another" */
		firstName?: string;
		/** @example "User" */
		lastName?: string;
		organisationName?: any;
		phoneNumber?: any;
	};
	allocationDetails?: {
		level: string;
		band: number;
		specialisms: string[];
	};
	/** @example 118 */
	appealId?: number;
	/** @example "6000118" */
	appealReference?: string;
	appealSite?: {
		/** @example 122 */
		addressId?: number;
		/** @example "FOR TRAINERS ONLY" */
		addressLine1?: string;
		/** @example "44 Rivervale" */
		addressLine2?: string;
		/** @example "Bridport" */
		town?: string;
		/** @example "DT6 5RN" */
		postCode?: string;
		/** NOT IN ORIGINAL APPEALS BACKOFFICE TYPE */
		county?: string;
	};
	costs?: {
		appellantApplicationFolder?: {
			/** @example "118" */
			caseId?: string;
			/** @example [] */
			documents?: any[];
			/** @example 2200 */
			folderId?: number;
			/** @example "costs/appellantApplication" */
			path?: string;
		};
		appellantWithdrawalFolder?: {
			/** @example "118" */
			caseId?: string;
			/** @example [] */
			documents?: any[];
			/** @example 2201 */
			folderId?: number;
			/** @example "costs/appellantWithdrawal" */
			path?: string;
		};
		appellantCorrespondenceFolder?: {
			/** @example "118" */
			caseId?: string;
			/** @example [] */
			documents?: any[];
			/** @example 2202 */
			folderId?: number;
			/** @example "costs/appellantCorrespondence" */
			path?: string;
		};
		lpaApplicationFolder?: {
			/** @example "118" */
			caseId?: string;
			/** @example [] */
			documents?: any[];
			/** @example 2300 */
			folderId?: number;
			/** @example "costs/lpaApplication" */
			path?: string;
		};
		lpaWithdrawalFolder?: {
			/** @example "118" */
			caseId?: string;
			/** @example [] */
			documents?: any[];
			/** @example 2301 */
			folderId?: number;
			/** @example "costs/lpaWithdrawal" */
			path?: string;
		};
		lpaCorrespondenceFolder?: {
			/** @example "118" */
			caseId?: string;
			/** @example [] */
			documents?: any[];
			/** @example 2302 */
			folderId?: number;
			/** @example "costs/lpaCorrespondence" */
			path?: string;
		};
		appellantDecisionFolder?: {
			/** @example "118" */
			caseId?: string;
			/** @example [] */
			documents?: any[];
			/** @example 2401 */
			folderId?: number;
			/** @example "costs/appellantDecision" */
			path?: string;
		};
		lpaDecisionFolder?: {
			/** @example "118" */
			caseId?: string;
			/** @example [] */
			documents?: any[];
			/** @example 2402 */
			folderId?: number;
			/** @example "costs/lpaDecision" */
			path?: string;
		};
	};
	internalCorrespondence?: {
		crossTeam?: {
			/** @example "118" */
			caseId?: string;
			/** @example [] */
			documents?: any[];
			/** @example 2121 */
			folderId?: number;
			/** @example "internal/crossTeamCorrespondence" */
			path?: string;
		};
		inspector?: {
			/** @example "118" */
			caseId?: string;
			/** @example [] */
			documents?: any[];
			/** @example 2122 */
			folderId?: number;
			/** @example "internal/inspectorCorrespondence" */
			path?: string;
		};
		mainParty?: {
			/** @example "118" */
			caseId?: string;
			/** @example [] */
			documents?: any[];
			/** @example 2123 */
			folderId?: number;
			/** @example "internal/mainPartyCorrespondence" */
			path?: string;
		};
	};
	/** @example [] */
	neighbouringSites?: any[];
	/** @example "ready_to_start" */
	appealStatus?: string;
	appealTimetable?: any;
	/** @example "Householder" */
	appealType?: string;
	/** @example 118 */
	appellantCaseId?: number;
	/** @example "00000000-0000-0000-0000-000000000000" */
	caseOfficer?: string;
	decision?: {
		/** @example 2124 */
		folderId?: number;
	};
	healthAndSafety?: {
		appellantCase?: {
			details?: any;
			/** @example false */
			hasIssues?: boolean;
		};
		lpaQuestionnaire?: {
			/** @example true */
			hasIssues?: boolean;
		};
	};
	inspector?: any;
	inspectorAccess?: {
		appellantCase?: {
			details?: any;
			/** @example false */
			isRequired?: boolean;
		};
		lpaQuestionnaire?: {
			/** @example true */
			isRequired?: boolean;
		};
	};
	/** @example [] */
	otherAppeals?: any[];
	linkedAppeals?: {
		/** @example 120 */
		appealId?: number;
		/** @example "6000120" */
		appealReference?: string;
		/** @example true */
		isParentAppeal?: boolean;
		/** @example "2024-06-26T11:57:40.270Z" */
		linkingDate?: string;
		/** @example "(D) Householder" */
		appealType?: string;
		/** @example 24 */
		relationshipId?: number;
		/** @example false */
		externalSource?: boolean;
	}[];
	/** @example true */
	awaitingLinkedAppeal?: boolean;
	costsDecision?: {
		/** @example false */
		awaitingAppellantCostsDecision?: boolean;
		/** @example false */
		awaitingLpaCostsDecision?: boolean;
	};
	/** @example false */
	isParentAppeal?: boolean;
	/** @example true */
	isChildAppeal?: boolean;
	/** @example "Some Borough Council" */
	localPlanningDepartment?: string;
	/** @example "lpa@example.com" */
	lpaEmailAddress?: string;
	lpaQuestionnaireId?: any;
	lpaRegion: string; //NOT IN ORIGINAL APPEALS BACKOFFICE TYPE
	/** @example "52279/APP/1/151419" */
	planningApplicationReference?: string;
	/** @example "Written" */
	procedureType?: string;
	/** @example "2024-06-26T11:57:39.953Z" */
	createdAt?: string;
	startedAt?: any;
	/** @example "2024-06-12T22:57:37.724Z" */
	validAt?: string;
	documentationSummary?: {
		appellantCase?: {
			/** @example "received" */
			status?: string;
			dueDate?: any;
			/** @example "2024-06-26T11:57:39.953Z" */
			receivedAt?: string;
		};
		lpaQuestionnaire?: {
			/** @example "not_received" */
			status?: string;
		};
	};
	/** @example [] */
	stateList?: any[];
	/** @example ["awaiting_event"] */
	completedStateList?: string[];
}

export interface CbosLpaResponse {
	id: number;
	name: string;
	lpaCode: string;
	email: string;
}

export interface AppealCaseModel {
	caseId: string | number;
	caseReference: string;
	caseType: string;
	caseStatus: string;
	caseProcedure: string;
	originalDevelopmentDescription: string;
	allocationLevel: string;
	allocationBand: number | undefined;
	siteAddressLine1: string;
	siteAddressLine2: string;
	siteAddressTown: string;
	siteAddressCounty: string;
	siteAddressPostcode: string;
	siteAddressLatitude: Prisma.Decimal | number | undefined;
	siteAddressLongitude: Prisma.Decimal | number | undefined;
	lpaCode: string;
	lpaName: string;
	caseCreatedDate: Date | null;
	caseValidDate: Date | null;
	finalCommentsDueDate: Date | null;
	linkedCaseStatus: string;
	leadCaseReference: string | undefined;
	childCaseReferences: {
		caseReference: string;
	}[];
}

export interface CbosAppealTypes {
	id: number;
	type: string;
	key: string;
	processCode: string;
	enabled: boolean;
}
