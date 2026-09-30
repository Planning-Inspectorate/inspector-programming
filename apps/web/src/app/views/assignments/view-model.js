import { formatDateForDisplay } from '@pins/inspector-programming-lib/util/date.js';

/**
 * @param {import('@pins/inspector-programming-lib/data/types.js').InspectorViewModel} inspector
 * @returns {import('./types.js').AssignmentPersonViewModel}
 */
export function toInspectorOption(inspector) {
	return {
		id: inspector.id,
		name: `${inspector.firstName} ${inspector.lastName}`.trim(),
		email: inspector.emailAddress || null
	};
}

/**
 * Builds a lookup of inspectorId -> assignment, from the raw list of assignments returned by the database.
 * @param {import('@pins/inspector-programming-lib/data/database/assignment-client.js').InspectorProgrammerAssignment[]} assignments
 * @returns {Map<string, import('@pins/inspector-programming-lib/data/database/assignment-client.js').InspectorProgrammerAssignment>}
 */
function toAssignmentsByInspectorId(assignments) {
	return new Map(assignments.map((assignment) => [assignment.inspectorId, assignment]));
}

/**
 * Builds a single assignment grid row for an inspector, combined with their assignment (if any).
 *
 * @param {import('@pins/inspector-programming-lib/data/types.js').InspectorViewModel} inspector
 * @param {import('@pins/inspector-programming-lib/data/database/assignment-client.js').InspectorProgrammerAssignment} [assignment]
 * @param {import('./types.js').AssignmentPersonViewModel[]} programmers
 * @returns {import('./types.js').AssignmentRowViewModel}
 */
export function toAssignmentRow(inspector, assignment, programmers) {
	const programmer = programmers.find((item) => item.id === assignment?.programmerId);

	return {
		inspectorId: inspector.id,
		inspectorName: `${inspector.firstName} ${inspector.lastName}`.trim(),
		inspectorEmail: inspector.emailAddress || null,
		programmerId: assignment?.programmerId || null,
		programmerName: assignment ? programmer?.name : null,
		programmerEmail: programmer?.email || null,
		lastUpdated: assignment?.updatedAt
			? formatDateForDisplay(assignment.updatedAt, { format: 'dd MMM yyyy HH:mm' })
			: null
	};
}

/**
 * Builds the rows for the assignment grid - one row per inspector, sorted by inspector name.
 *
 * @param {import('@pins/inspector-programming-lib/data/types.js').InspectorViewModel[]} inspectors
 * @param {import('@pins/inspector-programming-lib/data/database/assignment-client.js').InspectorProgrammerAssignment[]} assignments
 * @param {import('./types.js').AssignmentPersonViewModel[]} programmers
 * @returns {import('./types.js').AssignmentRowViewModel[]}
 */
export function toAssignmentRows(inspectors, assignments, programmers) {
	const assignmentsByInspectorId = toAssignmentsByInspectorId(assignments);

	return inspectors
		.map((inspector) => toAssignmentRow(inspector, assignmentsByInspectorId.get(inspector.id), programmers))
		.sort((a, b) => a.inspectorName.localeCompare(b.inspectorName));
}

/**
 * @param {import('@pins/inspector-programming-lib/data/types.js').InspectorViewModel[]} inspectors
 * @param {import('./types.js').AssignmentPersonViewModel[]} programmers
 * @param {import('@pins/inspector-programming-lib/data/database/assignment-client.js').InspectorProgrammerAssignment[]} assignments
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
		assignments: toAssignmentRows(inspectors, assignments, programmers),
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
