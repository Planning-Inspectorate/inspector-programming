export interface MockData {
	inspectors: Inspector[];
	events: CalendarEvent[];
}

export interface Inspector {
	id: string;
	displayName: string;
	email: string;
	groupId: string;
}

export interface CalendarEvent {
	id: string;
	userEmail: string;
	title: string;
	startDate: Date | string;
	endDate: Date | string;
}
