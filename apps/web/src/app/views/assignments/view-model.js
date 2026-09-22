import { formatDateForDisplay } from '@pins/inspector-programming-lib/util/date.js';

/**
 * @param {import('@pins/inspector-programming-database/src/client/client.ts').Inspector} inspector
 * @returns {import('./types.js').InspectorOptionViewModel}
 */
export function toInspectorOption(inspector) {
	return {
		id: inspector.id,
		name: `${inspector.firstName} ${inspector.lastName}`.trim(),
		email: inspector.email || null
	};
}

/**
 * Builds a lookup of inspectorId -> assignment, from the raw list of assignments returned by the database.
 * @param {import('@pins/inspector-programming-database/src/client/client.ts').InspectorProgrammerAssignment[]} assignments
 * @returns {Map<string, import('@pins/inspector-programming-database/src/client/client.ts').InspectorProgrammerAssignment>}
 */
function toAssignmentsByInspectorId(assignments) {
	return new Map(assignments.map((assignment) => [assignment.inspectorId, assignment]));
}

/**
 * Builds a single assignment grid row for an inspector, combined with their assignment (if any).
 *
 * @param {import('@pins/inspector-programming-database/src/client/client.ts').Inspector} inspector
 * @param {import('@pins/inspector-programming-database/src/client/client.ts').InspectorProgrammerAssignment} [assignment]
 * @returns {import('./types.js').AssignmentRowViewModel}
 */
export function toAssignmentRow(inspector, assignment) {
	return {
		inspectorId: inspector.id,
		inspectorName: `${inspector.firstName} ${inspector.lastName}`.trim(),
		inspectorEmail: inspector.email || null,
		programmerId: assignment?.programmerId || null,
		programmerName: assignment?.programmerName || null,
		programmerEmail: assignment?.programmerEmail || null,
		lastUpdated: assignment?.updatedAt
			? formatDateForDisplay(assignment.updatedAt, { format: 'dd MMM yyyy HH:mm' })
			: null
	};
}

/**
 * Builds the rows for the assignment grid - one row per inspector, sorted by inspector name.
 *
 * @param {import('@pins/inspector-programming-database/src/client/client.ts').Inspector[]} inspectors
 * @param {import('@pins/inspector-programming-database/src/client/client.ts').InspectorProgrammerAssignment[]} assignments
 * @returns {import('./types.js').AssignmentRowViewModel[]}
 */
export function toAssignmentRows(inspectors, assignments) {
	const assignmentsByInspectorId = toAssignmentsByInspectorId(assignments);

	return inspectors
		.map((inspector) => toAssignmentRow(inspector, assignmentsByInspectorId.get(inspector.id)))
		.sort((a, b) => a.inspectorName.localeCompare(b.inspectorName));
}

/**
 * @param {import('@pins/inspector-programming-lib/data/types.js').InspectorViewModel[]|import('@pins/inspector-programming-database/src/client/client.ts').Inspector[]} inspectors
 * @param {import('../../programmer/programmer.js').ProgrammerViewModel[]|import('./types.js').ProgrammerViewModel[]} programmers
 * @param {import('@pins/inspector-programming-database/src/client/client.ts').InspectorProgrammerAssignment[]} assignments
 * @param {{inspectorId?: string, programmerId?: string}} formData
 * @param {import('./types.js').AssignmentFormErrors} errors
 * @param {string} [successMessage]
 * @returns {import('./types.js').AssignmentsViewModel}
 */
export function assignmentsViewModel(inspectors, programmers, assignments, formData, errors, successMessage) {
	const errorSummary = Object.entries(errors || {}).map(([key, error]) => ({
		text: error.text,
		href: `#${key}`
	}));

	return {
		pageHeading: 'Assign inspectors to programmers',
		containerClasses: 'pins-container-wide',
		isAssignmentsPage: true,
		inspectorOptions: inspectors.map(toInspectorOption).sort((a, b) => a.name.localeCompare(b.name)),
		programmerOptions: programmers,
		assignments: toAssignmentRows(inspectors, assignments),
		assignedInspectorIds: assignments.map((assignment) => assignment.inspectorId),
		form: {
			inspectorId: formData?.inspectorId,
			programmerId: formData?.programmerId
		},
		errors: errors || {},
		errorSummary,
		successMessage
	};
}
