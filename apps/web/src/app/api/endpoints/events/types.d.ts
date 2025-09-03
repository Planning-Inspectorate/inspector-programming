export interface CalendarEvent {
	id: string;
	userEmail: string;
	title: string;
	startDate: string;
	endDate: string;
	isAllDay?: boolean;
	isOutOfOffice?: boolean;
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
