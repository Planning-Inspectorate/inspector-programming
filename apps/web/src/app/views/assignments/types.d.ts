export interface AssignmentPersonViewModel {
	id: string;
	name: string;
	email: string;
}

export interface AssignmentRowViewModel {
	inspectorId: string;
	inspectorName: string;
	inspectorEmail: string | null;
	programmerId: string | null;
	programmerName: string | null;
	programmerEmail: string | null;
	lastUpdated: string | null;
}

export interface AssignmentFormErrors {
	inspectorId?: { text: string };
	programmerId?: { text: string };
}

export interface AssignmentsViewModel {
	pageHeading: string;
	containerClasses: string;
	isAssignmentsPage: boolean;
	inspectorOptions: AssignmentPersonViewModel[];
	programmerOptions: AssignmentPersonViewModel[];
	assignments: AssignmentRowViewModel[];
	assignedInspectorIds: string[];
	form: {
		inspectorId?: string;
		programmerId?: string;
	};
	errors: AssignmentFormErrors;
	errorSummary: { text: string; href: string }[];
	successMessage?: string;
}
