export interface CalendarEvent {
	id: string;
	userEmail: string;
	title: string;
	startDate: string;
	endDate: string;
	isAllDay?: boolean;
	isOutOfOffice?: boolean;
	status?: string;
	systemEvent: boolean;
	caseReference?: string;
	eventType?: string;
	sensitivity: string;
}

export interface NamedTestDates {
	oneDayAgo: Date;
	twoDaysAgo: Date;
	threeDaysAgo: Date;
	fourDaysAgo: Date;
	oneDayAhead: Date;
	twoDaysAhead: Date;
	threeDaysAhead: Date;
}
